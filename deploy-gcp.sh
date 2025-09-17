#!/bin/bash

# ExamBuddy Google Cloud Deployment Script
set -e

echo "🚀 Starting ExamBuddy deployment to Google Cloud..."

# Configuration
PROJECT_ID="your-project-id"
REGION="us-central1"
BACKEND_SERVICE="exambuddy-backend"
FRONTEND_SERVICE="exambuddy-frontend"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Set project
echo "📋 Setting up project: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Deploy Backend
echo "🔧 Deploying backend to Cloud Run..."
cd backend

# Build and deploy backend
gcloud builds submit --tag gcr.io/$PROJECT_ID/$BACKEND_SERVICE
gcloud run deploy $BACKEND_SERVICE \
  --image gcr.io/$PROJECT_ID/$BACKEND_SERVICE \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 5000 \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10

# Get backend URL
BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --region=$REGION --format="value(status.url)")
echo "✅ Backend deployed at: $BACKEND_URL"

cd ..

# Deploy Frontend
echo "🎨 Deploying frontend to Cloud Run..."
cd frontend

# Update environment variable
export NEXT_PUBLIC_API_URL=$BACKEND_URL

# Build and deploy frontend
gcloud builds submit --tag gcr.io/$PROJECT_ID/$FRONTEND_SERVICE
gcloud run deploy $FRONTEND_SERVICE \
  --image gcr.io/$PROJECT_ID/$FRONTEND_SERVICE \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 3000 \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE --region=$REGION --format="value(status.url)")
echo "✅ Frontend deployed at: $FRONTEND_URL"

cd ..

echo "🎉 Deployment completed successfully!"
echo "📱 Frontend: $FRONTEND_URL"
echo "🔧 Backend: $BACKEND_URL"
echo ""
echo "📝 Next steps:"
echo "1. Set up your custom domain (see domain-setup.md)"
echo "2. Configure SSL certificate"
echo "3. Update DNS records"