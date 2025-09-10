import connectDB from '../../config/db.js';
import { registerUser } from '../../controllers/authController.js';
import { validateRegister } from '../../middleware/validation.js';

export default async function handler(req, res) {
  // Set CORS headers
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
    
    // Mock req/res for middleware compatibility
    const mockReq = { ...req, body: req.body };
    const mockRes = { 
      ...res,
      status: (code) => ({ json: (data) => res.status(code).json(data) })
    };
    
    // Validate request
    await new Promise((resolve, reject) => {
      validateRegister(mockReq, mockRes, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Call register controller
    await registerUser(mockReq, res);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}