'use client';
import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiAlertCircle, FiLoader, FiGift, FiCalendar } from 'react-icons/fi';
import AdPlayer from './AdPlayer';

interface AdStats {
  eligible: boolean;
  dailyAdsWatched: number;
  dailyAdLimit: number;
  remainingAds: number;
  totalCreditsFromAds: number;
  currentCredits: number;
  subscriptionPlan: string;
}

const AdRewardSystem: React.FC = () => {
  const [stats, setStats] = useState<AdStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adSessionToken, setAdSessionToken] = useState<string | null>(null);
  const [showAdViewer, setShowAdViewer] = useState(false);
  const [processingReward, setProcessingReward] = useState(false);

  // Fetch ad eligibility and stats
  const fetchAdStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/ads/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch ad statistics');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Start ad session
  const startAdSession = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch('/api/ads/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAdSessionToken(data.adSessionToken);
        setShowAdViewer(true);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to start ad session');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Complete ad and claim reward
  const completeAdReward = async (watchDuration: number) => {
    if (!adSessionToken) return;

    try {
      setProcessingReward(true);
      const token = localStorage.getItem('token');

      const response = await fetch('/api/ads/complete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adSessionToken,
          watchDuration: Math.floor(watchDuration),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Refresh stats to show updated credits
        await fetchAdStats();
        
        // Reset ad viewer
        setShowAdViewer(false);
        setAdSessionToken(null);
        setError(null);
        
        // Show success message
        alert(`🎉 ${data.message}\nTotal Credits: ${data.totalCredits}`);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to complete ad reward');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setProcessingReward(false);
    }
  };

  useEffect(() => {
    fetchAdStats();
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center p-8">
        <FiLoader className="animate-spin mr-2" size={24} />
        <span>Loading ad rewards...</span>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-4 rounded-lg">
        <div className="flex items-center">
          <FiAlertCircle className="text-red-500 mr-2" size={20} />
          <span className="text-red-700 dark:text-red-300">{error}</span>
        </div>
        <button 
          onClick={fetchAdStats}
          className="mt-2 text-red-600 dark:text-red-400 underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    );
  }

  // Show ad viewer if active
  if (showAdViewer && adSessionToken && stats) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Watch Ad for Credit
          </h2>
          <button
            onClick={() => {
              setShowAdViewer(false);
              setAdSessionToken(null);
            }}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕ Cancel
          </button>
        </div>
        
        <AdPlayer
          onAdComplete={completeAdReward}
          publisherId="ca-pub-3631212035463885"
        />
        
        {processingReward && (
          <div className="flex items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <FiLoader className="animate-spin mr-2" size={20} />
            <span>Processing your reward...</span>
          </div>
        )}
      </div>
    );
  }

  if (!stats) return null;

  // Non-eligible users (premium plans)
  if (!stats.eligible && stats.subscriptionPlan !== 'free') {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-700">
        <div className="flex items-center mb-4">
          <FiGift className="text-purple-600 dark:text-purple-400 mr-3" size={32} />
          <div>
            <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-300">
              Premium User Benefits
            </h3>
            <p className="text-purple-600 dark:text-purple-400">
              Enjoy unlimited AI credits with your {stats.subscriptionPlan} plan!
            </p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                ∞
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">AI Credits</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats.currentCredits}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Current Balance</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Daily limit reached
  if (!stats.eligible && stats.remainingAds === 0) {
    return (
      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 p-6 rounded-lg">
        <div className="flex items-center mb-4">
          <FiCalendar className="text-orange-600 dark:text-orange-400 mr-3" size={24} />
          <div>
            <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-300">
              Daily Ad Limit Reached
            </h3>
            <p className="text-orange-600 dark:text-orange-400">
              You've watched {stats.dailyAdsWatched} ads today. Come back tomorrow for more!
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
            <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
              {stats.totalCreditsFromAds}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total from Ads</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {stats.currentCredits}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Current Credits</div>
          </div>
        </div>
      </div>
    );
  }

  // Main ad reward interface
  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="text-red-500 mr-2" size={20} />
            <span className="text-red-700 dark:text-red-300">{error}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-full">
            <FiDollarSign className="text-yellow-600 dark:text-yellow-400" size={32} />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Earn AI Credits by Watching Ads
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Watch 30-second ads to earn 1 AI credit each. Free for all users!
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.remainingAds}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Ads Left Today</div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.currentCredits}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">AI Credits</div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.dailyAdsWatched}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Watched Today</div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {stats.totalCreditsFromAds}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total from Ads</div>
          </div>
        </div>
      </div>

      {/* Watch Ad Button */}
      <div className="text-center">
        <button
          onClick={startAdSession}
          disabled={loading || !stats.eligible}
          className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? (
            <>
              <FiLoader className="animate-spin inline mr-2" size={20} />
              Starting...
            </>
          ) : (
            <>
              <FiDollarSign className="inline mr-2" size={20} />
              Watch Ad for 1 Credit
            </>
          )}
        </button>
        
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          30 seconds • Earn 1 AI credit • {stats.remainingAds} remaining today
        </p>
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Daily Progress
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {stats.dailyAdsWatched} / {stats.dailyAdLimit}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 h-3 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-green-500 to-blue-500 h-full transition-all duration-300"
            style={{ 
              width: `${(stats.dailyAdsWatched / stats.dailyAdLimit) * 100}%` 
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AdRewardSystem;