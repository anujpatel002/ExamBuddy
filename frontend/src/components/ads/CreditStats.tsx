'use client';
import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiPlay, FiStar, FiTrendingUp } from 'react-icons/fi';
import { useAuth } from '@/hooks/useAuth';
import AdRewardSystem from '@/components/ads/AdRewardSystem';

interface AdStatsType {
  eligible: boolean;
  dailyAdsWatched: number;
  dailyAdLimit: number;
  remainingAds: number;
  totalCreditsFromAds: number;
  currentCredits: number;
  subscriptionPlan: string;
}

interface CreditStatsProps {
  className?: string;
}

const CreditStats: React.FC<CreditStatsProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [showAdSystem, setShowAdSystem] = useState(false);
  const [adStats, setAdStats] = useState<AdStatsType | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAdStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ads/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAdStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch ad stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.subscription?.plan === 'free') {
      fetchAdStats();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Premium users - show unlimited credits
  if (user?.subscription?.plan !== 'free') {
    return (
      <div className={`glass-card p-6 rounded-2xl ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold theme-text-primary">AI Credits</h3>
          <FiStar className="text-purple-500" size={24} />
        </div>
        
        <div className="text-center py-6">
          <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
            ∞
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Unlimited Credits
          </div>
          <div className="inline-flex items-center px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
            {user?.subscription?.plan} Plan
          </div>
        </div>
      </div>
    );
  }

  // Free users - show ad credit system
  return (
    <>
      <div className={`glass-card p-6 rounded-2xl ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold theme-text-primary">AI Credits</h3>
          <FiDollarSign className="text-yellow-500" size={24} />
        </div>

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Current Credits */}
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                {adStats?.currentCredits || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Available Credits
              </div>
            </div>

            {/* Ad Stats */}
            {adStats && (
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">
                    {adStats.remainingAds}
                  </div>
                  <div className="text-xs text-green-700 dark:text-green-300">
                    Ads Left Today
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                  <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {adStats.totalCreditsFromAds}
                  </div>
                  <div className="text-xs text-purple-700 dark:text-purple-300">
                    Total from Ads
                  </div>
                </div>
              </div>
            )}

            {/* Watch Ad Button */}
            {adStats?.eligible && adStats?.remainingAds > 0 ? (
              <button
                onClick={() => setShowAdSystem(true)}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-medium py-3 px-4 rounded-lg shadow-md transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <FiPlay size={18} />
                <span>Watch Ad for 1 Credit</span>
              </button>
            ) : adStats?.remainingAds === 0 ? (
              <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-sm text-orange-700 dark:text-orange-300">
                  Daily limit reached! Come back tomorrow 🌅
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAdSystem(true)}
                className="w-full bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-medium py-3 px-4 rounded-lg cursor-not-allowed flex items-center justify-center space-x-2"
                disabled
              >
                <FiTrendingUp size={18} />
                <span>View Ad Stats</span>
              </button>
            )}

            {/* Quick upgrade link */}
            <div className="text-center pt-2">
              <button
                onClick={() => window.open('/pricing', '_blank')}
                className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
              >
                Upgrade for unlimited credits →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ad Reward System Modal/Overlay */}
      {showAdSystem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Earn AI Credits
                </h2>
                <button
                  onClick={() => {
                    setShowAdSystem(false);
                    fetchAdStats(); // Refresh stats when closing
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <AdRewardSystem />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CreditStats;