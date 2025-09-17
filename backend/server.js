import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import { validateEnvironment } from './config/validateEnv.js';

// Validate environment variables before starting
validateEnvironment();

import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import crypto from 'crypto';

import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

import authRoutes from './routes/authRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import questionBankRoutes from './routes/questionBankRoutes.js';
import studyRoomRoutes from './routes/studyRoomRoutes.js';
import initializeSocket from './socket/socketHandler.js';
import doubtSolverRoutes from './routes/doubtSolverRoutes.js';
import gamificationRoutes from './routes/gamificationRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import ocrRoutes from './routes/ocrRoutes.js';
import pinnedQuestionsRoutes from './routes/pinnedQuestionsRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import securityHeaders from './middleware/securityHeaders.js';
import { validateInput, sanitizeQuery, limitRequestSize } from './middleware/securityMiddleware.js'; 

connectDB();
const app = express();

// --- Server and Socket.IO Setup ---
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {  origin: '*', // Allows all origins to connect
    methods: ['GET', 'POST'], },
});

const { userSocketMap } = initializeSocket(io);

// --- MIDDLEWARE ORDER IS CRITICAL ---

// 1. Security headers first
app.use(securityHeaders);

// 2. CORS middleware must be next.
const allowedOrigins = [
  'http://localhost:3000',
  'http://192.168.1.18:3000',
  'https://exambuddy-delta.vercel.app',
  'https://exambuddy.me'
];
const corsOptions = {
  origin: allowedOrigins, // <-- Let the CORS package handle the logic
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Content-Type, Authorization',
  credentials: true
};
app.use(cors(corsOptions));

// 2. Security middleware
app.use(limitRequestSize('100mb'));
app.use(validateInput);
app.use(sanitizeQuery);

// 3. Body parsers with mobile-friendly limits
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// 4. Simple CSRF protection middleware
const csrfProtection = (req, res, next) => {
  // Skip CSRF for GET requests and health checks
  if (req.method === 'GET' || req.path.includes('/health')) {
    return next();
  }
  
  // Check for valid origin header
  const origin = req.get('Origin') || req.get('Referer');
  const allowedOrigins = [
    'http://localhost:3000',
    'http://192.168.1.18:3000', 
    'https://exambuddy-delta.vercel.app',
    'https://exambuddy.me'
  ];
  
  if (origin && !allowedOrigins.some(allowed => origin.startsWith(allowed))) {
    return res.status(403).json({ message: 'Invalid origin' });
  }
  
  next();
};

// Apply CSRF protection to state-changing routes
app.use('/api/auth', csrfProtection);
app.use('/api/study-rooms', csrfProtection);
app.use('/api/admin', csrfProtection);

// 5. Custom middleware to attach socket info to requests.
// This MUST come before the API routes.
app.use((req, res, next) => {
  req.io = io;
  req.userSocketMap = userSocketMap;
  next();
});

// 6. API routes.
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/question-bank', questionBankRoutes);
app.use('/api/study-rooms', studyRoomRoutes);
app.use('/api/doubt-solver', doubtSolverRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/pinned-questions', pinnedQuestionsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api', healthRoutes);

// --- Error Handling ---
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5002;
httpServer.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));