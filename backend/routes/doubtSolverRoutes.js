import express from 'express';
const router = express.Router();
import { askQuestion } from '../controllers/doubtSolverController.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkApiLimit } from '../middleware/rateLimiter.js';

router.post('/ask', protect, checkApiLimit, askQuestion);

export default router;