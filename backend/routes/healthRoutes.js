import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

router.get('/health', async (req, res) => {
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
});

router.get('/ready', (req, res) => {
  if (mongoose.connection.readyState === 1) {
    res.status(200).json({ status: 'Ready', database: 'Connected' });
  } else {
    res.status(503).json({ status: 'Not Ready', reason: 'Database not connected' });
  }
});

export default router;