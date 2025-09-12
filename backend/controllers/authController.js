import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import generateToken from '../utils/generateToken.js';
import sendEmail from '../utils/sendEmail.js';
import crypto from 'crypto';

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  
  if (!email || !email.includes('@')) {
    res.status(400); throw new Error('Please provide a valid email address.');
  }

  const userExists = await User.findOne({ email: email.toLowerCase() });
  if (userExists) {
    res.status(400); throw new Error('A user with this email already exists.');
  }

  const user = await User.create({ name, email: email.toLowerCase(), password });

  if (user) {
    const verificationToken = user.createEmailVerificationToken();
    user.lastVerificationEmailSent = new Date();
    await user.save({ validateBeforeSave: false });

    const verificationURL = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
    const message = `Welcome to ExamBuddy! Please verify your email by clicking this link: ${verificationURL}`;

    try {
      await sendEmail({ email: user.email, subject: 'ExamBuddy Email Verification', message });
      res.status(201).json({ message: 'Registration successful! Please check your email to verify your account.' });
    } catch (err) {
      console.error(err);
      res.status(500); throw new Error('Email could not be sent.');
    }
  } else {
    res.status(400); throw new Error('Invalid user data');
  }
});

const verifyEmail = asyncHandler(async (req, res) => {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ emailVerificationToken: hashedToken });

    if (!user) {
        res.status(400); throw new Error('Invalid or expired token.');
    }

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        subscription: user.subscription,
        usage: user.usage,
        token: generateToken(user._id),
    });
});

const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (!user.isVerified) {
    const fiveMinutes = 5 * 60 * 1000;
    const lastSent = user.lastVerificationEmailSent?.getTime() || 0;
    
    if (Date.now() - lastSent < fiveMinutes) {
      res.status(429);
      throw new Error('A verification email was recently sent. Please check your inbox or wait a few minutes.');
    }

    const verificationToken = user.createEmailVerificationToken();
    user.lastVerificationEmailSent = new Date();
    await user.save({ validateBeforeSave: false });

    const verificationURL = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
    const message = `You recently attempted to log in. Please verify your email by clicking this link: ${verificationURL}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'ExamBuddy Email Verification',
        message,
      });
      res.status(403);
      throw new Error('Please verify your email. A new verification link has been sent to your inbox.');
    } catch (err) {
      res.status(500);
      throw new Error('Email could not be sent. Please try again later.');
    }
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    subscription: user.subscription,
    usage: user.usage,
    token: generateToken(user._id),
  });
});

const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (user) {
        // Check and update subscription status
        if (!user.isSubscriptionActive() && user.subscription.plan !== 'free' && user.subscription.status === 'active') {
            user.expireSubscription();
            await user.save();
        }
        
        const remainingDays = user.getRemainingDays();
        const isActive = user.isSubscriptionActive();
        
        // Prevent caching of user profile data
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
            subscription: {
                plan: user.subscription.plan,
                status: user.subscription.status,
                startDate: user.subscription.startDate,
                endDate: user.subscription.endDate,
                billingCycle: user.subscription.billingCycle,
                autoRenew: user.subscription.autoRenew,
                paymentMethod: user.subscription.paymentMethod,
                isActive,
                remainingDays
            },
            usage: user.usage,
            gamification: user.gamification
        });
    } else {
        res.status(404); throw new Error('User not found');
    }
});

// Get user subscription status
const getSubscriptionStatus = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (user) {
        // Check and update subscription status
        if (!user.isSubscriptionActive() && user.subscription.plan !== 'free' && user.subscription.status === 'active') {
            user.expireSubscription();
            await user.save();
        }
        
        const remainingDays = user.getRemainingDays();
        const isActive = user.isSubscriptionActive();
        
        // Prevent caching of subscription status
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        
        res.json({
            plan: user.subscription.plan,
            status: user.subscription.status,
            isActive,
            remainingDays,
            endDate: user.subscription.endDate,
            startDate: user.subscription.startDate,
            billingCycle: user.subscription.billingCycle,
            autoRenew: user.subscription.autoRenew,
            paymentMethod: user.subscription.paymentMethod
        });
    } else {
        res.status(404); throw new Error('User not found');
    }
});

// @desc    Calculate plan switch bonus days for current user
// @route   POST /api/auth/calculate-plan-switch
// @access  Private
const calculateUserPlanSwitch = asyncHandler(async (req, res) => {
  const { newPlan } = req.body;
  const user = await User.findById(req.user._id);

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
  const bonusDays = extraDays; // Only show extra days, not including base 30 days

  res.json({
    bonusDays,
    currentPlan,
    newPlan,
    remainingDays,
    message: `Switching from ${currentPlan} to ${newPlan} will give you ${bonusDays} extra days`
  });
});

export { registerUser, authUser, verifyEmail, getUserProfile, getSubscriptionStatus, calculateUserPlanSwitch };