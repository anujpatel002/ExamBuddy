import express from 'express';
const router = express.Router();
import { createSubscription, handleWebhook } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

router.post('/create-subscription', protect, createSubscription);
router.post('/webhook', handleWebhook);

export default router;