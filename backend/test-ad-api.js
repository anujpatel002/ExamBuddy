// Test script for Ad Reward System API
// Run: node test-ad-api.js

import fetch from 'node-fetch'; // You may need: npm install node-fetch

const BASE_URL = 'http://localhost:5002';
const TEST_USER_TOKEN = 'your-test-jwt-token-here'; // Replace with actual token

async function testAdAPI() {
  console.log('🧪 Testing Ad Reward System API...\n');

  // Test 1: Check eligibility
  try {
    console.log('1️⃣ Testing eligibility check...');
    const eligibilityResponse = await fetch(`${BASE_URL}/api/ads/eligibility`, {
      headers: {
        'Authorization': `Bearer ${TEST_USER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (eligibilityResponse.ok) {
      const data = await eligibilityResponse.json();
      console.log('✅ Eligibility check successful:', data);
    } else {
      console.log('❌ Eligibility check failed:', eligibilityResponse.status);
    }
  } catch (error) {
    console.log('❌ Eligibility check error:', error.message);
  }

  console.log('\n');

  // Test 2: Get ad stats
  try {
    console.log('2️⃣ Testing ad stats...');
    const statsResponse = await fetch(`${BASE_URL}/api/ads/stats`, {
      headers: {
        'Authorization': `Bearer ${TEST_USER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (statsResponse.ok) {
      const data = await statsResponse.json();
      console.log('✅ Ad stats successful:', data);
    } else {
      console.log('❌ Ad stats failed:', statsResponse.status);
    }
  } catch (error) {
    console.log('❌ Ad stats error:', error.message);
  }

  console.log('\n');

  // Test 3: Start ad session (if eligible)
  try {
    console.log('3️⃣ Testing start ad session...');
    const startResponse = await fetch(`${BASE_URL}/api/ads/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_USER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (startResponse.ok) {
      const data = await startResponse.json();
      console.log('✅ Start ad session successful:', data);
      
      // Test 4: Complete ad (if session started)
      if (data.adSessionToken) {
        console.log('\n4️⃣ Testing complete ad...');
        
        // Wait 2 seconds to simulate watching
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const completeResponse = await fetch(`${BASE_URL}/api/ads/complete`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${TEST_USER_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            adSessionToken: data.adSessionToken,
            watchDuration: 26 // 26 seconds watched
          })
        });

        if (completeResponse.ok) {
          const completeData = await completeResponse.json();
          console.log('✅ Complete ad successful:', completeData);
        } else {
          const errorData = await completeResponse.json();
          console.log('❌ Complete ad failed:', errorData);
        }
      }
    } else {
      const errorData = await startResponse.json();
      console.log('❌ Start ad session failed:', errorData);
    }
  } catch (error) {
    console.log('❌ Start ad session error:', error.message);
  }

  console.log('\n🏁 Ad API testing complete!');
}

// Run the test
testAdAPI();

console.log(`
📋 Test Instructions:
1. Start your backend server: cd backend && npm start
2. Get a valid JWT token from login
3. Replace TEST_USER_TOKEN with your actual token
4. Run: node test-ad-api.js

🔧 API Endpoints tested:
- GET /api/ads/eligibility - Check if user can watch ads
- GET /api/ads/stats - Get user's ad statistics
- POST /api/ads/start - Start an ad viewing session
- POST /api/ads/complete - Complete ad and claim reward

🎯 Expected behavior:
- Free users: Should be able to watch ads and earn credits
- Premium users: Should see "not eligible" message
- Rate limiting: Too many requests should be blocked
- Security: Invalid tokens should be rejected
`);