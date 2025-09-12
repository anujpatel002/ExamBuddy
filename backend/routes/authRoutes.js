import express from 'express';
const router = express.Router(); // <-- This line was missing

import { 
  registerUser, 
  authUser, 
  verifyEmail, 
  getUserProfile,
  getSubscriptionStatus,
  calculateUserPlanSwitch
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateAuth, validateRegister } from '../middleware/validation.js';

router.post('/register', validateRegister, registerUser);
router.post('/login', validateAuth, authUser);
router.get('/verify-email/:token', verifyEmail);
router.get('/profile', protect, getUserProfile);
router.get('/subscription-status', protect, getSubscriptionStatus);
router.post('/calculate-plan-switch', protect, calculateUserPlanSwitch);

export default router;