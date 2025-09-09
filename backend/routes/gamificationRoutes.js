import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getLeaderboard } from '../utils/gamification.js';
import User from '../models/userModel.js';

const router = express.Router();

router.get('/leaderboard', protect, async (req, res) => {
  try {
    const leaderboard = await getLeaderboard(10);
    res.json(leaderboard || []);
  } catch (error) {
    // Return empty leaderboard on error
    res.json([]);
  }
});

router.get('/stats', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('gamification');
    res.json(user?.gamification || {
      currentStreak: 0,
      longestStreak: 0,
      totalPoints: 0,
      weeklyPoints: 0
    });
  } catch (error) {
    // Return default stats on error
    res.json({
      currentStreak: 0,
      longestStreak: 0,
      totalPoints: 0,
      weeklyPoints: 0
    });
  }
});

export default router;