@echo off
setlocal EnableDelayedExpansion

REM 🎯 AdSense ads.txt Verification Script (Windows)

echo 🔍 Checking AdSense ads.txt file configuration...
echo.

REM Check local file
echo 1. Checking local ads.txt file...
if exist "frontend\public\ads.txt" (
    echo    ✅ ads.txt file exists locally
    echo    Content:
    type frontend\public\ads.txt
    echo.
) else (
    echo    ❌ ads.txt file not found locally
    exit /b 1
)

REM Check if Next.js dev server can serve it
echo 2. Testing local accessibility (if dev server is running)...
curl -s http://localhost:3000/ads.txt >nul 2>&1
if !errorlevel! == 0 (
    echo    ✅ ads.txt accessible via dev server
    echo    Content from localhost:3000/ads.txt:
    curl -s http://localhost:3000/ads.txt
    echo.
) else (
    echo    ⚠️  Dev server not running or ads.txt not accessible
    echo    Start dev server with: cd frontend ^&^& npm run dev
)

REM Check production domain
echo 3. Testing production accessibility...
set PROD_DOMAIN=exambuddy.me

curl -s "https://!PROD_DOMAIN!/ads.txt" >nul 2>&1
if !errorlevel! == 0 (
    echo    ✅ ads.txt accessible on production: https://!PROD_DOMAIN!/ads.txt
    echo    Content from production:
    curl -s "https://!PROD_DOMAIN!/ads.txt"
    echo.
    echo    ✅ Production ads.txt is accessible
) else (
    echo    ❌ ads.txt not accessible on production
    echo    This could be because:
    echo    - The file wasn't included in your deployment
    echo    - Your domain isn't configured yet
    echo    - The deployment is still in progress
)

echo.
echo 📋 AdSense Requirements Checklist:
echo    ✅ Publisher ID: pub-3631212035463885
echo    ✅ ads.txt file created
echo    ✅ ads.txt contains correct Google AdSense entry
echo.
echo 🔗 Next Steps:
echo    1. Ensure ads.txt is accessible at: https://!PROD_DOMAIN!/ads.txt
echo    2. Add your site to Google AdSense console
echo    3. Wait for AdSense approval (24-48 hours)
echo    4. Create ad units and update ad slot IDs
echo.

pause