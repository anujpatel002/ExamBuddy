import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import Note from '../models/noteModel.js';

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const { search, planFilter, statusFilter } = req.query;
  
  let query = {};
  
  // Search by name or email
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  
  // Filter by plan
  if (planFilter && planFilter !== 'all') {
    query['subscription.plan'] = planFilter;
  }
  
  // Filter by verification status
  if (statusFilter && statusFilter !== 'all') {
    if (statusFilter === 'verified') {
      query.isVerified = true;
    } else if (statusFilter === 'unverified') {
      query.isVerified = false;
    }
  }
  
  const users = await User.find(query).select('-password').sort({ createdAt: -1 });
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
    // Calculate new end date by adding/subtracting months
    let currentEndDate = user.subscription.endDate || new Date();
    
    // If no existing end date or it's in the past, start from now
    if (!user.subscription.endDate || currentEndDate < new Date()) {
      currentEndDate = new Date();
      currentEndDate.setHours(0, 0, 0, 0);
      user.subscription.startDate = currentEndDate;
    }
    
    const newEndDate = new Date(currentEndDate);
    if (action === 'subtract') {
      newEndDate.setMonth(newEndDate.getMonth() - parseInt(months));
    } else {
      newEndDate.setMonth(newEndDate.getMonth() + parseInt(months));
    }
    
    // Ensure end date is not in the past
    const now = new Date();
    if (newEndDate < now) {
      newEndDate.setTime(now.getTime());
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

export { getUsers, getAllNotes, approveNote, upgradeUserPlan };