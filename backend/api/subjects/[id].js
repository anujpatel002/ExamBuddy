import jwt from 'jsonwebtoken';
import connectDB from '../../config/db.js';
import User from '../../models/userModel.js';
import Subject from '../../models/subjectModel.js';
import Note from '../../models/noteModel.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://exambuddy-delta.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    await connectDB();
    
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Not authorized, no token' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    const { id } = req.query;
    
    if (req.method === 'GET') {
      const subject = await Subject.findById(id);
      if (subject && subject.user.toString() === user._id.toString()) {
        const notes = await Note.find({ subject: id });
        res.json({ subject, notes });
      } else {
        res.status(404).json({ error: 'Subject not found' });
      }
    } else if (req.method === 'PUT') {
      const { name } = req.body;
      const subject = await Subject.findById(id);
      
      if (subject && subject.user.toString() === user._id.toString()) {
        subject.name = name || subject.name;
        const updatedSubject = await subject.save();
        res.json(updatedSubject);
      } else {
        res.status(404).json({ error: 'Subject not found' });
      }
    } else if (req.method === 'DELETE') {
      const subject = await Subject.findById(id);
      
      if (subject && subject.user.toString() === user._id.toString()) {
        await Note.deleteMany({ subject: id });
        await subject.deleteOne();
        res.json({ message: 'Subject and associated notes removed' });
      } else {
        res.status(404).json({ error: 'Subject not found' });
      }
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}