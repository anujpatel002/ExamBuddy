import express from 'express';
import mongoose from 'mongoose';
import { protect, admin } from '../middleware/authMiddleware.js';
import { upgradeUserPlan } from '../controllers/adminController.js';
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

// Get all users with advanced filtering and pagination
router.get('/users', protect, admin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      plan = '', 
      status = '', 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;
    
    // Build filter query
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (plan) filter['subscription.plan'] = plan;
    if (status) filter['subscription.status'] = status;
    
    // Build sort query
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const users = await User.find(filter)
      .select('-password -emailVerificationToken')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    const totalUsers = await User.countDocuments(filter);
    
    const usersWithDetails = await Promise.all(users.map(async (user) => {
      const userObj = user.toObject();
      userObj.isSubscriptionActive = user.isSubscriptionActive();
      userObj.remainingDays = user.getRemainingDays();
      
      // Get user stats
      const noteCount = await Note.countDocuments({ user: user._id });
      const subjectCount = await Subject.countDocuments({ user: user._id });
      const quizCount = await Quiz.countDocuments({ createdBy: user._id });
      
      userObj.stats = {
        notes: noteCount,
        subjects: subjectCount,
        quizzes: quizCount
      };
      
      return userObj;
    }));
    
    res.json({
      users: usersWithDetails,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / parseInt(limit)),
        totalUsers,
        hasNext: skip + parseInt(limit) < totalUsers,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user full details with data
router.get('/users/:id/details', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get user's subjects, notes, and quizzes
    const subjects = await Subject.find({ user: req.params.id });
    const notes = await Note.find({ user: req.params.id }).populate('subject', 'name');
    const quizzes = await Quiz.find({ createdBy: req.params.id }).populate('note', 'title');
    
    const userDetails = {
      user: {
        ...user.toObject(),
        isSubscriptionActive: user.isSubscriptionActive(),
        remainingDays: user.getRemainingDays()
      },
      stats: {
        totalSubjects: subjects.length,
        totalNotes: notes.length,
        totalQuizzes: quizzes.length,
        joinedDate: user.createdAt,
        lastActivity: user.updatedAt
      },
      subjects,
      notes: notes.slice(0, 10), // Latest 10 notes
      quizzes: quizzes.slice(0, 5) // Latest 5 quizzes
    };
    
    res.json(userDetails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user subscription details
router.get('/users/:id/subscription', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const subscriptionDetails = {
      ...user.subscription.toObject(),
      isActive: user.isSubscriptionActive(),
      remainingDays: user.getRemainingDays(),
      user: {
        name: user.name,
        email: user.email,
        _id: user._id
      }
    };
    
    res.json(subscriptionDetails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get advanced admin dashboard stats
router.get('/dashboard', protect, admin, async (req, res) => {
  try {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    // User Statistics
    const totalUsers = await User.countDocuments();
    const newUsersThisMonth = await User.countDocuments({ createdAt: { $gte: thisMonth } });
    const newUsersLastMonth = await User.countDocuments({ createdAt: { $gte: lastMonth, $lt: thisMonth } });
    const activeUsers7Days = await User.countDocuments({ updatedAt: { $gte: last7Days } });
    const activeUsers30Days = await User.countDocuments({ updatedAt: { $gte: last30Days } });
    
    // Subscription Statistics
    const activeSubscriptions = await User.countDocuments({ 
      'subscription.plan': { $ne: 'free' },
      'subscription.status': 'active'
    });
    const expiredSubscriptions = await User.countDocuments({ 'subscription.status': 'expired' });
    const expiringThisWeek = await User.countDocuments({
      'subscription.plan': { $ne: 'free' },
      'subscription.endDate': { $gte: now, $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) }
    });
    
    // Content Statistics
    const totalNotes = await Note.countDocuments();
    const totalSubjects = await Subject.countDocuments();
    const totalQuizzes = await Quiz.countDocuments();
    const notesThisMonth = await Note.countDocuments({ createdAt: { $gte: thisMonth } });
    const quizzesThisMonth = await Quiz.countDocuments({ createdAt: { $gte: thisMonth } });
    
    // Plan Distribution
    const planDistribution = await User.aggregate([
      { $group: { _id: '$subscription.plan', count: { $sum: 1 } } }
    ]);
    
    // Revenue Analytics (mock data - replace with actual payment data)
    const monthlyRevenue = await User.aggregate([
      { $match: { 'subscription.plan': { $ne: 'free' }, 'subscription.status': 'active' } },
      { $group: { 
          _id: '$subscription.plan',
          count: { $sum: 1 },
          revenue: { $sum: {
            $switch: {
              branches: [
                { case: { $eq: ['$subscription.plan', 'pro'] }, then: 149 },
                { case: { $eq: ['$subscription.plan', 'premium'] }, then: 399 },
                { case: { $eq: ['$subscription.plan', 'ultra'] }, then: 699 }
              ],
              default: 0
            }
          }}
        }}
    ]);
    
    // User Growth Chart Data (last 30 days)
    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: last30Days } } },
      { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }},
      { $sort: { '_id': 1 } }
    ]);
    
    // Top Users by Activity
    const topUsers = await User.find({
      'usage.requests': { $gt: 0 }
    })
    .select('name email subscription.plan usage.requests createdAt')
    .sort({ 'usage.requests': -1 })
    .limit(10);
    
    res.json({
      overview: {
        totalUsers,
        activeUsers7Days,
        activeUsers30Days,
        newUsersThisMonth,
        userGrowthRate: newUsersLastMonth > 0 ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth * 100).toFixed(1) : 0
      },
      subscriptions: {
        active: activeSubscriptions,
        expired: expiredSubscriptions,
        expiringThisWeek,
        planDistribution: planDistribution.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        monthlyRevenue: monthlyRevenue.reduce((total, plan) => total + plan.revenue, 0)
      },
      content: {
        totalNotes,
        totalSubjects,
        totalQuizzes,
        notesThisMonth,
        quizzesThisMonth,
        avgNotesPerUser: totalUsers > 0 ? (totalNotes / totalUsers).toFixed(1) : 0
      },
      analytics: {
        userGrowth,
        revenueByPlan: monthlyRevenue,
        topUsers
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get admin stats (legacy endpoint)
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

// Update user subscription plan with flexible time period
router.put('/users/:id/subscription', protect, admin, async (req, res) => {
  try {
    const { plan, days, months, years, reason, extendCurrent } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Save current plan to history
    if (user.subscription.plan !== 'free') {
      user.subscription.planHistory.push({
        plan: user.subscription.plan,
        startDate: user.subscription.startDate,
        endDate: user.subscription.endDate,
        changedBy: req.user.name,
        reason: reason || 'Admin update'
      });
    }
    
    // Update subscription
    user.subscription.previousPlan = user.subscription.plan;
    user.subscription.plan = plan;
    user.subscription.status = plan === 'free' ? 'active' : 'active';
    user.subscription.paymentMethod = 'admin';
    
    // Handle start date
    if (!extendCurrent || !user.subscription.startDate) {
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      user.subscription.startDate = startDate;
    }
    
    // Calculate end date with flexible time period
    if (plan !== 'free') {
      let endDate;
      
      if (extendCurrent && user.subscription.endDate && new Date(user.subscription.endDate) > new Date()) {
        // Extend from current end date
        endDate = new Date(user.subscription.endDate);
      } else {
        // Start from today
        endDate = new Date();
        endDate.setHours(0, 0, 0, 0);
      }
      
      // Add time period
      if (days) endDate.setDate(endDate.getDate() + parseInt(days));
      if (months) endDate.setMonth(endDate.getMonth() + parseInt(months));
      if (years) endDate.setFullYear(endDate.getFullYear() + parseInt(years));
      
      user.subscription.endDate = endDate;
      user.subscription.nextBillingDate = endDate;
    } else {
      user.subscription.endDate = null;
      user.subscription.nextBillingDate = null;
    }
    
    await user.save();
    
    // Emit socket event to notify user of plan change
    const socketId = req.userSocketMap?.[req.params.id];
    if (socketId) {
      const updatedUser = await User.findById(req.params.id).select('-password');
      req.io.to(socketId).emit('plan-updated', { user: updatedUser });
    }
    
    const userObj = user.toObject();
    userObj.isSubscriptionActive = user.isSubscriptionActive();
    userObj.remainingDays = user.getRemainingDays();
    
    res.json(userObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin upgrade user plan with time period
router.put('/users/:id/upgrade-plan', protect, admin, upgradeUserPlan);

// Update user plan and credits (legacy endpoint)
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
    const socketId = req.userSocketMap?.[req.params.id];
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

// Bulk user operations
router.post('/users/bulk-action', protect, admin, async (req, res) => {
  try {
    const { action, userIds, data } = req.body;
    
    switch (action) {
      case 'delete':
        await User.deleteMany({ _id: { $in: userIds } });
        await Note.deleteMany({ user: { $in: userIds } });
        await Subject.deleteMany({ user: { $in: userIds } });
        await Quiz.deleteMany({ createdBy: { $in: userIds } });
        break;
        
      case 'updatePlan':
        await User.updateMany(
          { _id: { $in: userIds } },
          { 
            'subscription.plan': data.plan,
            'subscription.status': 'active',
            'subscription.startDate': new Date(),
            'subscription.endDate': new Date(Date.now() + (data.days || 30) * 24 * 60 * 60 * 1000)
          }
        );
        break;
        
      case 'suspend':
        await User.updateMany(
          { _id: { $in: userIds } },
          { 'subscription.status': 'suspended' }
        );
        break;
        
      case 'activate':
        await User.updateMany(
          { _id: { $in: userIds } },
          { 'subscription.status': 'active' }
        );
        break;
    }
    
    res.json({ message: `Bulk ${action} completed for ${userIds.length} users` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// System health check
router.get('/system/health', protect, admin, async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState;
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    // Check recent errors (you'd implement error logging)
    const recentErrors = []; // Placeholder
    
    // Check system performance
    const avgResponseTime = 150; // Placeholder - implement actual monitoring
    
    res.json({
      status: dbStatus === 1 ? 'healthy' : 'unhealthy',
      database: {
        status: dbStatus === 1 ? 'connected' : 'disconnected',
        readyState: dbStatus
      },
      server: {
        uptime: Math.floor(uptime),
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024)
        },
        avgResponseTime
      },
      errors: recentErrors
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;