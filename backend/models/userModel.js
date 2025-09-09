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
      plan: { type: String, default: 'free' },
      razorpayCustomerId: String,
      razorpaySubscriptionId: String,
      status: { type: String, default: 'active' },
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
    }
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

const User = mongoose.model('User', userSchema);
export default User;