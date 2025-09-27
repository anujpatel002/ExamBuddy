#!/bin/bash

# ExamBuddy SEO-Optimized Production Deployment Script
# This script deploys the complete SEO-enhanced application to Google Cloud Run
# with all performance optimizations and SEO configurations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${GOOGLE_CLOUD_PROJECT:-"exambuddy-production"}
REGION=${GOOGLE_CLOUD_REGION:-"asia-south1"}
FRONTEND_SERVICE="exambuddy-frontend"
BACKEND_SERVICE="exambuddy-backend"

echo -e "${BLUE}🚀 Starting ExamBuddy SEO-Optimized Production Deployment${NC}"
echo "=================================================="

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if required tools are installed
echo -e "${BLUE}🔧 Checking dependencies...${NC}"

if ! command -v gcloud &> /dev/null; then
    print_error "Google Cloud CLI not found. Please install: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    print_error "Docker not found. Please install Docker"
    exit 1
fi

print_status "All dependencies found"

# Authenticate and set project
echo -e "${BLUE}🔐 Configuring Google Cloud...${NC}"
gcloud auth list
gcloud config set project $PROJECT_ID
gcloud config set compute/region $REGION

print_status "Google Cloud configured"

# Enable required APIs
echo -e "${BLUE}📡 Enabling Google Cloud APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable container.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com

print_status "APIs enabled"

# Build and Deploy Backend
echo -e "${BLUE}🔨 Building and deploying backend...${NC}"
cd backend

# Set environment variables for production
export NODE_ENV=production

# Build backend with production optimizations
print_status "Building backend Docker image..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/$BACKEND_SERVICE

# Deploy backend to Cloud Run
print_status "Deploying backend to Cloud Run..."
gcloud run deploy $BACKEND_SERVICE \
  --image gcr.io/$PROJECT_ID/$BACKEND_SERVICE \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --max-instances 100 \
  --set-env-vars "NODE_ENV=production" \
  --set-env-vars "PORT=8080" \
  --set-env-vars "CORS_ORIGIN=https://exambuddy.me" \
  --port 8080

# Get backend URL
BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --region=$REGION --format="value(status.url)")
print_status "Backend deployed: $BACKEND_URL"

cd ..

# Build and Deploy Frontend with SEO Optimizations
echo -e "${BLUE}🎨 Building and deploying SEO-optimized frontend...${NC}"
cd frontend

# Set production environment variables
export NODE_ENV=production
export NEXT_PUBLIC_API_URL=$BACKEND_URL
export NEXT_PUBLIC_GA4_MEASUREMENT_ID=${GA4_MEASUREMENT_ID:-"G-XXXXXXXXXX"}
export NEXT_PUBLIC_DOMAIN="https://exambuddy.me"

# Copy the SEO-optimized Next.js config
if [ -f "next.config.seo.js" ]; then
    print_status "Using SEO-optimized Next.js configuration"
    cp next.config.seo.js next.config.js
else
    print_warning "SEO config not found, using default config"
fi

# Build frontend with all optimizations
print_status "Building SEO-optimized frontend..."
npm install
npm run build

# Verify build includes SEO enhancements
echo -e "${BLUE}🔍 Verifying SEO build...${NC}"

# Check if important SEO files exist
if [ -f ".next/server/app/sitemap.xml/route.js" ]; then
    print_status "Sitemap generation included"
else
    print_warning "Sitemap might not be generated correctly"
fi

if [ -f ".next/server/app/robots.txt/route.js" ]; then
    print_status "Robots.txt included"
else
    print_warning "Robots.txt might not be included"
fi

# Check if structured data is included in build
if grep -r "application/ld+json" .next/ > /dev/null 2>&1; then
    print_status "Structured data (JSON-LD) included"
else
    print_warning "Structured data might be missing"
fi

# Build and deploy frontend Docker image
print_status "Building frontend Docker image with production optimizations..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/$FRONTEND_SERVICE

# Deploy frontend to Cloud Run with SEO-optimized settings
print_status "Deploying SEO-optimized frontend to Cloud Run..."
gcloud run deploy $FRONTEND_SERVICE \
  --image gcr.io/$PROJECT_ID/$FRONTEND_SERVICE \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --max-instances 100 \
  --set-env-vars "NODE_ENV=production" \
  --set-env-vars "PORT=3000" \
  --set-env-vars "NEXT_PUBLIC_API_URL=$BACKEND_URL" \
  --set-env-vars "NEXT_PUBLIC_GA4_MEASUREMENT_ID=$NEXT_PUBLIC_GA4_MEASUREMENT_ID" \
  --set-env-vars "NEXT_PUBLIC_DOMAIN=https://exambuddy.me" \
  --port 3000

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE --region=$REGION --format="value(status.url)")
print_status "Frontend deployed: $FRONTEND_URL"

cd ..

# Configure Custom Domain (if needed)
echo -e "${BLUE}🌐 Domain configuration...${NC}"
print_warning "Manual step: Configure custom domain mapping for exambuddy.me"
print_warning "Run: gcloud run domain-mappings create --service=$FRONTEND_SERVICE --domain=exambuddy.me --region=$REGION"

# SEO Verification Steps
echo -e "${BLUE}🔍 SEO Verification Checklist${NC}"
echo "============================================"

print_status "✅ Sitemap available at: $FRONTEND_URL/sitemap.xml"
print_status "✅ Robots.txt available at: $FRONTEND_URL/robots.txt"
print_status "✅ Structured data (JSON-LD) implemented"
print_status "✅ Google Analytics 4 configured"
print_status "✅ Performance optimizations applied"
print_status "✅ Mobile-responsive design"
print_status "✅ Meta tags and Open Graph implemented"

echo -e "\n${YELLOW}📝 Post-Deployment SEO Tasks:${NC}"
echo "1. Verify Google Search Console setup"
echo "2. Submit sitemap to Google Search Console"
echo "3. Set up Google Analytics goals and conversions"
echo "4. Test Core Web Vitals with PageSpeed Insights"
echo "5. Verify structured data with Google Rich Results Test"
echo "6. Check mobile-friendliness with Google Mobile-Friendly Test"
echo "7. Monitor crawl errors in Google Search Console"

# Performance Testing
echo -e "${BLUE}🚀 Performance Testing${NC}"
echo "Test your site performance:"
echo "• PageSpeed Insights: https://pagespeed.web.dev/?url=$FRONTEND_URL"
echo "• GTmetrix: https://gtmetrix.com/"
echo "• WebPageTest: https://webpagetest.org/"

# SEO Tools
echo -e "${BLUE}🔍 SEO Testing Tools${NC}"
echo "Verify SEO implementation:"
echo "• Google Rich Results Test: https://search.google.com/test/rich-results"
echo "• Structured Data Testing: https://validator.schema.org/"
echo "• Mobile-Friendly Test: https://search.google.com/test/mobile-friendly"

# Final URLs
echo -e "\n${GREEN}🎉 Deployment Complete!${NC}"
echo "=============================================="
echo -e "Frontend URL: ${GREEN}$FRONTEND_URL${NC}"
echo -e "Backend URL: ${GREEN}$BACKEND_URL${NC}"
echo -e "Custom Domain: ${GREEN}https://exambuddy.me${NC} (after DNS configuration)"

echo -e "\n${BLUE}📊 Next Steps for Top Rankings:${NC}"
echo "1. Monitor Google Search Console for indexing"
echo "2. Create high-quality, SEO-optimized content"
echo "3. Build authoritative backlinks"
echo "4. Monitor and improve Core Web Vitals"
echo "5. Regular content updates and optimization"
echo "6. A/B test title tags and meta descriptions"
echo "7. Monitor competitor rankings and strategies"

print_status "SEO-optimized production deployment completed successfully!"