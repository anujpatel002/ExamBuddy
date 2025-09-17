#!/bin/bash

# ExamBuddy Vercel + Google Cloud Deployment
set -e

echo "🚀 Deploying ExamBuddy (Backend: GCP, Frontend: Vercel)..."

# Deploy Backend to Google Cloud Run
echo "🔧 Deploying backend to Google Cloud Run..."
cd backend

# Set your project ID
PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID

# Build and deploy backend
gcloud builds submit --tag gcr.io/$PROJECT_ID/exambuddy-backend
gcloud run deploy exambuddy-backend \
  --image gcr.io/$PROJECT_ID/exambuddy-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 5000

# Get backend URL
BACKEND_URL=$(gcloud run services describe exambuddy-backend --region=us-central1 --format="value(status.url)")
echo "✅ Backend deployed at: $BACKEND_URL"

cd ../frontend

# Update environment for production
echo "NEXT_PUBLIC_API_URL=$BACKEND_URL" > .env.production

# Deploy Frontend to Vercel
echo "🎨 Deploying frontend to Vercel..."

# Install Vercel CLI if not installed
if ! command -v vercel &> /dev/null; then
    npm install -g vercel
fi

# Deploy to Vercel
vercel --prod

echo "🎉 Deployment completed!"
echo "📱 Backend: $BACKEND_URL"
echo "🌐 Frontend: Check Vercel dashboard for URL"
echo ""
echo "📝 Next steps:"
echo "1. Get free domain from Freenom"
echo "2. Add custom domain in Vercel dashboard"
echo "3. Configure DNS records"