/**
 * Comprehensive Ad System Testing Script
 * Tests all ad reward endpoints and validates the complete flow
 */

import fetch from 'node-fetch';
import chalk from 'chalk';

const API_BASE = 'http://localhost:5000';
const TEST_USER = {
  email: 'test@exambuddy.com',
  password: 'testpass123'
};

class AdSystemTester {
  constructor() {
    this.token = null;
    this.userId = null;
    this.testResults = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().slice(11, 19);
    let coloredMessage;
    
    switch (type) {
      case 'success': coloredMessage = chalk.green(`✓ ${message}`); break;
      case 'error': coloredMessage = chalk.red(`✗ ${message}`); break;
      case 'warning': coloredMessage = chalk.yellow(`⚠ ${message}`); break;
      case 'info': coloredMessage = chalk.blue(`ℹ ${message}`); break;
      default: coloredMessage = message;
    }
    
    console.log(chalk.gray(`[${timestamp}]`), coloredMessage);
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json();
      
      return {
        status: response.status,
        ok: response.ok,
        data
      };
    } catch (error) {
      return {
        status: 0,
        ok: false,
        error: error.message
      };
    }
  }

  async testHealthCheck() {
    this.log('Testing server health...', 'info');
    
    const response = await this.makeRequest('/api/health');
    
    if (response.ok) {
      this.log('Server is running successfully', 'success');
      return true;
    } else {
      this.log('Server health check failed', 'error');
      return false;
    }
  }

  async authenticateTestUser() {
    this.log('Authenticating test user...', 'info');
    
    // Try to login first
    let response = await this.makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(TEST_USER)
    });

    // If login fails, try to register
    if (!response.ok) {
      this.log('Login failed, attempting to register test user...', 'warning');
      
      response = await this.makeRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          ...TEST_USER,
          name: 'Test User',
          subscription: { plan: 'free' }
        })
      });

      if (!response.ok) {
        this.log('Failed to register test user', 'error');
        return false;
      }

      this.log('Test user registered successfully', 'success');
      
      // Now try to login again
      response = await this.makeRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(TEST_USER)
      });
    }

    if (response.ok) {
      this.token = response.data.token;
      this.userId = response.data._id;
      this.log('Authentication successful', 'success');
      return true;
    } else {
      this.log('Authentication failed', 'error');
      return false;
    }
  }

  async testAdEligibility() {
    this.log('Testing ad eligibility check...', 'info');
    
    const response = await this.makeRequest('/api/ads/eligibility');
    
    if (response.ok) {
      const { eligible, reason, dailyAdsWatched, maxDailyAds } = response.data;
      
      this.log(`Eligibility: ${eligible}`, eligible ? 'success' : 'warning');
      this.log(`Daily ads watched: ${dailyAdsWatched}/${maxDailyAds}`, 'info');
      
      if (!eligible) {
        this.log(`Reason: ${reason}`, 'warning');
      }
      
      return { eligible, dailyAdsWatched, maxDailyAds };
    } else {
      this.log(`Eligibility check failed: ${response.data?.message}`, 'error');
      return null;
    }
  }

  async testAdSessionStart() {
    this.log('Testing ad session start...', 'info');
    
    const response = await this.makeRequest('/api/ads/start', {
      method: 'POST'
    });
    
    if (response.ok) {
      const { sessionToken, expiresAt } = response.data;
      
      this.log('Ad session started successfully', 'success');
      this.log(`Session token: ${sessionToken.substring(0, 20)}...`, 'info');
      this.log(`Expires at: ${new Date(expiresAt).toLocaleString()}`, 'info');
      
      return sessionToken;
    } else {
      this.log(`Failed to start ad session: ${response.data?.message}`, 'error');
      return null;
    }
  }

  async testAdCompletion(sessionToken, watchDuration = 30) {
    this.log(`Testing ad completion with ${watchDuration}s watch time...`, 'info');
    
    const response = await this.makeRequest('/api/ads/complete', {
      method: 'POST',
      body: JSON.stringify({
        sessionToken,
        watchDuration
      })
    });
    
    if (response.ok) {
      const { creditsEarned, newCreditBalance, totalAdsWatched } = response.data;
      
      this.log('Ad completion successful', 'success');
      this.log(`Credits earned: ${creditsEarned}`, 'success');
      this.log(`New credit balance: ${newCreditBalance}`, 'info');
      this.log(`Total ads watched today: ${totalAdsWatched}`, 'info');
      
      return response.data;
    } else {
      this.log(`Ad completion failed: ${response.data?.message}`, 'error');
      return null;
    }
  }

  async testAdStats() {
    this.log('Testing ad statistics retrieval...', 'info');
    
    const response = await this.makeRequest('/api/ads/stats');
    
    if (response.ok) {
      const { 
        dailyAdsWatched, 
        creditsEarnedFromAds, 
        totalCreditsAvailable,
        canWatchMoreAds,
        nextAdAvailableAt
      } = response.data;
      
      this.log('Ad statistics retrieved successfully', 'success');
      this.log(`Daily ads watched: ${dailyAdsWatched}`, 'info');
      this.log(`Credits earned from ads: ${creditsEarnedFromAds}`, 'info');
      this.log(`Total credits available: ${totalCreditsAvailable}`, 'info');
      this.log(`Can watch more ads: ${canWatchMoreAds}`, 'info');
      
      if (nextAdAvailableAt) {
        this.log(`Next ad available at: ${new Date(nextAdAvailableAt).toLocaleString()}`, 'info');
      }
      
      return response.data;
    } else {
      this.log(`Failed to get ad stats: ${response.data?.message}`, 'error');
      return null;
    }
  }

  async testRateLimiting() {
    this.log('Testing rate limiting...', 'info');
    
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(this.makeRequest('/api/ads/eligibility'));
    }
    
    const responses = await Promise.all(promises);
    const rateLimitedCount = responses.filter(r => r.status === 429).length;
    
    if (rateLimitedCount > 0) {
      this.log(`Rate limiting working: ${rateLimitedCount}/10 requests were rate limited`, 'success');
    } else {
      this.log('Rate limiting may not be working properly', 'warning');
    }
  }

  async testFullAdFlow() {
    this.log('Testing complete ad watching flow...', 'info');
    
    // Check eligibility
    const eligibility = await this.testAdEligibility();
    if (!eligibility?.eligible) {
      this.log('User not eligible for ads, skipping flow test', 'warning');
      return false;
    }
    
    // Start ad session
    const sessionToken = await this.testAdSessionStart();
    if (!sessionToken) {
      return false;
    }
    
    // Wait a bit to simulate watching
    this.log('Simulating 30-second ad watch...', 'info');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Complete ad
    const completion = await this.testAdCompletion(sessionToken, 30);
    if (!completion) {
      return false;
    }
    
    // Check updated stats
    await this.testAdStats();
    
    return true;
  }

  async testEdgeCases() {
    this.log('Testing edge cases...', 'info');
    
    // Test with invalid session token
    this.log('Testing invalid session token...', 'info');
    const invalidResponse = await this.testAdCompletion('invalid-token', 30);
    if (!invalidResponse) {
      this.log('Invalid session token properly rejected', 'success');
    } else {
      this.log('Invalid session token was accepted - security issue!', 'error');
    }
    
    // Test with insufficient watch time
    this.log('Testing insufficient watch time...', 'info');
    const sessionToken = await this.testAdSessionStart();
    if (sessionToken) {
      const shortResponse = await this.testAdCompletion(sessionToken, 10);
      if (!shortResponse) {
        this.log('Short watch time properly rejected', 'success');
      } else {
        this.log('Short watch time was accepted - validation issue!', 'error');
      }
    }
  }

  async runAllTests() {
    console.log(chalk.bold.blue('\n🧪 Ad System Testing Suite\n'));
    
    const startTime = Date.now();
    
    try {
      // Basic connectivity
      const isHealthy = await this.testHealthCheck();
      if (!isHealthy) {
        this.log('Server is not healthy, aborting tests', 'error');
        return;
      }
      
      // Authentication
      const isAuthenticated = await this.authenticateTestUser();
      if (!isAuthenticated) {
        this.log('Authentication failed, aborting tests', 'error');
        return;
      }
      
      console.log(chalk.bold.yellow('\n--- Core Functionality Tests ---'));
      await this.testAdEligibility();
      await this.testAdStats();
      
      console.log(chalk.bold.yellow('\n--- Complete Flow Tests ---'));
      await this.testFullAdFlow();
      
      console.log(chalk.bold.yellow('\n--- Security & Edge Case Tests ---'));
      await this.testRateLimiting();
      await this.testEdgeCases();
      
    } catch (error) {
      this.log(`Test suite failed with error: ${error.message}`, 'error');
    } finally {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(chalk.bold.green(`\n✅ Test suite completed in ${duration}s\n`));
    }
  }
}

// Run the tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new AdSystemTester();
  tester.runAllTests().catch(console.error);
}

export default AdSystemTester;