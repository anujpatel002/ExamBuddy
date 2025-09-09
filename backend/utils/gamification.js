import User from '../models/userModel.js';

const POINTS = {
  UPLOAD_NOTE: 10,
  COMPLETE_QUIZ: 15,
  REVIEW_FLASHCARD: 2,
  GENERATE_SUMMARY: 5,
  DAILY_LOGIN: 5
};

export const updateStreak = async (userId) => {
  const user = await User.findById(userId);
  const today = new Date();
  const lastActivity = user.gamification.lastActivityDate;
  
  if (!lastActivity) {
    // First activity
    user.gamification.currentStreak = 1;
    user.gamification.longestStreak = 1;
  } else {
    const daysDiff = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      // Consecutive day
      user.gamification.currentStreak += 1;
      if (user.gamification.currentStreak > user.gamification.longestStreak) {
        user.gamification.longestStreak = user.gamification.currentStreak;
      }
    } else if (daysDiff > 1) {
      // Streak broken
      user.gamification.currentStreak = 1;
    }
    // Same day = no change
  }
  
  user.gamification.lastActivityDate = today;
  await user.save();
  return user.gamification.currentStreak;
};

export const addPoints = async (userId, activity) => {
  const user = await User.findById(userId);
  const points = POINTS[activity] || 0;
  
  // Check if weekly reset needed
  const weeksSinceReset = Math.floor((Date.now() - user.gamification.weeklyReset) / (1000 * 60 * 60 * 24 * 7));
  if (weeksSinceReset >= 1) {
    user.gamification.weeklyPoints = 0;
    user.gamification.weeklyReset = new Date();
  }
  
  user.gamification.totalPoints += points;
  user.gamification.weeklyPoints += points;
  
  await user.save();
  return { points, totalPoints: user.gamification.totalPoints };
};

export const getLeaderboard = async (limit = 10) => {
  const users = await User.find({})
    .select('name gamification.weeklyPoints')
    .sort({ 'gamification.weeklyPoints': -1 })
    .limit(limit);
    
  return users.map((user, index) => ({
    rank: index + 1,
    name: user.name,
    points: user.gamification.weeklyPoints
  }));
};