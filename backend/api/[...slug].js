import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import connectDB from '../config/db.js';

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

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://exambuddy-delta.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    await connectDB();
    
    const app = express();
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    
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
    
    // Get the path from slug
    const slug = req.query.slug || [];
    const path = Array.isArray(slug) ? '/' + slug.join('/') : '/' + slug;
    
    // Override req.url to match the path
    req.url = path;
    
    app(req, res);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}