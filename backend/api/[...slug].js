import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import connectDB from '../config/db.js';
import { notFound, errorHandler } from '../middleware/errorMiddleware.js';

import authRoutes from '../routes/authRoutes.js';
import noteRoutes from '../routes/noteRoutes.js';
import subjectRoutes from '../routes/subjectRoutes.js';
import aiRoutes from '../routes/aiRoutes.js';
import quizRoutes from '../routes/quizRoutes.js';
import adminRoutes from '../routes/adminRoutes.js';
import paymentRoutes from '../routes/paymentRoutes.js';
import questionBankRoutes from '../routes/questionBankRoutes.js';
import studyRoomRoutes from '../routes/studyRoomRoutes.js';
import doubtSolverRoutes from '../routes/doubtSolverRoutes.js';
import gamificationRoutes from '../routes/gamificationRoutes.js';
import healthRoutes from '../routes/healthRoutes.js';

const app = express();

// CORS
app.use(cors({
  origin: ['http://localhost:3000', 'https://exambuddy-delta.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Connect to database
connectDB();

// Routes
app.use('/auth', authRoutes);
app.use('/notes', noteRoutes);
app.use('/subjects', subjectRoutes);
app.use('/ai', aiRoutes);
app.use('/quizzes', quizRoutes);
app.use('/admin', adminRoutes);
app.use('/payments', paymentRoutes);
app.use('/question-bank', questionBankRoutes);
app.use('/study-rooms', studyRoomRoutes);
app.use('/doubt-solver', doubtSolverRoutes);
app.use('/gamification', gamificationRoutes);
app.use('/', healthRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;