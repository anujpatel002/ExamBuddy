import jwt from 'jsonwebtoken';
import connectDB from '../../config/db.js';
import User from '../../models/userModel.js';
import Subject from '../../models/subjectModel.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://exambuddy-delta.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    await connectDB();
    
    // Auth check
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Not authorized, no token' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (req.method === 'GET') {
      const subjects = await Subject.find({ user: user._id });
      res.json(subjects);
    } else if (req.method === 'POST') {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Subject name is required' });
      }
      
      const subject = new Subject({
        name,
        user: user._id,
      });
      
      const createdSubject = await subject.save();
      res.status(201).json(createdSubject);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}