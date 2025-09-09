#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting ExamBuddy in Production Mode...\n');

// Set production environment
process.env.NODE_ENV = 'production';

// Start backend server
const backendPath = join(__dirname, 'backend');
const backend = spawn('node', ['server.js'], {
  cwd: backendPath,
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'production' }
});

backend.on('error', (error) => {
  console.error('❌ Backend failed to start:', error);
  process.exit(1);
});

backend.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Backend exited with code ${code}`);
    process.exit(code);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  backend.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  backend.kill('SIGTERM');
  process.exit(0);
});

console.log('✅ ExamBuddy backend started successfully!');
console.log('📊 Health check: http://localhost:5000/api/health');
console.log('🔧 Ready check: http://localhost:5000/api/ready');