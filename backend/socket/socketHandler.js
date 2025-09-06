// This object will hold the state of active rooms in memory for quick access
const activeRooms = {};

const initializeSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);

    // Create a new study room
    socket.on('createRoom', ({ roomCode, quizId, user }) => {
      socket.join(roomCode);
      activeRooms[roomCode] = {
        quizId,
        host: user.id,
        members: [{ ...user, socketId: socket.id, score: 0 }],
        status: 'waiting',
        currentQuestionIndex: 0,
        answers: {}, // { questionIndex: { userId: answer } }
      };
      io.to(roomCode).emit('roomUpdate', activeRooms[roomCode]);
      console.log(`Room ${roomCode} created by ${user.name}`);
    });

    // Join an existing study room
    socket.on('joinRoom', ({ roomCode, user }) => {
      if (activeRooms[roomCode]) {
        socket.join(roomCode);
        const room = activeRooms[roomCode];
        if (!room.members.find(m => m.id === user.id)) {
          room.members.push({ ...user, socketId: socket.id, score: 0 });
        }
        io.to(roomCode).emit('roomUpdate', room);
        socket.emit('joinSuccess', room); // Confirm join
        console.log(`${user.name} joined room ${roomCode}`);
      } else {
        socket.emit('error', { message: 'Room not found' });
      }
    });
    
    // Start the quiz for everyone in the room
    socket.on('startQuiz', async ({ roomCode }) => {
        const room = activeRooms[roomCode];
        if (room && socket.id === room.members.find(m => m.id === room.host)?.socketId) {
            room.status = 'in-progress';
            io.to(roomCode).emit('quizStarted', { startTime: Date.now() });
            io.to(roomCode).emit('roomUpdate', room);
            console.log(`Quiz started for room ${roomCode}`);
        }
    });

    // Handle answer submission
    socket.on('submitAnswer', ({ roomCode, userId, questionIndex, answer, isCorrect }) => {
        const room = activeRooms[roomCode];
        if (room && room.status === 'in-progress') {
            const member = room.members.find(m => m.id === userId);
            if (member && isCorrect) {
                member.score = (member.score || 0) + 1;
            }
            // Notify everyone of the updated scores
            io.to(roomCode).emit('roomUpdate', room);
        }
    });

    // End the quiz
    socket.on('endQuiz', ({ roomCode }) => {
        const room = activeRooms[roomCode];
        if (room) {
            room.status = 'finished';
            io.to(roomCode).emit('quizEnded', { finalScores: room.members });
            io.to(roomCode).emit('roomUpdate', room);
            // Clean up the room from memory after a delay
            setTimeout(() => delete activeRooms[roomCode], 600000); // 10 mins
        }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      // Handle user leaving a room
      for (const roomCode in activeRooms) {
        const room = activeRooms[roomCode];
        const memberIndex = room.members.findIndex(m => m.socketId === socket.id);
        if (memberIndex > -1) {
            room.members.splice(memberIndex, 1);
            io.to(roomCode).emit('roomUpdate', room);
            // If host leaves, can designate a new host or end room
            if (room.members.length === 0) {
                delete activeRooms[roomCode];
                console.log(`Room ${roomCode} is now empty and has been closed.`);
            }
            break;
        }
      }
    });
  });
};

export default initializeSocket;