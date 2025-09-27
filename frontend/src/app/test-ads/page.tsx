import React from 'react';
import AdTestingDashboard from '../../components/ads/AdTestingDashboard';

const TestAdsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <AdTestingDashboard />
      </div>
    </div>
  );
};

export default TestAdsPage;