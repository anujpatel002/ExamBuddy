'use client';

import React, { useState } from 'react';
import { FiPlay, FiSettings, FiActivity } from 'react-icons/fi';
import AdPlayer from './AdPlayer';

interface TestResult {
  endpoint: string;
  method: string;
  status: number;
  success: boolean;
  data?: Record<string, unknown> | null;
  error?: string | null;
  timestamp: string;
}

const AdTestingDashboard: React.FC = () => {
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const apiEndpoints = [
    { name: 'GET /api/ads/eligibility', url: '/api/ads/eligibility' },
    { name: 'POST /api/ads/start', url: '/api/ads/start' },
    { name: 'POST /api/ads/complete', url: '/api/ads/complete' },
    { name: 'GET /api/ads/stats', url: '/api/ads/stats' }
  ];

  const runApiTest = async (endpoint: string, method: string = 'GET', body?: Record<string, unknown>) => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        ...(body && { body: JSON.stringify(body) })
      });

      const data = await response.json();
      
      const result = {
        endpoint,
        method,
        status: response.status,
        success: response.ok,
        data,
        timestamp: new Date().toLocaleTimeString()
      };

      setTestResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
      return result;
    } catch (error) {
      const result = {
        endpoint,
        method,
        status: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toLocaleTimeString()
      };
      setTestResults(prev => [result, ...prev.slice(0, 9)]);
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const runSequentialTest = async () => {
    setCurrentTest('basic-flow');
    setTestResults([]);
    
    // 1. Check eligibility
    await runApiTest('/api/ads/eligibility');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 2. Start ad session
    const startResult = await runApiTest('/api/ads/start', 'POST');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (startResult.success && startResult.data && typeof startResult.data === 'object' && 'sessionToken' in startResult.data) {
      // 3. Complete ad (simulate 30s watch)
      await runApiTest('/api/ads/complete', 'POST', {
        sessionToken: startResult.data.sessionToken as string,
        watchDuration: 30
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 4. Check updated stats
    await runApiTest('/api/ads/stats');
    
    setCurrentTest(null);
  };

  const handleAdComplete = (watchDuration: number) => {
    console.log(`Ad completed with ${watchDuration}s watch time`);
    const result = {
      endpoint: 'AdPlayer Test',
      method: 'UI',
      status: 200,
      success: true,
      data: { watchDuration, message: 'Ad completed successfully' },
      timestamp: new Date().toLocaleTimeString()
    };
    setTestResults(prev => [result, ...prev.slice(0, 9)]);
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-6xl mx-auto">
      <div className="flex items-center mb-6">
        <FiSettings className="text-blue-600 mr-3" size={32} />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Ad System Testing Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Ad Player */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <FiPlay className="mr-2" />
            Test Ad Player
          </h2>
          
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <AdPlayer onAdComplete={handleAdComplete} />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 In development mode, this shows a test ad. In production, it will show real Google AdSense ads.
            </p>
          </div>
        </div>

        {/* API Testing */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <FiActivity className="mr-2" />
            API Testing
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {apiEndpoints.map((endpoint) => (
              <button
                key={endpoint.url}
                onClick={() => runApiTest(endpoint.url, endpoint.url.includes('/start') || endpoint.url.includes('/complete') ? 'POST' : 'GET')}
                disabled={isLoading}
                className="p-3 text-left bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
              >
                <div className="font-medium text-sm text-gray-900 dark:text-white">
                  {endpoint.name}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={runSequentialTest}
            disabled={isLoading || currentTest !== null}
            className="w-full p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
          >
            {currentTest ? `Running ${currentTest}...` : 'Run Complete Flow Test'}
          </button>

          {/* Test Results */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Test Results</h3>
            
            {testResults.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No tests run yet</p>
            ) : (
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded border-l-4 text-sm ${
                      result.success
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-500'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium">
                        {result.method} {result.endpoint}
                      </span>
                      <span className="text-xs text-gray-500">
                        {result.timestamp}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                      Status: {result.status} | {result.success ? 'Success' : 'Failed'}
                    </div>
                    {result.data && (
                      <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                        {JSON.stringify(result.data, null, 2).slice(0, 200)}
                        {JSON.stringify(result.data).length > 200 && '...'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdTestingDashboard;