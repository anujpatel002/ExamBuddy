import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';

// Define the new, profitable monthly credit limits
const PLAN_LIMITS = {
    free: { credits: 20 }, // 20 credits total, one-time
    pro: { credits: 150 }, // 150 credits per month
    premium: { credits: 500 }, // 500 credits per month
    ultra: { credits: 1000 } // 1000 credits per month
};

export const checkApiLimit = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const plan = user.subscription.plan;
  
  if (!user || user.role === 'admin' || plan === 'ultra' || user.email === '25mca100@charusat.edu.in') {
    // Admins, Ultra plan users, and owner have no limits
    return next();
  }

  const baseLimitCredits = PLAN_LIMITS[plan]?.credits || 0;
  const customCredits = user.usage.customCredits || 0;
  const limit = baseLimitCredits + customCredits;
  
  // For free users, this is a one-time limit, not monthly
  if (plan === 'free') {
    if (user.usage.requests >= limit) {
      res.status(429);
      throw new Error(`You have used all your free 20 AI credits. Please upgrade your plan.`);
    }
  } else {
    // For paid users, check monthly usage
    const today = new Date();
    const lastRequest = new Date(user.usage.lastRequestDate);
    // Reset if it's a new month
    if (today.getMonth() !== lastRequest.getMonth() || today.getFullYear() !== lastRequest.getFullYear()) {
        user.usage.requests = 0;
    }

    if (user.usage.requests >= limit) {
      res.status(429);
      throw new Error(`You have exceeded your monthly limit of ${limit} AI credits for the ${plan} plan.`);
    }
  }

  user.usage.requests += 1;
  user.usage.lastRequestDate = new Date();
  await user.save();

  next();
});