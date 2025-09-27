import User from '../models/userModel.js';
import { addPoints, updateStreak } from '../utils/gamification.js';

class AdRewardController {
  // Check if user is eligible to watch ads for credits
  async checkAdEligibility(req, res) {
    try {
      const userId = req.user._id;
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Only free plan users can earn credits from ads
      if (user.subscription.plan !== 'free') {
        return res.status(403).json({ 
          message: 'Ad rewards are only available for free plan users',
          eligible: false 
        });
      }

      const today = new Date();
      const lastAdDate = user.adRewards.lastAdWatchDate;
      
      // Reset daily count if it's a new day
      if (!lastAdDate || lastAdDate.toDateString() !== today.toDateString()) {
        user.adRewards.dailyAdsWatched = 0;
        await user.save();
      }

      const canWatchMoreAds = user.adRewards.dailyAdsWatched < user.adRewards.dailyAdLimit;
      
      res.json({
        eligible: canWatchMoreAds,
        dailyAdsWatched: user.adRewards.dailyAdsWatched,
        dailyAdLimit: user.adRewards.dailyAdLimit,
        remainingAds: user.adRewards.dailyAdLimit - user.adRewards.dailyAdsWatched,
        totalCreditsFromAds: user.adRewards.creditsEarnedFromAds
      });
    } catch (error) {
      console.error('Error checking ad eligibility:', error);
      res.status(500).json({ message: 'Server error checking ad eligibility' });
    }
  }

  // Start an ad session
  async startAdSession(req, res) {
    try {
      const userId = req.user._id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Verify eligibility
      if (user.subscription.plan !== 'free') {
        return res.status(403).json({ message: 'Ad rewards only for free users' });
      }

      const today = new Date();
      const lastAdDate = user.adRewards.lastAdWatchDate;
      
      // Reset daily count if new day
      if (!lastAdDate || lastAdDate.toDateString() !== today.toDateString()) {
        user.adRewards.dailyAdsWatched = 0;
      }

      if (user.adRewards.dailyAdsWatched >= user.adRewards.dailyAdLimit) {
        return res.status(429).json({ 
          message: 'Daily ad limit reached. Try again tomorrow.',
          dailyLimit: user.adRewards.dailyAdLimit 
        });
      }

      // Generate ad session token for validation
      const adSessionToken = Math.random().toString(36).substring(2, 15);
      const adSessionExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Store session in user temporarily (in production, use Redis)
      user.adSession = {
        token: adSessionToken,
        startTime: new Date(),
        expiryTime: adSessionExpiry,
        completed: false
      };
      
      await user.save();

      res.json({
        adSessionToken,
        adDuration: 30, // 30 seconds
        creditsToEarn: 1,
        message: 'Ad session started. Watch the full ad to earn credit.'
      });
    } catch (error) {
      console.error('Error starting ad session:', error);
      res.status(500).json({ message: 'Server error starting ad session' });
    }
  }

  // Complete ad and award credits
  async completeAd(req, res) {
    try {
      const userId = req.user._id;
      const { adSessionToken, watchDuration } = req.body;

      if (!adSessionToken) {
        return res.status(400).json({ message: 'Ad session token required' });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Verify session token
      if (!user.adSession || user.adSession.token !== adSessionToken) {
        return res.status(401).json({ message: 'Invalid ad session token' });
      }

      // Check if session expired
      if (new Date() > user.adSession.expiryTime) {
        return res.status(410).json({ message: 'Ad session expired' });
      }

      // Validate watch duration (must watch at least 25 seconds out of 30)
      const minimumWatchTime = 25; // seconds
      if (watchDuration < minimumWatchTime) {
        return res.status(400).json({ 
          message: `Must watch ad for at least ${minimumWatchTime} seconds`,
          watchedTime: watchDuration,
          requiredTime: minimumWatchTime
        });
      }

      const today = new Date();
      const creditsToAward = 1;

      // Update ad tracking
      user.adRewards.totalAdsWatched += 1;
      user.adRewards.dailyAdsWatched += 1;
      user.adRewards.lastAdWatchDate = today;
      user.adRewards.creditsEarnedFromAds += creditsToAward;

      // Add to watch history
      user.adRewards.adWatchHistory.push({
        watchedAt: today,
        creditsEarned: creditsToAward,
        adProvider: 'google',
        adDuration: 30,
        completed: true
      });

      // Award AI credits
      user.usage.customCredits += creditsToAward;

      // Update gamification (streak, XP)
      await addPoints(user._id, 'WATCH_AD'); // Adding points for ad engagement
      await updateStreak(user._id);

      // Clear ad session
      user.adSession = undefined;

      await user.save();

      res.json({
        success: true,
        creditsEarned: creditsToAward,
        totalCredits: user.usage.customCredits,
        totalAdsWatched: user.adRewards.totalAdsWatched,
        dailyAdsRemaining: user.adRewards.dailyAdLimit - user.adRewards.dailyAdsWatched,
        message: `Congratulations! You earned ${creditsToAward} AI credit!`
      });
    } catch (error) {
      console.error('Error completing ad:', error);
      res.status(500).json({ message: 'Server error completing ad' });
    }
  }

  // Get ad statistics for user
  async getAdStats(req, res) {
    try {
      const userId = req.user._id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const today = new Date();
      const lastAdDate = user.adRewards.lastAdWatchDate;
      
      // Reset daily count if new day
      let dailyAdsWatched = user.adRewards.dailyAdsWatched;
      if (!lastAdDate || lastAdDate.toDateString() !== today.toDateString()) {
        dailyAdsWatched = 0;
      }

      const isEligible = user.subscription.plan === 'free' && 
                        dailyAdsWatched < user.adRewards.dailyAdLimit;

      res.json({
        totalAdsWatched: user.adRewards.totalAdsWatched,
        creditsEarnedFromAds: user.adRewards.creditsEarnedFromAds,
        dailyAdsWatched,
        dailyAdLimit: user.adRewards.dailyAdLimit,
        remainingAds: Math.max(0, user.adRewards.dailyAdLimit - dailyAdsWatched),
        eligible: isEligible,
        currentCredits: user.usage.customCredits,
        subscriptionPlan: user.subscription.plan,
        recentAdHistory: user.adRewards.adWatchHistory.slice(-5) // Last 5 ads
      });
    } catch (error) {
      console.error('Error getting ad stats:', error);
      res.status(500).json({ message: 'Server error getting ad statistics' });
    }
  }

  // Admin: Update user ad limits (for admin panel)
  async updateAdLimits(req, res) {
    try {
      const { userId, dailyAdLimit } = req.body;

      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      user.adRewards.dailyAdLimit = dailyAdLimit;
      await user.save();

      res.json({
        message: 'Ad limits updated successfully',
        userId,
        newDailyLimit: dailyAdLimit
      });
    } catch (error) {
      console.error('Error updating ad limits:', error);
      res.status(500).json({ message: 'Server error updating ad limits' });
    }
  }
}

export default new AdRewardController();