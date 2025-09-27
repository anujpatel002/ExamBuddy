'use client';
import { useEffect } from 'react';

interface GoogleAdProps {
  adSlot: string;
  adFormat?: string;
  style?: React.CSSProperties;
  className?: string;
  fullWidthResponsive?: boolean;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

const GoogleAd: React.FC<GoogleAdProps> = ({ 
  adSlot, 
  adFormat = 'auto', 
  style = { display: 'block' },
  className = '',
  fullWidthResponsive = true 
}) => {
  useEffect(() => {
    try {
      // Initialize AdSense
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, []);

  return (
    <ins
      className={`adsbygoogle ${className}`}
      style={style}
      data-ad-client="ca-pub-3631212035463885"
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      data-full-width-responsive={fullWidthResponsive.toString()}
    />
  );
};

export default GoogleAd;