import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import { validateEnvironment } from './config/validateEnv.js';

// Validate environment variables before starting
validateEnvironment();

import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

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
import securityHeaders from './middleware/securityHeaders.js'; 

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
  'http://192.168.1.6:3000',
 
];
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      callback(null, true);
      return;
    }
    // Allow any origin that starts with the server IP
    if (origin.startsWith('http://172.23.141.241') || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Content-Type, Authorization',
  credentials: true
};
app.use(cors(corsOptions));

// 2. Body parsers.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Custom middleware to attach socket info to requests.
// This MUST come before the API routes.
app.use((req, res, next) => {
  req.io = io;
  req.userSocketMap = userSocketMap;
  next();
});

// 4. API routes.
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
app.use('/api', healthRoutes);

// --- Error Handling ---
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));