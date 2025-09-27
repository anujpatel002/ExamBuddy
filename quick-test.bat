@echo off
setlocal EnableDelayedExpansion

REM 🧪 ExamBuddy Ad System Quick Test Script (Windows)

echo 🚀 Starting ExamBuddy Ad System Testing...
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Run this script from the ExamBuddy root directory
    exit /b 1
)

echo 📋 Testing Setup Checklist:
echo.

REM 1. Check backend dependencies
echo 1. Checking backend dependencies...
cd backend
npm list express-rate-limit >nul 2>&1
if !errorlevel! == 0 (
    echo    ✅ express-rate-limit installed
) else (
    echo    ❌ Installing express-rate-limit...
    npm install express-rate-limit
)
cd ..

REM 2. Check environment setup
echo 2. Checking environment setup...
if exist "backend\.env" (
    echo    ✅ Backend .env file exists
) else (
    echo    ⚠️  Backend .env file not found - you may need to create one
)

REM 3. Check frontend dependencies  
echo 3. Checking frontend dependencies...
cd frontend
npm list react-icons >nul 2>&1
if !errorlevel! == 0 (
    echo    ✅ react-icons installed
) else (
    echo    ❌ Installing react-icons...
    npm install react-icons
)
cd ..

echo.
echo 🧪 Running Tests:
echo.

REM 4. Start backend and run tests
echo 4. Starting backend server...
cd backend
echo    Starting server in background...
start /B npm run dev
timeout /t 5 /nobreak >nul

REM Check if server is running
curl -s http://localhost:5000/api/health >nul 2>&1
if !errorlevel! == 0 (
    echo    ✅ Backend server is running
    
    REM Run the ad system tests
    echo 5. Running ad system tests...
    echo    This will test all API endpoints and functionality...
    echo.
    
    node test-ad-system.js
    if !errorlevel! == 0 (
        echo.
        echo    ✅ All tests passed!
    ) else (
        echo.
        echo    ❌ Some tests failed - check the output above
    )
) else (
    echo    ❌ Backend server failed to start
    echo    Check the server logs for errors
)

REM Clean up
echo.
echo 🧹 Cleaning up...
taskkill /F /IM node.exe >nul 2>&1

cd ..

echo.
echo 📱 Frontend Testing:
echo To test the frontend interface:
echo 1. cd frontend  
echo 2. npm run dev
echo 3. Visit: http://localhost:3000/test-ads
echo.

echo 🎉 Testing setup complete!
echo.
echo 📖 For detailed testing instructions, see: AD_TESTING_GUIDE.md

pause