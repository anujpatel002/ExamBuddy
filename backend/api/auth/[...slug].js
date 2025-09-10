import express from 'express';
import cors from 'cors';
import connectDB from '../../config/db.js';
import authRoutes from '../../routes/authRoutes.js';

const app = express();

// CORS
const allowedOrigins = [
  'http://localhost:3000',
  'https://exambuddy-delta.vercel.app'
];
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());

// Connect to database
connectDB();

// Auth routes
app.use('/', authRoutes);

export default app;