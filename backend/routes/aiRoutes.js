import express from 'express';
import multer from 'multer';
const router = express.Router();
import { protect } from '../middleware/authMiddleware.js';
import { checkApiLimit } from '../middleware/rateLimiter.js';
import { checkPlanLimit } from '../middleware/planLimits.js';
import { 
  createSummary, 
  createFlashcards, 
  createQuiz, 
  createCategorizedQuestions,
  createMoreCategorizedQuestions,
  suggestTitle,
  createMindMap,
  createStudyPlan,
  compareConcepts,
  generateExamPaper
} from '../controllers/aiController.js';

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/summarize/:noteId', protect, checkPlanLimit('aiCredits'), checkApiLimit, createSummary);
router.post('/flashcards/:noteId', protect, checkPlanLimit('aiCredits'), checkApiLimit, createFlashcards);
router.post('/quiz/:noteId', protect, checkPlanLimit('aiCredits'), checkApiLimit, createQuiz);
router.post('/categorized-questions/:noteId', protect, checkPlanLimit('aiCredits'), checkApiLimit, createCategorizedQuestions);
router.post('/more-categorized-questions/:noteId', protect, checkPlanLimit('aiCredits'), checkApiLimit, createMoreCategorizedQuestions);
router.post('/suggest-title', protect, checkPlanLimit('aiCredits'), checkApiLimit, upload.single('document'), suggestTitle);
router.post('/mindmap/:noteId', protect, checkPlanLimit('aiCredits'), checkApiLimit, createMindMap);
router.post('/study-plan/:subjectId', protect, checkPlanLimit('aiCredits'), checkApiLimit, createStudyPlan);
router.post('/compare-concepts', protect, checkPlanLimit('compareNotes'), checkPlanLimit('aiCredits'), checkApiLimit, compareConcepts);
router.post('/generate-exam/:subjectId', protect, checkPlanLimit('examCreator'), checkPlanLimit('aiCredits'), checkApiLimit, generateExamPaper);

export default router;