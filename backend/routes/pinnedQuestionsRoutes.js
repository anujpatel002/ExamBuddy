import express from 'express';
const router = express.Router();
import { pinQuestion, unpinQuestion, getPinnedQuestions } from '../controllers/pinnedQuestionsController.js';
import { protect } from '../middleware/authMiddleware.js';

router.post('/pin', protect, pinQuestion);
router.post('/unpin', protect, unpinQuestion);
router.get('/:subjectId?', protect, getPinnedQuestions);

export default router;