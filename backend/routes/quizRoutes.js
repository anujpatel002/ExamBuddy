import express from 'express';
const router = express.Router();
import { protect } from '../middleware/authMiddleware.js';
import { getMyQuizzes, getQuizById, deleteQuiz } from '../controllers/quizController.js';

router.route('/my').get(protect, getMyQuizzes);
router.route('/:id')
  .get(protect, getQuizById)
  .delete(protect, deleteQuiz); // <-- Add DELETE

export default router;