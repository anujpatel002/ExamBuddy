'use client';
import React, { useState, useEffect, useRef } from 'react';
import { FiPlay, FiPause, FiStar, FiDollarSign, FiClock } from 'react-icons/fi';
import GoogleAd from './GoogleAd';

interface AdViewerProps {
  onAdComplete: (watchDuration: number) => void;
  adSessionToken: string;
  isEligible: boolean;
}

const AdViewer: React.FC<AdViewerProps> = ({
  onAdComplete,
  adSessionToken,
  isEligible
}) => {
  const [watchTime, setWatchTime] = useState(0);
  const [isWatching, setIsWatching] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [canClaim, setCanClaim] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const totalWatchedRef = useRef<number>(0);
  
  const requiredWatchTime = 30; // 30 seconds required
  const minimumWatchTime = 25; // 25 seconds minimum to claim

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startWatching = () => {
    if (isCompleted || !isEligible) return;
    
    setIsWatching(true);
    startTimeRef.current = Date.now();
    
    timerRef.current = setInterval(() => {
      const now = Date.now();
      const sessionTime = Math.floor((now - startTimeRef.current) / 1000);
      const newTotalTime = totalWatchedRef.current + sessionTime;
      
      setWatchTime(newTotalTime);
      
      if (newTotalTime >= minimumWatchTime && !canClaim) {
        setCanClaim(true);
      }
      
      if (newTotalTime >= requiredWatchTime) {
        completeAd();
      }
    }, 1000);
  };

  const pauseWatching = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (startTimeRef.current > 0) {
      const sessionTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
      totalWatchedRef.current += sessionTime;
      startTimeRef.current = 0;
    }
    
    setIsWatching(false);
  };

  const completeAd = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    const finalWatchTime = totalWatchedRef.current + 
      (startTimeRef.current > 0 ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0);
    
    setIsCompleted(true);
    setIsWatching(false);
    setWatchTime(finalWatchTime);
    
    if (finalWatchTime >= minimumWatchTime) {
      onAdComplete(finalWatchTime);
    }
  };

  const claimReward = () => {
    if (canClaim || watchTime >= minimumWatchTime) {
      completeAd();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isEligible) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg text-center">
        <FiStar className="mx-auto mb-4 text-yellow-500" size={48} />
        <h3 className="text-lg font-semibold mb-2">Ad Rewards Not Available</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Ad rewards are only available for free plan users. 
          Upgrade users get unlimited AI credits!
        </p>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 p-6 rounded-lg text-center">
        <FiDollarSign className="mx-auto mb-4 text-green-600 dark:text-green-400" size={48} />
        <h3 className="text-xl font-bold text-green-800 dark:text-green-400 mb-2">
          Congratulations! 🎉
        </h3>
        <p className="text-green-700 dark:text-green-300 mb-4">
          You&apos;ve earned <strong>1 AI credit</strong> by watching the ad!
        </p>
        <div className="text-sm text-green-600 dark:text-green-400">
          Watch time: {watchTime}s / {minimumWatchTime}s required
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
      {/* Ad Header */}
      <div className="bg-yellow-100 dark:bg-yellow-900/30 px-4 py-3 border-b border-yellow-200 dark:border-yellow-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FiDollarSign className="text-yellow-600 dark:text-yellow-400" size={20} />
            <span className="font-medium text-yellow-800 dark:text-yellow-300">
              Watch Ad to Earn 1 AI Credit
            </span>
          </div>
          <div className="text-sm text-yellow-700 dark:text-yellow-400">
            Session: {adSessionToken.substring(0, 8)}...
          </div>
        </div>
      </div>

      {/* Google AdSense Ad Container */}
      <div className="relative bg-gray-50 dark:bg-gray-800">
        <div className="h-64 sm:h-80 flex items-center justify-center">
          <div className="w-full max-w-lg mx-auto p-4">
            <GoogleAd 
              adSlot="1234567890"
              adFormat="rectangle"
              style={{
                display: 'block',
                width: '100%',
                height: '250px'
              }}
            />
          </div>
        </div>

        {/* Timer Overlay */}
        <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg">
          <div className="flex items-center space-x-2">
            <FiClock size={16} />
            <span className="font-mono text-sm">
              {formatTime(watchTime)} / {formatTime(requiredWatchTime)}
            </span>
          </div>
        </div>

        {/* Control Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-4">
              <button
                onClick={isWatching ? pauseWatching : startWatching}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-3 transition-colors duration-200 flex items-center space-x-2"
              >
                {isWatching ? (
                  <FiPause size={20} />
                ) : (
                  <FiPlay size={20} />
                )}
                <span className="text-sm font-medium">
                  {isWatching ? 'Pause' : 'Start'} Watching
                </span>
              </button>
            </div>
            
            {canClaim && (
              <button
                onClick={claimReward}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                Claim 1 Credit
              </button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-600 h-2 rounded-full overflow-hidden mt-3">
            <div
              className={`h-full transition-all duration-300 ${
                watchTime >= minimumWatchTime ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min((watchTime / requiredWatchTime) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Watch Progress
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {watchTime}s / {minimumWatchTime}s required
          </span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              watchTime >= minimumWatchTime ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min((watchTime / minimumWatchTime) * 100, 100)}%` }}
          />
        </div>
        
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {watchTime < minimumWatchTime 
            ? `Click "Start Watching" and view the ad for ${minimumWatchTime - watchTime} more seconds to earn your credit`
            : "✅ Minimum watch time reached! You can claim your credit."
          }
        </p>
      </div>
    </div>
  );
};

export default AdViewer;