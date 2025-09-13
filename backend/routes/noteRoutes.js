import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.js';
import { 
  uploadNote, 
  getMyNotes, 
  getNoteById, 
  deleteNote, 
  updateNote,
  deleteMultipleNotes,
  resetFlashcards,
  resetPracticeQuestions,
  resetQuizzes
} from '../controllers/noteController.js';

const router = express.Router();

// Set up multer for in-memory file storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.route('/')
  .get(protect, getMyNotes)
  .delete(protect, deleteMultipleNotes); // Handles deleting multiple notes

router.route('/upload')
  .post(protect, upload.single('document'), uploadNote);
  
router.route('/:id')
    .get(protect, getNoteById)
    .put(protect, updateNote) // Handles updating a single note
    .delete(protect, deleteNote); // Handles deleting a single note

router.route('/:id/reset-flashcards')
    .post(protect, resetFlashcards); // Handles resetting flashcards

router.route('/:id/reset-practice-questions')
    .post(protect, resetPracticeQuestions); // Handles resetting practice questions

router.route('/:noteId/reset-quizzes')
    .post(protect, resetQuizzes); // Handles resetting quizzes

export default router;