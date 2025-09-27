'use client';

import React, { useState, useEffect } from 'react';
import { FiPlay, FiPause, FiVolume2, FiVolumeX } from 'react-icons/fi';

interface TestAdProps {
  onAdComplete: () => void;
  onAdSkip?: () => void;
  duration?: number; // Duration in seconds, default 30
}

const TestAd: React.FC<TestAdProps> = ({ 
  onAdComplete, 
  onAdSkip, 
  duration = 30 
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [canSkip, setCanSkip] = useState(false);

  // Sample test ad data
  const testAds = [
    {
      title: "🎓 Study Smart App",
      description: "Boost your learning with AI-powered study tools",
      cta: "Download Now",
      bgColor: "bg-gradient-to-r from-blue-500 to-purple-600"
    },
    {
      title: "📚 BookStore Online",
      description: "Get 50% off on all educational books this month",
      cta: "Shop Now",
      bgColor: "bg-gradient-to-r from-green-500 to-teal-600"
    },
    {
      title: "💻 Coding Bootcamp",
      description: "Learn programming in 12 weeks. Career guaranteed!",
      cta: "Enroll Today",
      bgColor: "bg-gradient-to-r from-orange-500 to-red-600"
    }
  ];

  const [currentAd] = useState(() => 
    testAds[Math.floor(Math.random() * testAds.length)]
  );

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsPlaying(false);
            onAdComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    // Allow skipping after 25 seconds (like real ads)
    if (duration - timeLeft >= 25) {
      setCanSkip(true);
    }

    return () => clearInterval(interval);
  }, [isPlaying, timeLeft, onAdComplete, duration]);

  useEffect(() => {
    // Auto-start the ad after 1 second
    const autoStart = setTimeout(() => setIsPlaying(true), 1000);
    return () => clearTimeout(autoStart);
  }, []);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSkip = () => {
    if (canSkip && onAdSkip) {
      onAdSkip();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = ((duration - timeLeft) / duration) * 100;

  return (
    <div className="relative w-full h-full min-h-[400px] bg-black rounded-lg overflow-hidden">
      {/* Test Ad Content */}
      <div className={`absolute inset-0 ${currentAd.bgColor} flex flex-col justify-center items-center text-white p-8`}>
        {/* Ad Content */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold mb-4">{currentAd.title}</h2>
          <p className="text-xl mb-6">{currentAd.description}</p>
          <button className="bg-white text-gray-900 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors">
            {currentAd.cta}
          </button>
        </div>

        {/* Simulated Video Controls */}
        <div className="absolute bottom-20 left-0 right-0 px-6">
          <div className="flex items-center justify-between text-white mb-4">
            <div className="flex items-center space-x-4">
              <button 
                onClick={handlePlayPause}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              >
                {isPlaying ? <FiPause size={24} /> : <FiPlay size={24} />}
              </button>
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              >
                {isMuted ? <FiVolumeX size={24} /> : <FiVolume2 size={24} />}
              </button>
              <span className="text-sm">{formatTime(timeLeft)}</span>
            </div>
            
            {canSkip && (
              <button 
                onClick={handleSkip}
                className="bg-gray-600 bg-opacity-80 px-4 py-2 rounded-full text-sm hover:bg-opacity-100 transition-colors"
              >
                Skip Ad
              </button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-600 bg-opacity-50 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Test Ad Indicator */}
      <div className="absolute top-4 left-4 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-semibold">
        TEST AD
      </div>

      {/* Time Display */}
      <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
        {formatTime(timeLeft)}
      </div>

      {/* Skip Timer */}
      {!canSkip && (
        <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
          Skip in {Math.max(0, 25 - (duration - timeLeft))}s
        </div>
      )}

      {/* Play/Pause Overlay */}
      {!isPlaying && timeLeft > 0 && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <button 
            onClick={handlePlayPause}
            className="bg-white bg-opacity-90 p-6 rounded-full hover:bg-opacity-100 transition-colors"
          >
            <FiPlay size={48} className="text-black ml-1" />
          </button>
        </div>
      )}
    </div>
  );
};

export default TestAd;