import mongoose from 'mongoose';
import connectDB from '../config/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://exambuddy-delta.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    await connectDB();
    
    const dbStatus = mongoose.connection.readyState;
    const dbStates = { 0: 'Disconnected', 1: 'Connected', 2: 'Connecting', 3: 'Disconnecting' };
    
    const health = {
      status: dbStatus === 1 ? 'OK' : 'ERROR',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(process.uptime())}s`,
      environment: process.env.NODE_ENV || 'production',
      database: {
        status: dbStates[dbStatus],
        health: 'Healthy'
      },
      memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      version: '1.0.0'
    };
    
    res.status(200).json(health);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}