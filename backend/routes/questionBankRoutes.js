import express from 'express';
const router = express.Router();
import { generateQuestionBank } from '../controllers/questionBankController.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkApiLimit } from '../middleware/rateLimiter.js';

router.post('/:subjectId', protect, checkApiLimit, generateQuestionBank);

export default router;