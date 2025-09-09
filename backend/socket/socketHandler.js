// This object will map a userId to their current socketId
const userSocketMap = {};
const studyRooms = {};

const initializeSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);

    // When a user logs in, the frontend will send this event
    socket.on('registerUser', (userId) => {
      userSocketMap[userId] = socket.id;
      console.log(`User ${userId} registered with socket ${socket.id}`);
    });

    // Study Room Events
    socket.on('createRoom', ({ roomCode, quizId, user }) => {
      studyRooms[roomCode] = {
        quizId,
        host: user.id,
        members: [{ _id: user.id, name: user.name, score: 0 }],
        status: 'waiting'
      };
      socket.join(roomCode);
      socket.emit('roomUpdate', studyRooms[roomCode]);
      console.log(`Room ${roomCode} created by ${user.name}:`, studyRooms[roomCode]);
      console.log('All rooms:', Object.keys(studyRooms));
    });

    socket.on('joinRoom', ({ roomCode, user }) => {
      console.log(`Attempting to join room ${roomCode}:`, studyRooms[roomCode]);
      
      if (!studyRooms[roomCode]) {
        console.log(`Room ${roomCode} not found`);
        socket.emit('error', { message: `Room ${roomCode} not found` });
        return;
      }
      
      const room = studyRooms[roomCode];
      const existingMember = room.members.find(m => m._id === user.id);
      
      if (!existingMember) {
        room.members.push({ _id: user.id, name: user.name, score: 0 });
        console.log(`Added ${user.name} to room ${roomCode}`);
      }
      
      socket.join(roomCode);
      socket.emit('roomUpdate', room);
      socket.to(roomCode).emit('roomUpdate', room);
      console.log(`${user.name} joined room ${roomCode}, total members: ${room.members.length}`);
    });

    socket.on('startQuiz', ({ roomCode, timePerQuestion = 30 }) => {
      if (studyRooms[roomCode]) {
        studyRooms[roomCode].status = 'in-progress';
        studyRooms[roomCode].currentQuestion = 0;
        studyRooms[roomCode].timePerQuestion = timePerQuestion;
        io.to(roomCode).emit('quizStarted', { timePerQuestion });
      }
    });

    socket.on('submitAnswer', ({ roomCode, userId, isCorrect }) => {
      if (studyRooms[roomCode] && isCorrect) {
        const member = studyRooms[roomCode].members.find(m => m._id === userId);
        if (member) {
          member.score += 1;
        }
      }
    });

    socket.on('endQuiz', ({ roomCode }) => {
      if (studyRooms[roomCode]) {
        studyRooms[roomCode].status = 'finished';
        io.to(roomCode).emit('quizEnded', { finalScores: studyRooms[roomCode].members });
      }
    });

    socket.on('disconnect', () => {
      // Find and remove the user from the map on disconnect
      for (const userId in userSocketMap) {
        if (userSocketMap[userId] === socket.id) {
          delete userSocketMap[userId];
          console.log(`User ${userId} disconnected.`);
          break;
        }
      }
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
  
  // --- THIS IS THE FIX ---
  // The function must return the userSocketMap so server.js can use it.
  return { userSocketMap };
};

export default initializeSocket;