import express from 'express';
const router = express.Router();
import {
  getUsers,
  getAllNotes,
  approveNote,
} from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

// All routes in this file are protected and require admin access
router.use(protect, admin);

router.route('/users').get(getUsers);
router.route('/notes').get(getAllNotes);
router.route('/notes/:id/approve').put(approveNote);

export default router;