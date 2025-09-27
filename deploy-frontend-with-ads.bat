@echo off
setlocal EnableDelayedExpansion

REM 🚀 Deploy Frontend with ads.txt to Google Cloud Run (Windows)

echo 🔧 Building and deploying frontend with ads.txt file...
echo.

cd frontend

echo 1. Verifying ads.txt file...
if exist "public\ads.txt" (
    echo    ✅ ads.txt file exists
    echo    Content:
    type public\ads.txt
    echo.
) else (
    echo    ❌ ads.txt file missing!
    echo    Creating ads.txt file...
    echo google.com, pub-3631212035463885, DIRECT, f08c47fec0942fa0 > public\ads.txt
    echo    ✅ ads.txt file created
)

echo 2. Building Docker image using Google Cloud Build...
gcloud builds submit --tag gcr.io/enduring-art-454611-b1/exambuddy-frontend

echo 3. Deploying to Google Cloud Run...
gcloud run deploy exambuddy-frontend --image gcr.io/enduring-art-454611-b1/exambuddy-frontend --platform managed --region asia-south1 --allow-unauthenticated

echo.
echo 🎉 Deployment complete!
echo.
echo 4. Testing ads.txt accessibility...
timeout /t 15 /nobreak >nul

curl -s "https://exambuddy.me/ads.txt" >nul 2>&1
if !errorlevel! == 0 (
    echo    ✅ ads.txt is now accessible at: https://exambuddy.me/ads.txt
    echo    Content:
    curl -s "https://exambuddy.me/ads.txt"
) else (
    echo    ⚠️  ads.txt not yet accessible - deployment may still be in progress
    echo    Check again in a few minutes at: https://exambuddy.me/ads.txt
)

echo.
echo 📋 Next Steps:
echo    1. Verify ads.txt at: https://exambuddy.me/ads.txt
echo    2. Add your site to Google AdSense console
echo    3. Wait for AdSense approval (24-48 hours)
echo.

pause