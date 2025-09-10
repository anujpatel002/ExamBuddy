import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { checkPlanLimit } from '../middleware/planLimits.js';

const router = express.Router();

// In-memory storage for rooms (in production, use Redis or database)
const rooms = {};

// Create room
router.post('/', protect, checkPlanLimit('createStudyRoom'), (req, res) => {
  const { roomCode, quizId, host, hostName } = req.body;
  
  rooms[roomCode] = {
    quizId,
    host,
    hostName,
    members: [{ _id: host, name: hostName, score: 0 }],
    status: 'waiting',
    roomCode
  };
  
  console.log(`Room ${roomCode} created by ${hostName}`);
  res.json(rooms[roomCode]);
});

// Get room
router.get('/:roomCode', protect, (req, res) => {
  const { roomCode } = req.params;
  const room = rooms[roomCode];
  
  if (!room) {
    return res.status(404).json({ message: 'Room not found' });
  }
  
  res.json(room);
});

// Join room
router.put('/:roomCode/join', protect, (req, res) => {
  const { roomCode } = req.params;
  const { userId, userName } = req.body;
  const room = rooms[roomCode];
  
  if (!room) {
    return res.status(404).json({ message: 'Room not found' });
  }
  
  const existingMember = room.members.find(m => m._id === userId);
  if (!existingMember) {
    room.members.push({ _id: userId, name: userName, score: 0 });
    console.log(`${userName} joined room ${roomCode}`);
  }
  
  res.json(room);
});

// Start quiz
router.put('/:roomCode/start', protect, (req, res) => {
  const { roomCode } = req.params;
  const { timePerQuestion } = req.body;
  const room = rooms[roomCode];
  
  if (!room) {
    return res.status(404).json({ message: 'Room not found' });
  }
  
  room.status = 'in-progress';
  room.totalTime = timePerQuestion * 60;
  
  console.log(`Quiz started in room ${roomCode}`);
  res.json(room);
});

// Submit quiz score
router.put('/:roomCode/submit', protect, (req, res) => {
  const { roomCode } = req.params;
  const { userId, score } = req.body;
  const room = rooms[roomCode];
  
  if (!room) {
    return res.status(404).json({ message: 'Room not found' });
  }
  
  // Update user score and mark as submitted
  const member = room.members.find(m => m._id === userId);
  if (member) {
    member.score = score;
    member.submitted = true;
  }
  
  // Check if all users have submitted
  const allSubmitted = room.members.every(m => m.submitted);
  if (allSubmitted) {
    room.status = 'finished';
  }
  
  console.log(`User ${userId} submitted score ${score} in room ${roomCode}`);
  res.json(room);
});

// Delete room (host only)
router.delete('/:roomCode', protect, (req, res) => {
  const { roomCode } = req.params;
  
  if (rooms[roomCode]) {
    delete rooms[roomCode];
    console.log(`Room ${roomCode} deleted by host`);
  }
  
  res.json({ message: 'Room deleted successfully' });
});

// Leave room
router.put('/:roomCode/leave', protect, (req, res) => {
  const { roomCode } = req.params;
  const { userId } = req.body;
  const room = rooms[roomCode];
  
  if (!room) {
    return res.status(404).json({ message: 'Room not found' });
  }
  
  room.members = room.members.filter(m => m._id !== userId);
  
  if (room.members.length === 0) {
    delete rooms[roomCode];
    console.log(`Room ${roomCode} deleted - no members left`);
  }
  
  res.json({ message: 'Left room successfully' });
});

export default router;