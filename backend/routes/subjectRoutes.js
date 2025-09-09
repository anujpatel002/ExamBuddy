import express from 'express';
const router = express.Router();
import { 
  createSubject, 
  getMySubjects, 
  getSubjectById, 
  updateSubject, 
  deleteSubject,
  deleteMultipleSubjects 
} from '../controllers/subjectController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateSubject } from '../middleware/validation.js';

router.route('/')
  .post(protect, validateSubject, createSubject)
  .get(protect, getMySubjects)
  .delete(protect, deleteMultipleSubjects); // Handles deleting multiple subjects

router.route('/:id')
  .get(protect, getSubjectById)
  .put(protect, updateSubject)
  .delete(protect, deleteSubject); // Handles deleting a single subject

export default router;