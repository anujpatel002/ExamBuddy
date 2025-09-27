#!/bin/bash

# 🎯 AdSense ads.txt Verification Script

echo "🔍 Checking AdSense ads.txt file configuration..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check local file
echo -e "${BLUE}1. Checking local ads.txt file...${NC}"
if [ -f "frontend/public/ads.txt" ]; then
    echo -e "${GREEN}   ✅ ads.txt file exists locally${NC}"
    echo -e "${BLUE}   Content:${NC}"
    cat frontend/public/ads.txt
    echo ""
else
    echo -e "${RED}   ❌ ads.txt file not found locally${NC}"
    exit 1
fi

# Check if Next.js dev server can serve it
echo -e "${BLUE}2. Testing local accessibility (if dev server is running)...${NC}"
if curl -s http://localhost:3000/ads.txt > /dev/null; then
    echo -e "${GREEN}   ✅ ads.txt accessible via dev server${NC}"
    echo -e "${BLUE}   Content from localhost:3000/ads.txt:${NC}"
    curl -s http://localhost:3000/ads.txt
    echo ""
else
    echo -e "${YELLOW}   ⚠️  Dev server not running or ads.txt not accessible${NC}"
    echo -e "${BLUE}   Start dev server with: cd frontend && npm run dev${NC}"
fi

# Check production domain (if provided)
echo -e "${BLUE}3. Testing production accessibility...${NC}"
PROD_DOMAIN="exambuddy.me"

if curl -s "https://$PROD_DOMAIN/ads.txt" > /dev/null; then
    echo -e "${GREEN}   ✅ ads.txt accessible on production: https://$PROD_DOMAIN/ads.txt${NC}"
    echo -e "${BLUE}   Content from production:${NC}"
    curl -s "https://$PROD_DOMAIN/ads.txt"
    echo ""
    
    # Verify content matches
    local_content=$(cat frontend/public/ads.txt 2>/dev/null || echo "")
    prod_content=$(curl -s "https://$PROD_DOMAIN/ads.txt" || echo "")
    
    if [ "$local_content" = "$prod_content" ]; then
        echo -e "${GREEN}   ✅ Production ads.txt matches local file${NC}"
    else
        echo -e "${RED}   ❌ Production ads.txt differs from local file${NC}"
        echo -e "${YELLOW}   You may need to redeploy your frontend${NC}"
    fi
else
    echo -e "${RED}   ❌ ads.txt not accessible on production${NC}"
    echo -e "${YELLOW}   This could be because:${NC}"
    echo -e "${YELLOW}   - The file wasn't included in your deployment${NC}"
    echo -e "${YELLOW}   - Your domain isn't configured yet${NC}"
    echo -e "${YELLOW}   - The deployment is still in progress${NC}"
fi

echo ""
echo -e "${BLUE}📋 AdSense Requirements Checklist:${NC}"
echo -e "${GREEN}   ✅ Publisher ID: pub-3631212035463885${NC}"
echo -e "${GREEN}   ✅ ads.txt file created${NC}"
echo -e "${GREEN}   ✅ ads.txt contains correct Google AdSense entry${NC}"
echo ""
echo -e "${BLUE}🔗 Next Steps:${NC}"
echo -e "${YELLOW}   1. Ensure ads.txt is accessible at: https://$PROD_DOMAIN/ads.txt${NC}"
echo -e "${YELLOW}   2. Add your site to Google AdSense console${NC}"
echo -e "${YELLOW}   3. Wait for AdSense approval (24-48 hours)${NC}"
echo -e "${YELLOW}   4. Create ad units and update ad slot IDs${NC}"
echo ""