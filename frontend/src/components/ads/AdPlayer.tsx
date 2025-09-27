'use client';

import React from 'react';
import TestAd from './TestAd';
import GoogleAd from './GoogleAd';

interface AdPlayerProps {
  onAdComplete: (watchDuration: number) => void;
  onAdSkip?: () => void;
  publisherId?: string;
  adSlot?: string;
}

const AdPlayer: React.FC<AdPlayerProps> = ({
  onAdComplete,
  onAdSkip,
  publisherId,
  adSlot
}) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const handleTestAdComplete = () => {
    // In test mode, consider full 30 seconds watched
    onAdComplete(30);
  };

  const handleTestAdSkip = () => {
    // In test mode, consider 25 seconds watched (minimum for reward)
    onAdComplete(25);
    if (onAdSkip) onAdSkip();
  };

  if (isDevelopment) {
    return (
      <div className="w-full">
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded-lg">
          <div className="flex items-center">
            <div className="text-yellow-800 font-semibold">🧪 Development Mode</div>
          </div>
          <p className="text-yellow-700 text-sm mt-1">
            Using test ads for local development. Real AdSense ads will show in production.
          </p>
        </div>
        
        <TestAd 
          onAdComplete={handleTestAdComplete}
          onAdSkip={handleTestAdSkip}
          duration={30}
        />
      </div>
    );
  }

  // Production mode - use real Google AdSense
  return (
    <div className="w-full">
      <GoogleAd 
        publisherId={publisherId || "ca-pub-3631212035463885"}
        adSlot={adSlot || "your-ad-slot-id"}
        onAdComplete={onAdComplete}
      />
    </div>
  );
};

export default AdPlayer;