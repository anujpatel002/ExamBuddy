import jwt from 'jsonwebtoken';
import connectDB from '../../config/db.js';
import User from '../../models/userModel.js';
import { uploadNote } from '../../controllers/noteController.js';
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://exambuddy-delta.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    await connectDB();
    
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Not authorized, no token' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    
    // Handle file upload with multer
    upload.single('document')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: 'File upload error', message: err.message });
      }
      
      await uploadNote(req, res);
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}