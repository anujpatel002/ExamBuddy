# 🧪 Ad System Testing Guide

## Quick Start

### 1. Backend Testing (Comprehensive)

```bash
# Start the backend server
cd backend
npm start

# In another terminal, run the comprehensive test suite
cd backend  
node test-ad-system.js
```

This will test:
- ✅ Server health check
- ✅ User authentication
- ✅ Ad eligibility checking
- ✅ Ad session management
- ✅ Credit rewards system
- ✅ Rate limiting
- ✅ Fraud prevention
- ✅ Edge cases and security

### 2. Frontend Testing (Visual)

```bash
# Start the frontend
cd frontend
npm run dev
```

Then visit: `http://localhost:3000/test-ads`

Or add the testing dashboard to any existing dashboard page:

```tsx
import AdTestingDashboard from '../../components/ads/AdTestingDashboard';

// In your page component
<AdTestingDashboard />
```

## Components Overview

### 🎯 For Development (Local Testing)
- **TestAd.tsx**: Simulates 30-second ads with realistic controls
- **AdPlayer.tsx**: Environment-aware component (TestAd in dev, GoogleAd in prod)
- **AdTestingDashboard.tsx**: Complete testing interface

### 🚀 For Production (Real Ads)
- **GoogleAd.tsx**: Real Google AdSense integration
- **AdRewardSystem.tsx**: Main user interface
- **CreditStats.tsx**: Dashboard widget

## Testing Scenarios

### ✅ Happy Path Tests
1. **Free user watches full ad**: Should earn 1 credit
2. **Daily limit respect**: 10 ads per day maximum
3. **Minimum watch time**: 25 seconds minimum for reward
4. **Rate limiting**: Max 5 ad starts per minute

### ⚠️ Edge Case Tests
1. **Invalid session tokens**: Should be rejected
2. **Insufficient watch time**: Should not reward
3. **Expired sessions**: Should fail gracefully
4. **Premium users**: Should show "no ads needed" message

### 🔒 Security Tests
1. **Fraud prevention**: Multiple sessions detection
2. **IP-based limiting**: Too many requests from same IP
3. **Session tampering**: Invalid session modifications

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development  # Use 'production' for real ads
JWT_SECRET=your-secret
MONGO_URI=your-mongo-uri
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT=ca-pub-3631212035463885
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ads/eligibility` | GET | Check if user can watch ads |
| `/api/ads/start` | POST | Start new ad session |
| `/api/ads/complete` | POST | Complete ad and claim reward |
| `/api/ads/stats` | GET | Get user's ad statistics |

## Development vs Production

### Development Mode Features:
- 🧪 **Test ads**: No real AdSense integration needed
- ⚡ **Fast testing**: 30-second simulation runs in ~3 seconds
- 🔍 **Detailed logging**: Console logs for debugging
- 🎮 **Interactive controls**: Play/pause/skip buttons
- 📊 **Visual feedback**: Progress bars and timers

### Production Mode Features:
- 📺 **Real ads**: Google AdSense integration
- 💰 **Real revenue**: Actual ad monetization
- 🔐 **Full security**: All fraud prevention active
- 📈 **Analytics**: Real user engagement tracking

## Troubleshooting

### Backend Issues
```bash
# Check if server is running
curl http://localhost:5000/api/health

# Test authentication
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### Frontend Issues
- Check browser console for errors
- Verify API endpoints are accessible
- Ensure localStorage has valid JWT token

## Next Steps for Production

1. **AdSense Setup**:
   - ✅ Your publisher ID: `ca-pub-3631212035463885` is configured
   - ✅ ads.txt file created at `/public/ads.txt` 
   - Create ad units in AdSense dashboard
   - Update `GoogleAd.tsx` with real ad slot IDs
   - Verify ads.txt is accessible at: `https://yourdomainslogin/ads.txt`

2. **Environment Configuration**:
   - Set `NODE_ENV=production`
   - Configure production API URLs
   - Set up monitoring and analytics

3. **AdSense Verification**:
   - Ensure ads.txt is accessible at `https://exambuddy.me/ads.txt`
   - Verify your website in Google AdSense console
   - Wait for AdSense approval (can take 24-48 hours)

4. **Security Review**:
   - Review rate limits for production load
   - Test fraud prevention with real users
   - Implement additional security measures if needed

## Quick Test Commands

```bash
# Test ad eligibility
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/ads/eligibility

# Start ad session
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/ads/start

# Complete ad (replace SESSION_TOKEN)
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"sessionToken":"SESSION_TOKEN","watchDuration":30}' \
     http://localhost:5000/api/ads/complete
```

Happy testing! 🎉