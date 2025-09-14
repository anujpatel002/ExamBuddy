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

const isMobileRequest = (req) => {
  const userAgent = req.get('User-Agent') || '';
  return /Mobile|Android|iPhone|iPad/.test(userAgent);
};

// Set up multer for in-memory file storage with Unicode filename support
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // Accept all file types but log the original name
    console.log('Multer received file:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      encoding: file.encoding,
      userAgent: req.get('User-Agent')?.substring(0, 100)
    });
    cb(null, true);
  },
  limits: {
    fileSize: isMobileRequest(req) ? 10 * 1024 * 1024 : 100 * 1024 * 1024, // 10MB for mobile, 100MB for desktop
    fieldSize: 5 * 1024 * 1024 // 5MB field size for mobile compatibility
  }
});

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