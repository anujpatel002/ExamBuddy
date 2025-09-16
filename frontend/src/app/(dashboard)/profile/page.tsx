'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import { useRouter } from 'next/navigation';

// Define the credit limits for each plan
const PLAN_LIMITS: { [key: string]: number } = {
    free: 20,
    pro: 150,
    premium: 500,
    ultra: 1000,
};

const ProfilePage = () => {
  const { user, login, refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      setName(user.name);
      fetchSubscriptionStatus();
    }
  }, [user]);

  const fetchSubscriptionStatus = async () => {
    try {
      const { data } = await api.get('/auth/subscription-status');
      setSubscriptionStatus(data);
      console.log('Subscription Status:', data); // Debug log
    } catch (error) {
      console.error('Failed to fetch subscription status:', error);
      // Fallback to user data if API fails
      if (user?.subscription) {
        setSubscriptionStatus({
          plan: user.subscription.plan,
          status: user.subscription.status,
          endDate: user.subscription.endDate,
          remainingDays: user.subscription.endDate ? 
            Math.ceil((new Date(user.subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24)) : null
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.put('/users/profile', { name });
      await login(user!.token);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = () => {
    router.push('/pricing');
  };
  
  if (!user) {
    return <div className="flex justify-center py-8"><Spinner /></div>;
  }

  const plan = subscriptionStatus?.plan || user.subscription?.plan || 'free';
  const isSubscribed = plan !== 'free' && (subscriptionStatus?.status || user.subscription?.status) === 'active';
  const remainingDays = subscriptionStatus?.remainingDays;
  const endDate = subscriptionStatus?.endDate;
  const isActive = subscriptionStatus?.isActive;
  const baseCreditLimit = PLAN_LIMITS[plan] || 0;
  const customCredits = user.usage?.customCredits || 0;
  const creditLimit = baseCreditLimit + customCredits;
  const usedCredits = user.usage?.requests || 0;
  const remainingCredits = creditLimit - usedCredits;
  const usagePercentage = creditLimit > 0 ? (usedCredits / creditLimit) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 page-transition">
      <div className="glass-card p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-xl float"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-2">Your Profile</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your account settings and subscription</p>
        </div>
      </div>

      {/* Profile Details Form */}
      <div className="glass-card p-8 rounded-3xl">
        <h2 className="text-xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Profile Information</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 rounded-xl backdrop-blur-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
            <input 
              type="email" 
              value={user.email} 
              disabled 
              className="w-full px-4 py-3 border border-gray-200/50 dark:border-gray-600/50 bg-gray-100/50 dark:bg-gray-700/50 rounded-xl backdrop-blur-sm opacity-60 cursor-not-allowed"
            />
          </div>
          <div className="text-right">
            <button type="submit" disabled={isLoading} className="btn-modern px-8 py-3">
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Subscription Details */}
      <div className="glass-card p-8 rounded-3xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Subscription Plan</h2>
          <button 
            onClick={async () => {
              setIsRefreshing(true);
              await refreshUser();
              await fetchSubscriptionStatus();
              setIsRefreshing(false);
            }}
            disabled={isRefreshing}
            className="px-4 py-2 bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-600/50 rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 text-sm font-medium"
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${plan === 'free' ? 'bg-gray-400' : 'bg-gradient-to-r from-blue-500 to-purple-500'}`}></div>
              <p className="text-lg font-semibold">
                <span className="capitalize bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{plan}</span> Plan
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
              }`}>
                {subscriptionStatus?.status || user.subscription?.status || 'Inactive'}
              </span>
            </div>
            {plan !== 'free' && endDate && (
              <div className="space-y-2">
                {remainingDays !== null && remainingDays > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⏰</span>
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {remainingDays} days remaining
                    </span>
                  </div>
                ) : remainingDays === 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⚠️</span>
                    <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                      Expires today
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">❌</span>
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                      Expired on {new Date(endDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  📅 {remainingDays > 0 ? 'Expires' : 'Expired'} on {new Date(endDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
          <button onClick={() => router.push('/pricing')} className="btn-modern px-6 py-3">
            {isSubscribed ? 'Manage Subscription' : 'Upgrade Plan'}
          </button>
        </div>
      </div>

      {/* Usage Statistics */}
      <div className="glass-card p-8 rounded-3xl">
        <h2 className="text-xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          {plan === 'free' ? 'One-Time AI Credits' : 'Monthly AI Credits'}
        </h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
              <span className="font-medium">Used: {usedCredits}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-medium">Remaining: {remainingCredits > 0 ? remainingCredits : 0} / {creditLimit}</span>
              <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
            </div>
          </div>
          <div className="relative">
            <div className="w-full bg-gray-200/50 dark:bg-gray-700/50 rounded-full h-4 backdrop-blur-sm">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-4 rounded-full transition-all duration-500 shadow-lg" 
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              ></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white drop-shadow-lg">
                {Math.round(usagePercentage)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;