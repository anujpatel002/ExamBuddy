import express from 'express';
const router = express.Router();
import { protect } from '../middleware/authMiddleware.js';
import { 
  createSummary, 
  createFlashcards, 
  createQuiz, 
  createCategorizedQuestions,
  createMoreCategorizedQuestions 
} from '../controllers/aiController.js';

router.post('/summarize/:noteId', protect, createSummary);
router.post('/flashcards/:noteId', protect, createFlashcards);
router.post('/quiz/:noteId', protect, createQuiz);
router.post('/categorized-questions/:noteId', protect, createCategorizedQuestions);
router.post('/more-categorized-questions/:noteId', protect, createMoreCategorizedQuestions);

export default router;