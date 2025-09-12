import User from '../models/userModel.js';

// Middleware to check and update expired subscriptions
export const checkSubscriptionStatus = async (req, res, next) => {
  try {
    if (req.user && req.user._id) {
      const user = await User.findById(req.user._id);
      
      if (user && !user.isSubscriptionActive() && user.subscription.plan !== 'free' && user.subscription.status === 'active') {
        // Expire the subscription
        user.expireSubscription();
        await user.save();
        
        // Update req.user with new subscription status
        req.user = await User.findById(req.user._id).select('-password');
      }
    }
    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    next();
  }
};

// Function to run periodic subscription cleanup
export const cleanupExpiredSubscriptions = async () => {
  try {
    const expiredUsers = await User.find({
      'subscription.plan': { $ne: 'free' },
      'subscription.status': 'active',
      'subscription.endDate': { $lt: new Date() }
    });

    for (const user of expiredUsers) {
      user.expireSubscription();
      await user.save();
      console.log(`Expired subscription for user: ${user.email}`);
    }

    console.log(`Cleaned up ${expiredUsers.length} expired subscriptions`);
  } catch (error) {
    console.error('Subscription cleanup error:', error);
  }
};