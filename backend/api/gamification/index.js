import jwt from 'jsonwebtoken';
import connectDB from '../../config/db.js';
import User from '../../models/userModel.js';
import express from 'express';
import gamificationRoutes from '../../routes/gamificationRoutes.js';

const app = express();
app.use(express.json());
app.use('/', gamificationRoutes);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://exambuddy-delta.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    await connectDB();
    
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    }
    
    app(req, res);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}