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
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <h1 className="text-3xl font-bold">Your Profile</h1>

      {/* Profile Details Form */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
            <Input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <Input 
              type="email" 
              value={user.email} 
              disabled 
              className="mt-1 bg-gray-100 dark:bg-gray-700"
            />
          </div>
          <div className="text-right">
            <Button type="submit" isLoading={isLoading}>Save Changes</Button>
          </div>
        </form>
      </div>

      {/* Subscription Details */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Subscription Plan</h2>
          <Button 
            onClick={async () => {
              setIsRefreshing(true);
              await refreshUser();
              await fetchSubscriptionStatus();
              setIsRefreshing(false);
            }}
            variant="secondary"
            size="sm"
            isLoading={isRefreshing}
          >
            Refresh
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-lg">
              You are currently on the <span className="font-bold text-indigo-500 capitalize">{plan}</span> plan.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Status: <span className={`capitalize ${isActive ? 'text-green-600' : 'text-red-600'}`}>
                {subscriptionStatus?.status || user.subscription?.status || 'Inactive'}
              </span>
            </p>
            {plan !== 'free' && (
              <div className="mt-2 space-y-1">
                {endDate ? (
                  <>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {remainingDays !== null && remainingDays > 0 ? (
                        <span className="text-blue-600 font-medium">
                          ⏰ {remainingDays} days remaining
                        </span>
                      ) : remainingDays === 0 ? (
                        <span className="text-orange-600 font-medium">
                          ⚠️ Expires today
                        </span>
                      ) : (
                        <span className="text-red-600 font-medium">
                          ❌ Expired on {new Date(endDate).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      📅 {remainingDays > 0 ? 'Expires' : 'Expired'} on {new Date(endDate).toLocaleDateString()}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-orange-600">
                    ⚠️ No expiration date set - Contact admin
                  </p>
                )}
              </div>
            )}
          </div>
          <Button onClick={() => router.push('/pricing')}>
            {isSubscribed ? 'Manage Subscription' : 'Upgrade Plan'}
          </Button>
        </div>
      </div>

      {/* Usage Statistics */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">
          {plan === 'free' ? 'One-Time AI Credits' : 'Monthly AI Credits'}
        </h2>
        <div>
          <div className="flex justify-between mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            <span>Used: {usedCredits}</span>
            <span>Remaining: {remainingCredits > 0 ? remainingCredits : 0} / {creditLimit}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div 
              className="bg-indigo-600 h-2.5 rounded-full" 
              style={{ width: `${usagePercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;