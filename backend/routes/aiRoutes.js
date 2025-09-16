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
  generateExamPaper,
  createSubjectQuiz,
  analyzeDocuments,
  generateStudyMaterial,
  generateAudioOverview
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
router.post('/generate-exam/:noteId', protect, checkPlanLimit('aiCredits'), checkApiLimit, generateExamPaper);
router.post('/subject-quiz/:subjectId', protect, checkPlanLimit('aiCredits'), checkApiLimit, createSubjectQuiz);
router.get('/practice-questions/:noteId', protect, async (req, res) => {
  try {
    const Note = (await import('../models/noteModel.js')).default;
    const note = await Note.findById(req.params.noteId);
    if (!note || note.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.json({ practiceQuestions: note.categorizedQuestions || {} });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// NotebookLM routes
router.get('/notebook/test', protect, (req, res) => {
  res.json({ message: 'NotebookLM routes working', user: req.user.email });
});
router.post('/notebook/analyze', protect, checkPlanLimit('aiCredits'), checkApiLimit, analyzeDocuments);
router.post('/notebook/study-material', protect, checkPlanLimit('aiCredits'), checkApiLimit, generateStudyMaterial);
router.post('/notebook/audio-overview', protect, checkPlanLimit('aiCredits'), checkApiLimit, generateAudioOverview);

export default router;