import { NextResponse } from 'next/server';

export async function GET() {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    version: '1.0.0',
    service: 'ExamBuddy Frontend'
  };
  
  return NextResponse.json(health);
}