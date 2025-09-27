@echo off
echo 🚀 Deploying Frontend with ads.txt...
echo.

cd frontend

echo ✅ Checking ads.txt file...
if exist "public\ads.txt" (
    echo ads.txt exists:
    type public\ads.txt
) else (
    echo Creating ads.txt...
    echo google.com, pub-3631212035463885, DIRECT, f08c47fec0942fa0 > public\ads.txt
)
echo.

echo 🔧 Building frontend image...
gcloud builds submit --tag gcr.io/enduring-art-454611-b1/exambuddy-frontend
echo.

echo 🚀 Deploying to Cloud Run...
gcloud run deploy exambuddy-frontend --image gcr.io/enduring-art-454611-b1/exambuddy-frontend --platform managed --region asia-south1 --allow-unauthenticated
echo.

echo ✅ Deployment complete!
echo 🔗 Check: https://exambuddy.me/ads.txt
pause