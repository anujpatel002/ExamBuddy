#!/bin/bash

echo "🚀 Starting ExamBuddy Production Deployment..."

# Check if required environment variables are set
if [ -z "$MONGO_URI" ] || [ -z "$JWT_SECRET" ] || [ -z "$GEMINI_API_KEY" ]; then
    echo "❌ Missing required environment variables"
    exit 1
fi

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm ci --production
npm run build
cd ..

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm ci --production
cd ..

# Run security audit
echo "🔒 Running security audit..."
cd frontend && npm audit --audit-level=high
cd ../backend && npm audit --audit-level=high
cd ..

# Start application
echo "🎯 Starting application..."
cd backend
NODE_ENV=production npm start

echo "✅ Deployment complete!"