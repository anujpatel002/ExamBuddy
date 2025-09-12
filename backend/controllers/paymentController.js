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
    console.error('Payment service not configured - missing Razorpay credentials');
    res.status(503);
    throw new Error('Payment service is temporarily unavailable');
  }

  const { plan_id } = req.body;
  
  // Validate plan_id
  const validPlanIds = [
    'plan_RGhg2eKjTI6pbx', // Pro
    'plan_RGhfomkmMSybGn', // Premium
    'plan_RGheUTXXGwRjtd'  // Ultra
  ];
  
  if (!plan_id || !validPlanIds.includes(plan_id)) {
    res.status(400);
    throw new Error('Invalid plan selected');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404); 
    throw new Error('User not found');
  }

  // Check if user already has an active subscription
  if (user.subscription.status === 'active' && user.subscription.endDate > new Date()) {
    res.status(400);
    throw new Error('You already have an active subscription');
  }

  try {
    console.log(`Creating subscription for user ${user.email} with plan ${plan_id}`);
    
    let razorpayCustomerId = user.subscription.razorpayCustomerId;
    if (!razorpayCustomerId) {
      const customer = await razorpay.customers.create({
        name: user.name,
        email: user.email,
        contact: user.phone || '',
      });
      razorpayCustomerId = customer.id;
      user.subscription.razorpayCustomerId = razorpayCustomerId;
      await user.save();
      console.log(`Created Razorpay customer ${razorpayCustomerId} for user ${user.email}`);
    }
    
    const subscription = await razorpay.subscriptions.create({
      plan_id: plan_id,
      customer_notify: 1,
      total_count: 12,
      notes: {
        user_id: user._id.toString(),
        user_email: user.email,
        created_at: new Date().toISOString()
      }
    });
    
    console.log(`Created subscription ${subscription.id} for user ${user.email}`);
    
    res.json({ 
      subscriptionId: subscription.id, 
      key_id: process.env.RAZORPAY_KEY_ID,
      amount: subscription.plan_id === 'plan_RDXlqcfQJ71hbm' ? 14900 : 
              subscription.plan_id === 'plan_RDXm8g4DU0U19i' ? 39900 : 69900
    });

  } catch (error) {
    console.error(`Error creating Razorpay subscription for user ${user.email}:`, {
      error: error.message,
      stack: error.stack,
      razorpayError: error.error
    });
    res.status(500);
    throw new Error(`Payment processing failed: ${error.error?.description || error.message}`);
  }
});

const handleWebhook = asyncHandler(async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];
    
    if (!secret) {
        console.error('Webhook secret not configured');
        return res.status(500).json({ status: 'error', message: 'Webhook not configured' });
    }
    
    if (!signature) {
        console.error('Missing webhook signature');
        return res.status(400).json({ status: 'error', message: 'Missing signature' });
    }
    
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if (digest !== signature) {
        console.error('Invalid webhook signature', { expected: digest, received: signature });
        return res.status(400).json({ status: 'error', message: 'Invalid signature' });
    }
    
    console.log('Webhook signature verified successfully');

    const event = req.body;
    let user;

    if (event.event === 'subscription.activated') {
        console.log('Processing subscription.activated event');
        const sub = event.payload.subscription.entity;
        const payment = event.payload.payment.entity;
        
        // Try to find user by email from payment or subscription notes
        user = await User.findOne({ email: payment.email }) || 
               await User.findOne({ _id: sub.notes?.user_id });

        if(user) {
            console.log(`Activating subscription for user ${user.email}`);
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
        } else {
            console.error('User not found for subscription activation', { 
                paymentEmail: payment.email, 
                subscriptionId: sub.id 
            });
        }
    }
    
    if (event.event === 'subscription.cancelled' || event.event === 'subscription.halted') {
        console.log(`Processing ${event.event} event`);
        const sub = event.payload.subscription.entity;
        user = await User.findOne({ 'subscription.razorpaySubscriptionId': sub.id });
        if(user) {
            // Save current plan to history before cancelling
            user.subscription.planHistory.push({
                plan: user.subscription.plan,
                startDate: user.subscription.startDate,
                endDate: new Date(),
                changedBy: 'Razorpay Webhook',
                reason: `Subscription ${event.event}`
            });
            
            user.subscription.previousPlan = user.subscription.plan;
            user.subscription.plan = 'free';
            user.subscription.status = 'cancelled';
            user.subscription.endDate = new Date();
            await user.save();
            console.log(`Subscription ${event.event} for ${user.email}`);
        } else {
            console.error('User not found for subscription cancellation', { subscriptionId: sub.id });
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