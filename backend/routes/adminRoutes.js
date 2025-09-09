import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import User from '../models/userModel.js';
import Note from '../models/noteModel.js';
import Quiz from '../models/quizModel.js';
import Subject from '../models/subjectModel.js';

const router = express.Router();

// Search user by email
router.get('/user-by-email', protect, admin, async (req, res) => {
  try {
    const { email } = req.query;
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('-password -emailVerificationToken');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all users
router.get('/users', protect, admin, async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password -emailVerificationToken')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get admin stats
router.get('/stats', protect, admin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({
      $or: [
        { 'gamification.lastActivityDate': { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        { 'usage.lastRequestDate': { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        { updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
      ]
    });
    const totalNotes = await Note.countDocuments();
    const totalQuizzes = await Quiz.countDocuments();
    
    // Plan distribution
    const planDistribution = await User.aggregate([
      { $group: { _id: '$subscription.plan', count: { $sum: 1 } } }
    ]);
    
    const planStats = {};
    planDistribution.forEach(item => {
      planStats[item._id] = item.count;
    });

    res.json({
      totalUsers,
      activeUsers,
      totalNotes,
      totalQuizzes,
      planDistribution: planStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user plan and credits
router.put('/users/:id', protect, admin, async (req, res) => {
  try {
    const { plan, credits, role } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (plan) user.subscription.plan = plan;
    if (credits !== undefined) user.usage.customCredits = (user.usage.customCredits || 0) + credits;
    if (role) user.role = role;
    await user.save();

    // Emit socket event to notify user of plan change
    const socketId = req.userSocketMap[req.params.id];
    if (socketId) {
      const updatedUser = await User.findById(req.params.id).select('-password');
      req.io.to(socketId).emit('plan-updated', { user: updatedUser });
    }

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete user
router.delete('/users/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user's data
    await Note.deleteMany({ user: req.params.id });
    await Quiz.deleteMany({ createdBy: req.params.id });
    await Subject.deleteMany({ user: req.params.id });
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User and all associated data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;