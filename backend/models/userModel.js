import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['student', 'admin', 'sub-admin'],
      default: 'student',
    },
    isVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    lastVerificationEmailSent: Date,
    subscription: {
      plan: { type: String, default: 'free', enum: ['free', 'pro', 'premium', 'ultra'] },
      razorpayCustomerId: String,
      razorpaySubscriptionId: String,
      status: { type: String, default: 'active', enum: ['active', 'inactive', 'cancelled', 'expired', 'paused'] },
      startDate: { type: Date, default: Date.now },
      endDate: { type: Date },
      autoRenew: { type: Boolean, default: true },
      paymentMethod: { type: String, enum: ['razorpay', 'admin', 'manual'], default: 'razorpay' },
      lastPaymentDate: Date,
      nextBillingDate: Date,
      billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
      previousPlan: String,
      planHistory: [{
        plan: String,
        startDate: Date,
        endDate: Date,
        changedBy: String,
        reason: String,
        createdAt: { type: Date, default: Date.now }
      }]
    },
    usage: {
      requests: { type: Number, default: 0 },
      lastRequestDate: { type: Date, default: Date.now },
      noteCount: { type: Number, default: 0 },
      customCredits: { type: Number, default: 0 }
    },
    gamification: {
      currentStreak: { type: Number, default: 0 },
      longestStreak: { type: Number, default: 0 },
      lastActivityDate: { type: Date, default: null },
      totalPoints: { type: Number, default: 0 },
      weeklyPoints: { type: Number, default: 0 },
      weeklyReset: { type: Date, default: Date.now }
    },
    pinnedQuestions: [{
      subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
      questionIndex: { type: Number, required: true },
      category: { type: String, required: true }, // oneMarker, threeMarker, etc.
      type: { type: String }, // theory, practical (optional for backward compatibility)
      pinnedAt: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

// Password hashing middleware
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Check and expire subscriptions before save
userSchema.pre('save', function (next) {
  // Auto-set status based on plan
  if (this.subscription.plan === 'free') {
    this.subscription.status = 'inactive';
  } else if (['pro', 'premium', 'ultra'].includes(this.subscription.plan)) {
    this.subscription.status = 'active';
  }
  
  // Check expiration for paid plans with endDate
  if (this.subscription.plan !== 'free' && this.subscription.endDate && new Date() > this.subscription.endDate && this.subscription.status === 'active') {
    this.expireSubscription();
  }
  next();
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to create an email verification token
userSchema.methods.createEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  return verificationToken;
};

// Method to check if subscription is active
userSchema.methods.isSubscriptionActive = function() {
  // For free plan, always allow basic access but with limits
  if (this.subscription.plan === 'free') return true;
  // For paid plans, check if status is active
  return this.subscription.status === 'active';
};

// Method to get remaining days
userSchema.methods.getRemainingDays = function() {
  if (this.subscription.plan === 'free') return null;
  if (!this.subscription.endDate) return null;
  
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Start of today
  
  const endDate = new Date(this.subscription.endDate);
  endDate.setHours(0, 0, 0, 0); // Start of end date
  
  const diffTime = endDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 ? diffDays : 0;
};

// Method to expire subscription
userSchema.methods.expireSubscription = function() {
  this.subscription.previousPlan = this.subscription.plan;
  this.subscription.plan = 'free';
  this.subscription.status = 'expired';
  this.subscription.planHistory.push({
    plan: this.subscription.previousPlan,
    startDate: this.subscription.startDate,
    endDate: this.subscription.endDate,
    changedBy: 'system',
    reason: 'Subscription expired'
  });
};

const User = mongoose.model('User', userSchema);
export default User;