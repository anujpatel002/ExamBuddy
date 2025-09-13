import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import Note from '../models/noteModel.js';

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  console.log('Request query params:', req.query);
  const { search, planFilter, statusFilter } = req.query;
  
  let query = {};
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (planFilter && planFilter !== 'all') {
    query['subscription.plan'] = planFilter;
  }
  
  if (statusFilter && statusFilter !== 'all') {
    query.isVerified = statusFilter === 'verified';
  }
  
  console.log('Final query:', JSON.stringify(query));
  
  // Test query without filters first
  const allUsers = await User.find({}).select('-password').sort({ createdAt: -1 });
  console.log(`Total users in DB: ${allUsers.length}`);
  
  const users = await User.find(query).select('-password').sort({ createdAt: -1 });
  console.log(`Found ${users.length} users with filters`);
  
  if (users.length > 0) {
    console.log('Sample user plan:', users[0].subscription?.plan);
    console.log('Sample user verified:', users[0].isVerified);
  }
  res.json(users);
});

// @desc    Get all notes (for admin overview)
// @route   GET /api/admin/notes
// @access  Private/Admin
const getAllNotes = asyncHandler(async (req, res) => {
    const notes = await Note.find({}).populate('user', 'name email').sort({ createdAt: -1 });
    res.json(notes);
});

// @desc    Approve a note
// @route   PUT /api/admin/notes/:id/approve
// @access  Private/Admin
const approveNote = asyncHandler(async (req, res) => {
    const note = await Note.findById(req.params.id);

    if (note) {
        note.status = 'approved';
        const updatedNote = await note.save();
        res.json(updatedNote);
    } else {
        res.status(404);
        throw new Error('Note not found');
    }
});

// @desc    Upgrade user plan (Admin only)
// @route   PUT /api/admin/users/:id/upgrade-plan
// @access  Private/Admin
const upgradeUserPlan = asyncHandler(async (req, res) => {
  const { plan, months, action = 'add' } = req.body; // action can be 'add' or 'subtract'
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const validPlans = ['free', 'pro', 'premium', 'ultra'];
  if (!validPlans.includes(plan)) {
    res.status(400);
    throw new Error('Invalid plan specified');
  }

  if (plan !== 'free' && (!months || Math.abs(months) < 1 || Math.abs(months) > 120)) {
    res.status(400);
    throw new Error('Months is required and must be between 1 and 120 (10 years)');
  }

  // Save current plan to history
  user.subscription.planHistory.push({
    plan: user.subscription.plan,
    startDate: user.subscription.startDate,
    endDate: user.subscription.endDate,
    changedBy: `Admin: ${req.user.name}`,
    reason: `Admin ${action} ${Math.abs(months)} months to ${plan} plan`
  });

  user.subscription.previousPlan = user.subscription.plan;
  user.subscription.plan = plan;
  user.subscription.status = plan === 'free' ? 'inactive' : 'active';
  user.subscription.paymentMethod = 'admin';
  
  if (plan !== 'free') {
    let newEndDate;
    
    // Check if this is a plan switch (different plan) vs time adjustment (same plan)
    if (plan !== user.subscription.plan && user.subscription.plan !== 'free') {
      // Plan switch - calculate bonus days
      const planPrices = { pro: 149, premium: 399, ultra: 699 };
      const currentPlanPrice = planPrices[user.subscription.plan];
      const newPlanPrice = planPrices[plan];
      const remainingDays = user.getRemainingDays() || 0;
      
      if (currentPlanPrice && newPlanPrice && remainingDays > 0 && newPlanPrice < currentPlanPrice) {
        // Downgrade - calculate bonus days
        const dailyValueCurrent = currentPlanPrice / 30;
        const remainingValue = remainingDays * dailyValueCurrent;
        const extraValue = remainingValue - newPlanPrice; // Value after deducting base plan cost
        const extraDays = extraValue > 0 ? Math.floor((extraValue / newPlanPrice) * 30) : 0;
        const totalDays = 30 + extraDays; // Base 30 days + extra days
        const bonusDays = totalDays;
        
        newEndDate = new Date();
        newEndDate.setHours(0, 0, 0, 0);
        newEndDate.setDate(newEndDate.getDate() + totalDays);
        
        user.subscription.startDate = new Date();
        user.subscription.startDate.setHours(0, 0, 0, 0);
      } else {
        // Upgrade or same price - start fresh with specified months
        newEndDate = new Date();
        newEndDate.setHours(0, 0, 0, 0);
        newEndDate.setMonth(newEndDate.getMonth() + parseInt(months));
        
        user.subscription.startDate = new Date();
        user.subscription.startDate.setHours(0, 0, 0, 0);
      }
    } else {
      // Same plan - add/subtract time
      let currentEndDate = user.subscription.endDate || new Date();
      
      if (!user.subscription.endDate || currentEndDate < new Date()) {
        currentEndDate = new Date();
        currentEndDate.setHours(0, 0, 0, 0);
        user.subscription.startDate = currentEndDate;
      }
      
      newEndDate = new Date(currentEndDate);
      if (action === 'subtract') {
        newEndDate.setMonth(newEndDate.getMonth() - parseInt(months));
      } else {
        newEndDate.setMonth(newEndDate.getMonth() + parseInt(months));
      }
      
      const now = new Date();
      if (newEndDate < now) {
        newEndDate.setTime(now.getTime());
      }
    }
    
    user.subscription.endDate = newEndDate;
    user.subscription.nextBillingDate = newEndDate;
  } else {
    user.subscription.endDate = null;
    user.subscription.nextBillingDate = null;
  }
  
  user.subscription.billingCycle = 'monthly';
  
  await user.save();
  
  console.log(`Admin ${req.user.name} ${action}ed ${Math.abs(months)} months to user ${user.email} ${plan} plan`);
  console.log(`New subscription details:`, {
    plan: user.subscription.plan,
    startDate: user.subscription.startDate,
    endDate: user.subscription.endDate,
    status: user.subscription.status,
    remainingDays: user.getRemainingDays()
  });
  
  // Emit socket event to notify user of plan update
  try {
    const userSocketId = req.userSocketMap[user._id.toString()];
    console.log(`Attempting to notify user ${user._id} via socket. Socket ID: ${userSocketId}`);
    
    if (userSocketId) {
      req.io.to(userSocketId).emit('plan-updated', {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          subscription: user.subscription,
          usage: user.usage,
          gamification: user.gamification
        }
      });
      console.log(`Socket event sent to user ${user.email}`);
    } else {
      console.log(`User ${user.email} not connected via socket`);
    }
  } catch (error) {
    console.log('Socket emission failed:', error.message);
  }
  
  res.json({
    message: `User plan upgraded to ${plan} for ${months} months`,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      subscription: user.subscription
    }
  });
});

// @desc    Calculate plan switch bonus days
// @route   POST /api/admin/calculate-plan-switch
// @access  Private/Admin
const calculatePlanSwitch = asyncHandler(async (req, res) => {
  const { userId, newPlan } = req.body;
  const user = await User.findById(userId);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const planPrices = { pro: 149, premium: 399, ultra: 699 };
  const currentPlan = user.subscription.plan;
  const remainingDays = user.getRemainingDays() || 0;
  
  if (currentPlan === 'free' || remainingDays <= 0) {
    return res.json({ bonusDays: 0, message: 'No bonus days available' });
  }

  const currentPlanPrice = planPrices[currentPlan];
  const newPlanPrice = planPrices[newPlan];
  
  if (!currentPlanPrice || !newPlanPrice || newPlanPrice >= currentPlanPrice) {
    return res.json({ bonusDays: 0, message: 'No bonus days for upgrade or same plan' });
  }

  // Calculate remaining value and extra days after base plan cost
  const dailyValueCurrent = currentPlanPrice / 30;
  const remainingValue = remainingDays * dailyValueCurrent;
  const extraValue = remainingValue - newPlanPrice; // Value after deducting base plan cost
  const extraDays = extraValue > 0 ? Math.floor((extraValue / newPlanPrice) * 30) : 0;
  const bonusDays = extraDays; // Only show extra days for display

  res.json({
    bonusDays,
    currentPlan,
    newPlan,
    remainingDays,
    message: `Switching from ${currentPlan} to ${newPlan} will give you ${bonusDays} extra days`
  });
});

export { getUsers, getAllNotes, approveNote, upgradeUserPlan, calculatePlanSwitch };