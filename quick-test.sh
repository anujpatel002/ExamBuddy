#!/bin/bash

# 🧪 ExamBuddy Ad System Quick Test Script

echo "🚀 Starting ExamBuddy Ad System Testing..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Run this script from the ExamBuddy root directory${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Testing Setup Checklist:${NC}"
echo ""

# 1. Check backend dependencies
echo -e "${YELLOW}1. Checking backend dependencies...${NC}"
cd backend
if npm list express-rate-limit > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ express-rate-limit installed${NC}"
else
    echo -e "${RED}   ❌ Installing express-rate-limit...${NC}"
    npm install express-rate-limit
fi
cd ..

# 2. Check if MongoDB is accessible
echo -e "${YELLOW}2. Checking environment setup...${NC}"
if [ -f "backend/.env" ]; then
    echo -e "${GREEN}   ✅ Backend .env file exists${NC}"
else
    echo -e "${YELLOW}   ⚠️  Backend .env file not found - you may need to create one${NC}"
fi

# 3. Check frontend dependencies
echo -e "${YELLOW}3. Checking frontend dependencies...${NC}"
cd frontend
if npm list react-icons > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ react-icons installed${NC}"
else
    echo -e "${RED}   ❌ Installing react-icons...${NC}"
    npm install react-icons
fi
cd ..

echo ""
echo -e "${BLUE}🧪 Running Tests:${NC}"
echo ""

# 4. Start backend and run tests
echo -e "${YELLOW}4. Starting backend server...${NC}"
cd backend
echo -e "${BLUE}   Starting server in background...${NC}"
npm run dev &
BACKEND_PID=$!

# Wait for server to start
echo -e "${BLUE}   Waiting for server to start...${NC}"
sleep 5

# Check if server is running
if curl -s http://localhost:5000/api/health > /dev/null; then
    echo -e "${GREEN}   ✅ Backend server is running${NC}"
    
    # Run the ad system tests
    echo -e "${YELLOW}5. Running ad system tests...${NC}"
    echo -e "${BLUE}   This will test all API endpoints and functionality...${NC}"
    echo ""
    
    if node test-ad-system.js; then
        echo ""
        echo -e "${GREEN}   ✅ All tests passed!${NC}"
    else
        echo ""
        echo -e "${RED}   ❌ Some tests failed - check the output above${NC}"
    fi
else
    echo -e "${RED}   ❌ Backend server failed to start${NC}"
    echo -e "${YELLOW}   Check the server logs for errors${NC}"
fi

# Clean up
echo ""
echo -e "${BLUE}🧹 Cleaning up...${NC}"
kill $BACKEND_PID 2>/dev/null
wait $BACKEND_PID 2>/dev/null

cd ..

echo ""
echo -e "${BLUE}📱 Frontend Testing:${NC}"
echo -e "${YELLOW}To test the frontend interface:${NC}"
echo "1. cd frontend"  
echo "2. npm run dev"
echo "3. Visit: http://localhost:3000/test-ads"
echo ""

echo -e "${GREEN}🎉 Testing setup complete!${NC}"
echo ""
echo -e "${BLUE}📖 For detailed testing instructions, see: AD_TESTING_GUIDE.md${NC}"