@echo off
setlocal EnableDelayedExpansion

REM 🚀 Complete ExamBuddy Deployment Script - Backend + Frontend

echo 🚀 Complete ExamBuddy Deployment to Google Cloud Run
echo.

REM Colors would be nice but not supported in batch, using emojis instead
set SUCCESS=✅
set ERROR=❌
set WARNING=⚠️
set INFO=ℹ️

echo %INFO% Starting deployment process...
echo.

REM ================================
REM BACKEND DEPLOYMENT
REM ================================
echo 🔧 BACKEND DEPLOYMENT
echo =====================================

echo %INFO% Step 1: Building backend Docker image...
cd backend
gcloud builds submit --tag gcr.io/enduring-art-454611-b1/exambuddy-backend

if !errorlevel! == 0 (
    echo %SUCCESS% Backend image built successfully
) else (
    echo %ERROR% Backend build failed
    pause
    exit /b 1
)

echo.
echo %INFO% Step 2: Deploying backend to Cloud Run...
gcloud run deploy exambuddy-backend --image gcr.io/enduring-art-454611-b1/exambuddy-backend --platform managed --region asia-south1 --allow-unauthenticated --set-env-vars="NODE_ENV=production,MONGO_URI=mongodb+srv://swaminarayan2181_db_user:KPq4MYvZyaUgM7Hv@cluster0.2blvwfm.mongodb.net/,JWT_SECRET=2abda647820b8c84fb9662285e5802abd55f168303525b5013cf9d8d6b5acf20,GEMINI_API_KEY=AIzaSyDk9jfiSiJyeLRUCzSMwJcPFG7OCQUBi30,RAZORPAY_KEY_ID=rzp_test_REioluG0sym4qN,RAZORPAY_KEY_SECRET=4jUOj6vvB7pUN5crRY46JESO,RAZORPAY_WEBHOOK_SECRET=Anuj@2004,RAZORPAY_PRO_PLAN_ID=plan_RDXlqcfQJ71hbm,RAZORPAY_PREMIUM_PLAN_ID=plan_RDXm8g4DU0U19i,RAZORPAY_ULTRA_PLAN_ID=plan_REkLuEt6XCuh08,EMAIL_HOST=smtp.gmail.com,EMAIL_USER=swaminarayan2181@gmail.com,EMAIL_PASS=ydecyulaszwwdjqw,CLIENT_URL=https://exambuddy.me"

if !errorlevel! == 0 (
    echo %SUCCESS% Backend deployed successfully
) else (
    echo %ERROR% Backend deployment failed
    pause
    exit /b 1
)

REM ================================
REM FRONTEND DEPLOYMENT
REM ================================
echo.
echo 🔧 FRONTEND DEPLOYMENT
echo =====================================

cd ..\frontend

echo %INFO% Step 3: Verifying ads.txt file...
if exist "public\ads.txt" (
    echo %SUCCESS% ads.txt file exists
    echo Content:
    type public\ads.txt
    echo.
) else (
    echo %WARNING% ads.txt file missing! Creating it...
    echo google.com, pub-3631212035463885, DIRECT, f08c47fec0942fa0 > public\ads.txt
    echo %SUCCESS% ads.txt file created
)

echo %INFO% Step 4: Building frontend Docker image...
gcloud builds submit --tag gcr.io/enduring-art-454611-b1/exambuddy-frontend

if !errorlevel! == 0 (
    echo %SUCCESS% Frontend image built successfully
) else (
    echo %ERROR% Frontend build failed
    pause
    exit /b 1
)

echo.
echo %INFO% Step 5: Deploying frontend to Cloud Run...
gcloud run deploy exambuddy-frontend --image gcr.io/enduring-art-454611-b1/exambuddy-frontend --platform managed --region asia-south1 --allow-unauthenticated

if !errorlevel! == 0 (
    echo %SUCCESS% Frontend deployed successfully
) else (
    echo %ERROR% Frontend deployment failed
    pause
    exit /b 1
)

REM ================================
REM VERIFICATION
REM ================================
echo.
echo 🔍 VERIFICATION
echo =====================================

echo %INFO% Waiting for deployments to be ready...
timeout /t 15 /nobreak >nul

echo %INFO% Testing backend health...
curl -s https://exambuddy-backend-url/api/health >nul 2>&1
if !errorlevel! == 0 (
    echo %SUCCESS% Backend is responding
) else (
    echo %WARNING% Backend may still be starting up
)

echo %INFO% Testing frontend and ads.txt...
curl -s "https://exambuddy.me/" >nul 2>&1
if !errorlevel! == 0 (
    echo %SUCCESS% Frontend is accessible
) else (
    echo %WARNING% Frontend may still be starting up
)

curl -s "https://exambuddy.me/ads.txt" >nul 2>&1
if !errorlevel! == 0 (
    echo %SUCCESS% ads.txt is accessible at: https://exambuddy.me/ads.txt
    echo Content from production:
    curl -s "https://exambuddy.me/ads.txt"
) else (
    echo %WARNING% ads.txt not yet accessible - may still be deploying
)

echo.
echo 🎉 DEPLOYMENT COMPLETE!
echo =====================================
echo.
echo %SUCCESS% Backend: Deployed with ad reward system
echo %SUCCESS% Frontend: Deployed with ads.txt file
echo.
echo 📋 Next Steps:
echo 1. Verify ads.txt at: https://exambuddy.me/ads.txt
echo 2. Test ad system at: https://exambuddy.me/test-ads
echo 3. Add site to Google AdSense console
echo 4. Wait for AdSense approval (24-48 hours)
echo.
echo 🔗 URLs:
echo - Frontend: https://exambuddy.me
echo - Test Ads: https://exambuddy.me/test-ads
echo - ads.txt: https://exambuddy.me/ads.txt
echo.

pause