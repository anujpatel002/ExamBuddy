import express from 'express';
const router = express.Router();
import { generateQuestionBank, generateMoreQuestions } from '../controllers/questionBankController.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkApiLimit } from '../middleware/rateLimiter.js';

router.post('/:subjectId', protect, checkApiLimit, generateQuestionBank);
router.post('/:subjectId/generate-more', protect, checkApiLimit, generateMoreQuestions);
router.post('/:subjectId/reset', protect, (req, res) => {
  // Reset is handled by generateMoreQuestions with reset flag
  req.body.reset = true;
  generateMoreQuestions(req, res);
});

export default router;