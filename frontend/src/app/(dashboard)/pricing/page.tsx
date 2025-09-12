'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { FiCheck } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import SuccessModal from '@/components/ui/SuccessModal';

// IMPORTANT: Replace these with your actual Plan IDs from the Razorpay Dashboard
const proPlanId = 'plan_RGhg2eKjTI6pbx'; 
const premiumPlanId = 'plan_RGhfomkmMSybGn';
const ultraPlanId = 'plan_RGheUTXXGwRjtd';

const PricingPage = () => {
  const [loading, setLoading] = useState('');
  const { user, logout, refreshUser } = useAuth();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [bonusDays, setBonusDays] = useState<{[key: string]: number}>({});
  const [upgradeCosts, setUpgradeCosts] = useState<{[key: string]: any}>({});

  const fetchSubscriptionStatus = async () => {
    try {
      const { data } = await api.get('/auth/subscription-status');
      setSubscriptionStatus(data);
    } catch (error) {
      console.error('Failed to fetch subscription status:', error);
    }
  };

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    
    if (user) {
      fetchSubscriptionStatus();
    }
  }, [user]);

  // Refresh data when user changes (from socket updates)
  useEffect(() => {
    if (user) {
      fetchSubscriptionStatus();
    }
  }, [user?.subscription?.endDate, user?.subscription?.plan]);

  const currentPlan = subscriptionStatus?.plan || user?.subscription?.plan || 'free';
  const isCurrentPlan = (plan: string) => currentPlan === plan;
  const remainingDays = subscriptionStatus?.remainingDays;
  
  // Calculate bonus days and upgrade costs for plan switches
  useEffect(() => {
    if (user && currentPlan !== 'free') {
      const calculatePlanInfo = async (newPlan: string) => {
        try {
          // Calculate bonus days for downgrades
          const bonusRes = await api.post('/auth/calculate-plan-switch', { newPlan });
          const bonusDays = bonusRes.data.bonusDays || 0;
          
          // Calculate upgrade costs for upgrades
          const upgradeRes = await api.post('/auth/calculate-upgrade-cost', { newPlan });
          const upgradeInfo = upgradeRes.data;
          
          return { bonusDays, upgradeInfo };
        } catch (error) {
          return { bonusDays: 0, upgradeInfo: null };
        }
      };
      
      const plans = ['pro', 'premium', 'ultra'];
      Promise.all(plans.map(async (plan) => {
        const { bonusDays, upgradeInfo } = await calculatePlanInfo(plan);
        console.log(`Plan ${plan}:`, { bonusDays, upgradeInfo });
        setBonusDays(prev => ({ ...prev, [plan]: bonusDays }));
        setUpgradeCosts(prev => ({ ...prev, [plan]: upgradeInfo }));
      }));
    }
  }, [user, currentPlan, remainingDays]);

  const handlePlanChange = async (targetPlan: string, plan_id: string) => {
    if (!user?.isVerified) {
      toast.error('Please verify your email before subscribing');
      return;
    }
    
    setLoading(plan_id);
    
    try {
      // Check if this is a downgrade with bonus days
      const planPrices = { pro: 149, premium: 399, ultra: 699 };
      const currentPlanPrice = planPrices[currentPlan as keyof typeof planPrices];
      const targetPlanPrice = planPrices[targetPlan as keyof typeof planPrices];
      
      if (currentPlan !== 'free' && remainingDays > 0 && targetPlanPrice < currentPlanPrice) {
        // Downgrade - apply bonus days without payment
        const confirmSwitch = confirm(`You will switch to ${targetPlan} plan and get ${bonusDays[targetPlan]} extra days instead of a refund. Continue?`);
        if (!confirmSwitch) {
          setLoading('');
          return;
        }
        
        toast.loading('Switching your plan...', { id: 'plan-switch' });
        const { data } = await api.put('/auth/switch-plan', {
          plan: targetPlan
        });
        toast.dismiss('plan-switch');
        toast.success(data.message || `Plan switched successfully! You got ${bonusDays[targetPlan]} extra days.`);
        
        setTimeout(() => {
          fetchSubscriptionStatus();
          refreshUser();
        }, 1000);
      } else {
        // Upgrade or new subscription - process payment
        toast.loading('Initializing payment...', { id: 'payment-init' });
        const { data } = await api.post('/payments/create-subscription', { plan_id });
        toast.dismiss('payment-init');
        
        const planNames = {
          [proPlanId]: 'Pro',
          [premiumPlanId]: 'Premium', 
          [ultraPlanId]: 'Ultra'
        };
        
        const options = {
          key: data.key_id,
          subscription_id: data.subscriptionId,
          name: 'ExamBuddy Subscription',
          description: `${planNames[plan_id as keyof typeof planNames]} Plan Subscription`,
          handler: function (response: any) {
            console.log('Payment successful:', response);
            toast.success('Payment successful! Updating your plan...');
            
            setTimeout(() => {
              fetchSubscriptionStatus();
              setShowSuccessModal(true);
            }, 2000);
          },
          modal: {
            ondismiss: function() {
              console.log('Payment modal closed');
              toast.error('Payment cancelled');
            }
          },
          prefill: {
              name: user?.name,
              email: user?.email,
              contact: user?.phone || ''
          },
          method: {
            upi: true,
            card: true,
            netbanking: true,
            wallet: true
          },
          config: {
            display: {
              blocks: {
                utib: {
                  name: 'Pay using UPI',
                  instruments: [
                    {
                      method: 'upi'
                    }
                  ]
                },
                other: {
                  name: 'Other Payment Methods',
                  instruments: [
                    {
                      method: 'card'
                    },
                    {
                      method: 'netbanking'
                    },
                    {
                      method: 'wallet'
                    }
                  ]
                }
              },
              sequence: ['block.utib', 'block.other'],
              preferences: {
                show_default_blocks: true
              }
            }
          },
          theme: {
              color: "#4f46e5"
          },
          retry: {
            enabled: true,
            max_count: 3
          }
        };
        
        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          console.error('Payment failed:', response.error);
          toast.error(`Payment failed: ${response.error.description}`);
        });
        
        rzp.open();
      }

    } catch (error: any) {
      toast.dismiss('payment-init');
      toast.dismiss('plan-switch');
      console.error('Plan change error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to change plan. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading('');
    }
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">Choose Your Plan</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        
        {/* Free Plan */}
        <div className="border dark:border-gray-700 rounded-lg p-6 flex flex-col">
           <h2 className="text-2xl font-bold">Free</h2>
          <p className="text-4xl font-bold my-4">₹0</p>
          <p className="text-sm text-gray-500 mb-4">Perfect for getting started</p>
          <ul className="space-y-2 text-gray-600 dark:text-gray-400 mb-6">
            <li className="flex items-center gap-2"><FiCheck className="text-green-500"/>2 Subjects</li>
            <li className="flex items-center gap-2"><FiCheck className="text-green-500"/>3 Notes per Subject</li>
            <li className="flex items-center gap-2"><FiCheck className="text-green-500"/>Join Study Rooms</li>
            <li className="flex items-center gap-2"><FiCheck className="text-green-500"/>Basic Quiz Generation</li>
            <li className="flex items-center gap-2"><FiCheck className="text-green-500"/>25 AI Credits (One-time)</li>
          </ul>
          <Button 
            variant={isCurrentPlan('free') ? 'primary' : 'secondary'} 
            className={`mt-auto w-full ${isCurrentPlan('free') ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white'}`}
            disabled={isCurrentPlan('free')}
          >
            {isCurrentPlan('free') ? (
              remainingDays ? `Current Plan (${remainingDays} days left)` : 'Your Current Plan'
            ) : 'Free Plan'}
          </Button>
        </div>

        {/* Pro Plan */}
        <div className="border-2 border-indigo-500 rounded-lg p-6 flex flex-col relative">
          <span className="absolute top-0 -translate-y-1/2 bg-indigo-500 text-white px-3 py-1 text-sm font-semibold rounded-full">Most Popular</span>
          <h2 className="text-2xl font-bold">Pro</h2>
          <p className="text-4xl font-bold my-4">₹149 <span className="text-lg font-normal">/ month</span></p>
          <p className="text-sm text-gray-500 mb-4">Ideal for serious students</p>
          <ul className="space-y-2 text-gray-600 dark:text-gray-400 mb-6">
            <li className="flex items-center gap-2"><FiCheck className="text-green-500"/>8 Subjects</li>
            <li className="flex items-center gap-2"><FiCheck className="text-green-500"/>10 Notes per Subject</li>
            <li className="flex items-center gap-2"><FiCheck className="text-green-500"/>Create Study Rooms</li>
            <li className="flex items-center gap-2"><FiCheck className="text-green-500"/>AI Exam Paper Creator</li>
            <li className="flex items-center gap-2"><FiCheck className="text-green-500"/>Concept Comparison</li>
            <li className="flex items-center gap-2"><FiCheck className="text-green-500"/>100 AI Credits / month</li>
          </ul>
          <Button 
            onClick={() => handlePlanChange('pro', proPlanId)} 
            isLoading={loading === proPlanId} 
            className={`mt-auto w-full ${isCurrentPlan('pro') ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
            disabled={isCurrentPlan('pro')}
          >
            {isCurrentPlan('pro') ? (
              remainingDays ? `Current Plan (${remainingDays} days left)` : 'Your Current Plan'
            ) : bonusDays.pro > 0 ? `Switch + Get ${bonusDays.pro} Extra Days` : 
              (upgradeCosts.pro?.upgradeCost !== undefined && upgradeCosts.pro.upgradeCost >= 0) ? 
                `Upgrade for ₹${upgradeCosts.pro.upgradeCost}` : 'Upgrade to Pro'}
          </Button>
        </div>

        {/* Premium Plan */}
        <div className="border dark:border-gray-700 rounded-lg p-6 flex flex-col">
          <h2 className="text-2xl font-bold">Premium</h2>
          <p className="text-4xl font-bold my-4">₹399 <span className="text-lg font-normal">/ month</span></p>
          <p className="text-sm text-gray-500 mb-4">For advanced learners & educators</p>
          <ul className="space-y-2 text-gray-600 dark:text-gray-400 mb-6">
            <li className="flex items-center gap-2"><FiCheck className="text-green-500"/>Unlimited Subjects</li>
            <li className="flex items-center gap-2"><FiCheck className="text-green-500"/>25 Notes per Subject</li>
            <li className="flex items-center gap-2"><FiCheck className="text-green-500"/>Advanced Study Rooms</li>
            <li className="flex items-center gap-2"><FiCheck className="text-green-500"/>Custom Exam Templates</li>
            <li className="flex items-center gap-2"><FiCheck className="text-green-500"/>Bloom's Taxonomy Analysis</li>
            <li className="flex items-center gap-2"><FiCheck className="text-green-500"/>Priority AI Processing</li>
            <li className="flex items-center gap-2"><FiCheck className="text-green-500"/>300 AI Credits / month</li>
          </ul>
          <Button 
            onClick={() => handlePlanChange('premium', premiumPlanId)} 
            isLoading={loading === premiumPlanId} 
            className={`mt-auto w-full ${isCurrentPlan('premium') ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
            disabled={isCurrentPlan('premium')}
          >
            {isCurrentPlan('premium') ? (
              remainingDays ? `Current Plan (${remainingDays} days left)` : 'Your Current Plan'
            ) : bonusDays.premium > 0 ? `Switch + Get ${bonusDays.premium} Extra Days` : 
              (upgradeCosts.premium?.upgradeCost !== undefined && upgradeCosts.premium.upgradeCost >= 0) ? 
                `Upgrade for ₹${upgradeCosts.premium.upgradeCost}` : 'Upgrade to Premium'}
          </Button>
        </div>
        
        {/* Ultra Plan */}
        <div className="border dark:border-gray-700 rounded-lg p-6 flex flex-col">
          <h2 className="text-2xl font-bold">Ultra</h2>
          <p className="text-4xl font-bold my-4">₹699 <span className="text-lg font-normal">/ month</span></p>
          <p className="text-sm text-gray-500 mb-4">Complete learning ecosystem</p>
          <ul className="space-y-2 text-gray-600 dark:text-gray-400 mb-6">
            <li className="flex items-center gap-2"><FiCheck className="text-green-500"/>Unlimited Everything</li>
            <li className="flex items-center gap-2"><FiCheck className="text-green-500"/>Collaborative Study Rooms</li>
            <li className="flex items-center gap-2"><FiCheck className="text-green-500"/>Advanced Analytics</li>
            <li className="flex items-center gap-2"><FiCheck className="text-green-500"/>Offline Study Mode</li>
            <li className="flex items-center gap-2"><FiCheck className="text-green-500"/>Performance Insights</li>
            <li className="flex items-center gap-2"><FiCheck className="text-green-500"/>24/7 Priority Support</li>
            <li className="flex items-center gap-2"><FiCheck className="text-green-500"/>1000 AI Credits / month</li>
          </ul>
          <Button 
            onClick={() => handlePlanChange('ultra', ultraPlanId)} 
            isLoading={loading === ultraPlanId} 
            className={`mt-auto w-full ${isCurrentPlan('ultra') ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-orange-600 hover:bg-orange-700 text-white'}`}
            disabled={isCurrentPlan('ultra')}
          >
            {isCurrentPlan('ultra') ? (
              remainingDays ? `Current Plan (${remainingDays} days left)` : 'Your Current Plan'
            ) : bonusDays.ultra > 0 ? `Switch + Get ${bonusDays.ultra} Extra Days` : 
              (upgradeCosts.ultra?.upgradeCost !== undefined && upgradeCosts.ultra.upgradeCost >= 0) ? 
                `Upgrade for ₹${upgradeCosts.ultra.upgradeCost}` : 'Upgrade to Ultra'}
          </Button>
        </div>
      </div>
      
      <SuccessModal
        isOpen={showSuccessModal}
        onConfirm={() => {
          setShowSuccessModal(false);
          fetchSubscriptionStatus();
          window.location.reload();
        }}
        title="Plan Updated Successfully!"
        message="Your subscription plan has been updated! The page will refresh to show your new plan."
      />
    </div>
  );
};

export default PricingPage;