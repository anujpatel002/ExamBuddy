#!/bin/bash

# 🚀 Deploy Frontend with ads.txt to Google Cloud Run

echo "🔧 Building and deploying frontend with ads.txt file..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

cd frontend

echo -e "${BLUE}1. Verifying ads.txt file...${NC}"
if [ -f "public/ads.txt" ]; then
    echo -e "${GREEN}   ✅ ads.txt file exists${NC}"
    echo -e "${BLUE}   Content:${NC}"
    cat public/ads.txt
    echo ""
else
    echo -e "${RED}   ❌ ads.txt file missing!${NC}"
    echo -e "${YELLOW}   Creating ads.txt file...${NC}"
    echo "google.com, pub-3631212035463885, DIRECT, f08c47fec0942fa0" > public/ads.txt
    echo -e "${GREEN}   ✅ ads.txt file created${NC}"
fi

echo -e "${BLUE}2. Building Docker image...${NC}"
docker build -t gcr.io/enduring-art-454611-b1/exambuddy-frontend .

echo -e "${BLUE}3. Pushing to Google Container Registry...${NC}"  
docker push gcr.io/enduring-art-454611-b1/exambuddy-frontend

echo -e "${BLUE}4. Deploying to Google Cloud Run...${NC}"
gcloud run deploy exambuddy-frontend \
    --image gcr.io/enduring-art-454611-b1/exambuddy-frontend \
    --platform managed \
    --region asia-south1 \
    --allow-unauthenticated

echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo -e "${BLUE}5. Testing ads.txt accessibility...${NC}"
sleep 10  # Wait for deployment to be ready

if curl -s "https://exambuddy.me/ads.txt" > /dev/null; then
    echo -e "${GREEN}   ✅ ads.txt is now accessible at: https://exambuddy.me/ads.txt${NC}"
    echo -e "${BLUE}   Content:${NC}"
    curl -s "https://exambuddy.me/ads.txt"
else
    echo -e "${YELLOW}   ⚠️  ads.txt not yet accessible - deployment may still be in progress${NC}"
    echo -e "${BLUE}   Check again in a few minutes at: https://exambuddy.me/ads.txt${NC}"
fi

echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo -e "${YELLOW}   1. Verify ads.txt at: https://exambuddy.me/ads.txt${NC}"
echo -e "${YELLOW}   2. Add your site to Google AdSense console${NC}"
echo -e "${YELLOW}   3. Wait for AdSense approval (24-48 hours)${NC}"
echo ""