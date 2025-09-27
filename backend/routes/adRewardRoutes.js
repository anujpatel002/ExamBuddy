import express from 'express';
import rateLimit from 'express-rate-limit';
import adRewardController from '../controllers/adRewardController.js';
import { protect } from '../middleware/authMiddleware.js';
import { 
  adRateLimit, 
  adFraudPrevention, 
  freeUsersOnly, 
  ipBasedAdLimit, 
  validateWatchDuration 
} from '../middleware/adSecurityMiddleware.js';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Apply IP-based rate limiting to all ad routes
router.use(ipBasedAdLimit);

// Check if user is eligible to watch ads for credits
// GET /api/ads/eligibility
router.get('/eligibility', 
  adRateLimit,
  adRewardController.checkAdEligibility
);

// Start an ad session
// POST /api/ads/start
router.post('/start',
  adRateLimit,
  freeUsersOnly,
  adFraudPrevention,
  adRewardController.startAdSession
);

// Complete ad and award credits
// POST /api/ads/complete
router.post('/complete',
  adRateLimit,
  freeUsersOnly,
  validateWatchDuration,
  adFraudPrevention,
  adRewardController.completeAd
);

// Get ad statistics for user
// GET /api/ads/stats
router.get('/stats',
  adRateLimit,
  adRewardController.getAdStats
);

// Admin route: Update user ad limits
// PUT /api/ads/admin/limits
router.put('/admin/limits',
  rateLimit({ max: 10, windowMs: 60000 }), // 10 requests per minute for admin
  adRewardController.updateAdLimits
);

export default router;