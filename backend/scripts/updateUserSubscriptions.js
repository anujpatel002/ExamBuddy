import mongoose from 'mongoose';
import User from '../models/userModel.js';
import dotenv from 'dotenv';

dotenv.config();

const updateUserSubscriptions = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({});
    
    for (const user of users) {
      let updated = false;
      
      // Fix all non-free plans
      if (user.subscription && user.subscription.plan !== 'free') {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today
        
        // Fix start date to today
        user.subscription.startDate = today;
        updated = true;
        
        // Calculate proper end date based on plan
        const endDate = new Date(today);
        if (user.subscription.plan === 'ultra') {
          endDate.setMonth(endDate.getMonth() + 3); // 3 months
        } else {
          endDate.setMonth(endDate.getMonth() + 1); // 1 month for other plans
        }
        
        user.subscription.endDate = endDate;
        user.subscription.nextBillingDate = endDate;
        user.subscription.billingCycle = user.subscription.plan === 'ultra' ? 'yearly' : 'monthly';
        user.subscription.status = 'active';
        updated = true;
        
        if (updated) {
          await user.save();
          console.log(`Updated ${user.email}: ${user.subscription.plan} plan, expires ${endDate.toDateString()}`);
        }
      }
    }
    
    console.log('User subscription update completed');
    process.exit(0);
  } catch (error) {
    console.error('Error updating user subscriptions:', error);
    process.exit(1);
  }
};

updateUserSubscriptions();