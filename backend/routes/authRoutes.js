import express from 'express';
const router = express.Router(); // <-- This line was missing

import { 
  registerUser, 
  authUser, 
  verifyEmail, 
  getUserProfile,
  getSubscriptionStatus,
  calculateUserPlanSwitch,
  switchUserPlan,
  calculateUpgradeCost,
  forgotPassword,
  resetPassword
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateAuth, validateRegister, validateForgotPassword, validateResetPassword } from '../middleware/validation.js';

router.post('/register', validateRegister, registerUser);
router.post('/login', validateAuth, authUser);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.put('/reset-password/:token', validateResetPassword, resetPassword);
router.get('/profile', protect, getUserProfile);
router.get('/subscription-status', protect, getSubscriptionStatus);
router.post('/calculate-plan-switch', protect, calculateUserPlanSwitch);
router.put('/switch-plan', protect, switchUserPlan);
router.post('/calculate-upgrade-cost', protect, calculateUpgradeCost);

export default router;