import rateLimit from 'express-rate-limit';
import User from '../models/userModel.js';

// Rate limiting specifically for ad endpoints
export const adRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: (req) => {
    // Different limits based on endpoint
    if (req.path.includes('/start')) return 5;  // Max 5 ad starts per minute
    if (req.path.includes('/complete')) return 5; // Max 5 completions per minute
    if (req.path.includes('/eligibility')) return 20; // More lenient for checks
    return 10; // Default
  },
  message: {
    message: 'Too many ad requests. Please wait before trying again.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Anti-fraud middleware for ad completion
export const adFraudPrevention = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check for suspicious patterns
    const now = new Date();
    const recentAds = user.adRewards.adWatchHistory.filter(ad => 
      new Date(ad.watchedAt).getTime() > now.getTime() - (5 * 60 * 1000) // Last 5 minutes
    );

    // Flag 1: Too many ads completed in short time
    if (recentAds.length >= 3) {
      console.log(`🚨 Fraud alert: User ${userId} completed ${recentAds.length} ads in 5 minutes`);
      return res.status(429).json({ 
        message: 'Please wait a few minutes between ad completions for security.',
        suspiciousActivity: true 
      });
    }

    // Flag 2: Check for rapid completions (less than 25 seconds apart)
    const sortedRecentAds = recentAds.sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt));
    if (sortedRecentAds.length >= 2) {
      const timeBetween = new Date(sortedRecentAds[0].watchedAt) - new Date(sortedRecentAds[1].watchedAt);
      if (timeBetween < 25000) { // Less than 25 seconds
        console.log(`🚨 Fraud alert: User ${userId} completed ads ${timeBetween/1000}s apart`);
        return res.status(429).json({ 
          message: 'Ads must be watched completely. Please wait between completions.',
          suspiciousActivity: true 
        });
      }
    }

    // Flag 3: Check daily pattern (unusual spike)
    const today = new Date().toDateString();
    const todayAds = user.adRewards.adWatchHistory.filter(ad => 
      new Date(ad.watchedAt).toDateString() === today
    );
    
    if (todayAds.length >= user.adRewards.dailyAdLimit * 0.8 && recentAds.length >= 2) {
      console.log(`🚨 Fraud alert: User ${userId} near daily limit with rapid completions`);
      // Add extra delay for users near daily limit
      const lastAdTime = Math.max(...todayAds.map(ad => new Date(ad.watchedAt).getTime()));
      const timeSinceLastAd = now.getTime() - lastAdTime;
      
      if (timeSinceLastAd < 60000) { // Less than 1 minute since last ad
        return res.status(429).json({ 
          message: 'Please wait at least 1 minute between ads when approaching daily limit.',
          suspiciousActivity: true 
        });
      }
    }

    // Flag 4: Session token validation
    if (req.path.includes('/complete')) {
      const { adSessionToken } = req.body;
      
      if (!user.adSession || !user.adSession.token) {
        return res.status(401).json({ 
          message: 'No active ad session found.',
          suspiciousActivity: true 
        });
      }

      if (user.adSession.token !== adSessionToken) {
        console.log(`🚨 Fraud alert: User ${userId} invalid session token`);
        return res.status(401).json({ 
          message: 'Invalid ad session token.',
          suspiciousActivity: true 
        });
      }

      // Check session age (should not be too old or too new)
      const sessionAge = now.getTime() - new Date(user.adSession.startTime).getTime();
      if (sessionAge < 20000) { // Less than 20 seconds
        console.log(`🚨 Fraud alert: User ${userId} completed ad in ${sessionAge/1000}s`);
        return res.status(400).json({ 
          message: 'Ad session too short. Please watch the full ad.',
          suspiciousActivity: true 
        });
      }

      if (sessionAge > 300000) { // More than 5 minutes
        return res.status(410).json({ 
          message: 'Ad session expired. Please start a new ad.',
          suspiciousActivity: true 
        });
      }
    }

    next();
  } catch (error) {
    console.error('Ad fraud prevention error:', error);
    res.status(500).json({ message: 'Security check failed' });
  }
};

// Middleware to ensure only free users can access ad rewards
export const freeUsersOnly = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.subscription.plan !== 'free') {
      return res.status(403).json({ 
        message: 'Ad rewards are only available for free plan users',
        currentPlan: user.subscription.plan,
        hint: 'Upgrade users get unlimited AI credits!'
      });
    }

    next();
  } catch (error) {
    console.error('Free users check error:', error);
    res.status(500).json({ message: 'Plan verification failed' });
  }
};

// IP-based rate limiting for additional security
export const ipBasedAdLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Max 50 ad-related requests per IP per hour
  keyGenerator: (req) => {
    // Use IP + user agent for more specific limiting
    return `${req.ip}-${req.get('User-Agent')}`;
  },
  message: {
    message: 'Too many ad requests from this location. Please try again later.',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validate watch duration to prevent manipulation
export const validateWatchDuration = (req, res, next) => {
  if (req.path.includes('/complete')) {
    const { watchDuration } = req.body;
    
    if (typeof watchDuration !== 'number' || watchDuration < 0) {
      return res.status(400).json({ 
        message: 'Invalid watch duration',
        received: watchDuration,
        expected: 'positive number'
      });
    }

    if (watchDuration > 60) { // No ad should be longer than 60 seconds
      console.log(`🚨 Fraud alert: Watch duration ${watchDuration}s is too long`);
      return res.status(400).json({ 
        message: 'Invalid watch duration - too long',
        suspiciousActivity: true 
      });
    }

    if (watchDuration < 20) { // Minimum reasonable watch time
      return res.status(400).json({ 
        message: 'Please watch at least 20 seconds of the ad',
        watchedTime: watchDuration,
        minimumRequired: 20
      });
    }
  }

  next();
};

export default {
  adRateLimit,
  adFraudPrevention,
  freeUsersOnly,
  ipBasedAdLimit,
  validateWatchDuration
};