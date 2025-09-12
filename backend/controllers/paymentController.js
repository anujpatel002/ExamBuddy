import asyncHandler from 'express-async-handler';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import User from '../models/userModel.js';

let razorpay = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

const createSubscription = asyncHandler(async (req, res) => {
  if (!razorpay) {
    res.status(503);
    throw new Error('Payment service is not configured');
  }

  const { plan_id } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404); throw new Error('User not found');
  }

  try {
    let razorpayCustomerId = user.subscription.razorpayCustomerId;
    if (!razorpayCustomerId) {
      const customer = await razorpay.customers.create({
        name: user.name,
        email: user.email,
      });
      razorpayCustomerId = customer.id;
      user.subscription.razorpayCustomerId = razorpayCustomerId;
      await user.save();
    }
    
    const subscription = await razorpay.subscriptions.create({
      plan_id: plan_id,
      customer_notify: 1,
      total_count: 12,
    });
    
    res.json({ subscriptionId: subscription.id, key_id: process.env.RAZORPAY_KEY_ID });

  } catch (error) {
    console.error("Error creating Razorpay subscription:", error);
    res.status(500);
    throw new Error(`Razorpay Error: ${error.error?.description || error.message}`);
  }
});

const handleWebhook = asyncHandler(async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];
    
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if (digest !== signature) {
        return res.status(400).json({ status: 'error', message: 'Invalid signature' });
    }

    const event = req.body;
    let user;

    if (event.event === 'subscription.activated') {
        const sub = event.payload.subscription.entity;
        const payment = event.payload.payment.entity;
        user = await User.findOne({ email: payment.email });

        if(user) {
            let planName = 'free';
            if (sub.plan_id === process.env.RAZORPAY_PRO_PLAN_ID) {
                planName = 'pro';
            } else if (sub.plan_id === process.env.RAZORPAY_PREMIUM_PLAN_ID) {
                planName = 'premium';
            } else if (sub.plan_id === process.env.RAZORPAY_ULTRA_PLAN_ID) {
                planName = 'ultra';
            }
            
            // Save current plan to history
            if (user.subscription.plan !== 'free') {
                user.subscription.planHistory.push({
                    plan: user.subscription.plan,
                    startDate: user.subscription.startDate,
                    endDate: user.subscription.endDate,
                    changedBy: 'Razorpay Payment',
                    reason: 'Plan upgrade via payment'
                });
            }
            
            user.subscription.previousPlan = user.subscription.plan;
            user.subscription.plan = planName;
            user.subscription.status = 'active';
            user.subscription.razorpaySubscriptionId = sub.id;
            user.subscription.paymentMethod = 'razorpay';
            
            // Set subscription dates
            const startDate = new Date();
            startDate.setHours(0, 0, 0, 0);
            user.subscription.startDate = startDate;
            
            const endDate = new Date(startDate);
            if (planName === 'ultra') {
                endDate.setMonth(endDate.getMonth() + 3); // 3 months for ultra
            } else {
                endDate.setMonth(endDate.getMonth() + 1); // 1 month for others
            }
            user.subscription.endDate = endDate;
            user.subscription.nextBillingDate = endDate;
            user.subscription.billingCycle = 'monthly';
            
            if (!user.subscription.razorpayCustomerId) {
                user.subscription.razorpayCustomerId = sub.customer_id;
            }
            await user.save();
            console.log(`Subscription activated for ${user.email} with plan: ${planName}, expires: ${endDate.toDateString()}`);
        }
    }
    
    if (event.event === 'subscription.cancelled' || event.event === 'subscription.halted') {
        const sub = event.payload.subscription.entity;
        user = await User.findOne({ 'subscription.razorpaySubscriptionId': sub.id });
        if(user) {
            user.subscription.plan = 'free';
            user.subscription.status = 'cancelled';
            await user.save();
            console.log(`Subscription cancelled for ${user.email}`);
        }
    }

    if (user) {
      // Find the user's specific socket ID from the map
      const socketId = req.userSocketMap[user._id.toString()];
      // If they are currently connected, send a direct message
      if (socketId) {
        req.io.to(socketId).emit('subscriptionUpdated', {
          message: 'Your subscription plan has been updated!',
        });
        console.log(`Sent subscription update to user ${user._id}`);
      }
    }

    res.json({ status: 'ok' });
});

export { createSubscription, handleWebhook };