import express from 'express';
import cors from 'cors';
import connectDB from '../config/db.js';

import adminRoutes from '../routes/adminRoutes.js';
import paymentRoutes from '../routes/paymentRoutes.js';
import questionBankRoutes from '../routes/questionBankRoutes.js';
import doubtSolverRoutes from '../routes/doubtSolverRoutes.js';
import gamificationRoutes from '../routes/gamificationRoutes.js';

const app = express();

app.use(cors({
  origin: ['http://localhost:3000', 'https://exambuddy-delta.vercel.app'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));

connectDB();

app.use('/admin', adminRoutes);
app.use('/payments', paymentRoutes);
app.use('/question-bank', questionBankRoutes);
app.use('/doubt-solver', doubtSolverRoutes);
app.use('/gamification', gamificationRoutes);

export default app;