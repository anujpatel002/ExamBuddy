import mongoose from 'mongoose';
import connectDB from '../config/db.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://exambuddy-delta.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    await connectDB();
    
    const dbStatus = mongoose.connection.readyState;
    const dbStates = { 0: 'Disconnected', 1: 'Connected', 2: 'Connecting', 3: 'Disconnecting' };
    
    let dbHealth = 'Healthy';
    try {
      if (mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
      }
    } catch (error) {
      dbHealth = 'Unhealthy';
    }

    const health = {
      status: dbStatus === 1 ? 'OK' : 'ERROR',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(process.uptime())}s`,
      environment: process.env.NODE_ENV || 'production',
      database: {
        status: dbStates[dbStatus],
        health: dbHealth
      },
      memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      version: '1.0.0'
    };
    
    res.status(dbStatus === 1 ? 200 : 503).json(health);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}