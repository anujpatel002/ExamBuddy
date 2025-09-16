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
        // Redirect to WhatsApp for manual plan upgrade/downgrade
        const planNames = {
          [proPlanId]: 'Pro',
          [premiumPlanId]: 'Premium', 
          [ultraPlanId]: 'Ultra'
        };
        
        const planName = planNames[plan_id as keyof typeof planNames];
        const message = `Hi, I want to upgrade to ${planName} plan.\n\nName: ${user?.name}\nEmail: ${user?.email}\nCurrent Plan: ${currentPlan}\nRequested Plan: ${targetPlan}`;
        const whatsappUrl = `https://wa.me/916353432070?text=${encodeURIComponent(message)}`;
        
        window.open(whatsappUrl, '_blank');
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
    <div className="page-transition">
      <div className="glass-card p-8 rounded-3xl mb-12 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-xl float"></div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold theme-text-primary mb-4">Choose Your Plan</h1>
          <p className="theme-text-secondary text-lg">Unlock the full potential of AI-powered learning</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        
        {/* Free Plan */}
        <div className="stagger-item glass-card p-8 rounded-3xl flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-gray-500/10 to-gray-600/10 rounded-full blur-lg"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <h2 className="text-2xl font-bold theme-text-primary">Free</h2>
            </div>
            <div className="mb-6">
              <p className="text-5xl font-bold theme-text-primary">₹0</p>
              <p className="theme-text-secondary mt-2">Perfect for getting started</p>
            </div>
            <ul className="space-y-3 text-gray-600 dark:text-gray-400 mb-8">
              <li className="flex items-center gap-3"><div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"><FiCheck className="text-white text-xs"/></div>2 Subjects</li>
              <li className="flex items-center gap-3"><div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"><FiCheck className="text-white text-xs"/></div>3 Notes per Subject</li>
              <li className="flex items-center gap-3"><div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"><FiCheck className="text-white text-xs"/></div>Join Study Rooms</li>
              <li className="flex items-center gap-3"><div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"><FiCheck className="text-white text-xs"/></div>Basic Quiz Generation</li>
              <li className="flex items-center gap-3"><div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"><FiCheck className="text-white text-xs"/></div>25 AI Credits (One-time)</li>
            </ul>
            <button 
              className={`mt-auto w-full py-4 px-6 rounded-2xl font-semibold transition-all duration-300 ${isCurrentPlan('free') ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg' : 'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white'}`}
              disabled={isCurrentPlan('free')}
            >
              {isCurrentPlan('free') ? (
                remainingDays ? `Current Plan (${remainingDays} days left)` : 'Your Current Plan'
              ) : 'Free Plan'}
            </button>
          </div>
        </div>

        {/* Pro Plan */}
        <div className="stagger-item glass-card p-8 rounded-3xl flex flex-col relative overflow-visible border-2 border-indigo-500/30 shadow-xl">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-2 text-sm font-bold rounded-full shadow-lg z-30">Most Popular</div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
              <h2 className="text-2xl font-bold">Pro</h2>
            </div>
            <div className="mb-6">
              <p className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">₹149 <span className="text-lg font-normal text-gray-600 dark:text-gray-400">/ month</span></p>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Ideal for serious students</p>
            </div>
            <ul className="space-y-3 text-gray-600 dark:text-gray-400 mb-8">
              <li className="flex items-center gap-3"><div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"><FiCheck className="text-white text-xs"/></div>8 Subjects</li>
              <li className="flex items-center gap-3"><div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"><FiCheck className="text-white text-xs"/></div>10 Notes per Subject</li>
              <li className="flex items-center gap-3"><div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"><FiCheck className="text-white text-xs"/></div>Create Study Rooms</li>
              <li className="flex items-center gap-3"><div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"><FiCheck className="text-white text-xs"/></div>AI Exam Paper Creator</li>
              <li className="flex items-center gap-3"><div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"><FiCheck className="text-white text-xs"/></div>Concept Comparison</li>
              <li className="flex items-center gap-3"><div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"><FiCheck className="text-white text-xs"/></div>100 AI Credits / month</li>
            </ul>
            <button 
              onClick={() => handlePlanChange('pro', proPlanId)} 
              disabled={loading === proPlanId || isCurrentPlan('pro')}
              className={`mt-auto w-full py-4 px-6 rounded-2xl font-semibold transition-all duration-300 ${isCurrentPlan('pro') ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg' : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'}`}
            >
              {loading === proPlanId ? 'Processing...' : isCurrentPlan('pro') ? (
                remainingDays ? `Current Plan (${remainingDays} days left)` : 'Your Current Plan'
              ) : bonusDays.pro > 0 ? `Switch + Get ${bonusDays.pro} Extra Days` : 
                (upgradeCosts.pro?.upgradeCost !== undefined && upgradeCosts.pro.upgradeCost >= 0) ? 
                  `Upgrade for ₹${upgradeCosts.pro.upgradeCost}` : 'Upgrade to Pro'}
            </button>
          </div>
        </div>

        {/* Premium Plan */}
        <div className="stagger-item glass-card p-8 rounded-3xl flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
              <h2 className="text-2xl font-bold">Premium</h2>
            </div>
            <div className="mb-6">
              <p className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">₹399 <span className="text-lg font-normal text-gray-600 dark:text-gray-400">/ month</span></p>
              <p className="text-gray-600 dark:text-gray-400 mt-2">For advanced learners & educators</p>
            </div>
            <ul className="space-y-3 text-gray-600 dark:text-gray-400 mb-8">
              <li className="flex items-center gap-3"><div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"><FiCheck className="text-white text-xs"/></div>Unlimited Subjects</li>
              <li className="flex items-center gap-3"><div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"><FiCheck className="text-white text-xs"/></div>25 Notes per Subject</li>
              <li className="flex items-center gap-3"><div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"><FiCheck className="text-white text-xs"/></div>Advanced Study Rooms</li>
              <li className="flex items-center gap-3"><div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"><FiCheck className="text-white text-xs"/></div>Custom Exam Templates</li>
              <li className="flex items-center gap-3"><div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"><FiCheck className="text-white text-xs"/></div>Bloom's Taxonomy Analysis</li>
              <li className="flex items-center gap-3"><div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"><FiCheck className="text-white text-xs"/></div>Priority AI Processing</li>
              <li className="flex items-center gap-3"><div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"><FiCheck className="text-white text-xs"/></div>300 AI Credits / month</li>
            </ul>
            <button 
              onClick={() => handlePlanChange('premium', premiumPlanId)} 
              disabled={loading === premiumPlanId || isCurrentPlan('premium')}
              className={`mt-auto w-full py-4 px-6 rounded-2xl font-semibold transition-all duration-300 ${isCurrentPlan('premium') ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg' : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'}`}
            >
              {loading === premiumPlanId ? 'Processing...' : isCurrentPlan('premium') ? (
                remainingDays ? `Current Plan (${remainingDays} days left)` : 'Your Current Plan'
              ) : bonusDays.premium > 0 ? `Switch + Get ${bonusDays.premium} Extra Days` : 
                (upgradeCosts.premium?.upgradeCost !== undefined && upgradeCosts.premium.upgradeCost >= 0) ? 
                  `Upgrade for ₹${upgradeCosts.premium.upgradeCost}` : 'Upgrade to Premium'}
            </button>
          </div>
        </div>
        
        {/* Ultra Plan */}
        <div className="stagger-item glass-card p-8 rounded-3xl flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full blur-xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
              <h2 className="text-2xl font-bold">Ultra</h2>
            </div>
            <div className="mb-6">
              <p className="text-5xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">₹699 <span className="text-lg font-normal text-gray-600 dark:text-gray-400">/ month</span></p>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Complete learning ecosystem</p>
            </div>
            <ul className="space-y-3 text-gray-600 dark:text-gray-400 mb-8">
              <li className="flex items-center gap-3"><div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"><FiCheck className="text-white text-xs"/></div>Unlimited Everything</li>
              <li className="flex items-center gap-3"><div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"><FiCheck className="text-white text-xs"/></div>Collaborative Study Rooms</li>
              <li className="flex items-center gap-3"><div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"><FiCheck className="text-white text-xs"/></div>Advanced Analytics</li>
              <li className="flex items-center gap-3"><div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"><FiCheck className="text-white text-xs"/></div>Offline Study Mode</li>
              <li className="flex items-center gap-3"><div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"><FiCheck className="text-white text-xs"/></div>Performance Insights</li>
              <li className="flex items-center gap-3"><div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"><FiCheck className="text-white text-xs"/></div>24/7 Priority Support</li>
              <li className="flex items-center gap-3"><div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"><FiCheck className="text-white text-xs"/></div>1000 AI Credits / month</li>
            </ul>
            <button 
              onClick={() => handlePlanChange('ultra', ultraPlanId)} 
              disabled={loading === ultraPlanId || isCurrentPlan('ultra')}
              className={`mt-auto w-full py-4 px-6 rounded-2xl font-semibold transition-all duration-300 ${isCurrentPlan('ultra') ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg' : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'}`}
            >
              {loading === ultraPlanId ? 'Processing...' : isCurrentPlan('ultra') ? (
                remainingDays ? `Current Plan (${remainingDays} days left)` : 'Your Current Plan'
              ) : bonusDays.ultra > 0 ? `Switch + Get ${bonusDays.ultra} Extra Days` : 
                (upgradeCosts.ultra?.upgradeCost !== undefined && upgradeCosts.ultra.upgradeCost >= 0) ? 
                  `Upgrade for ₹${upgradeCosts.ultra.upgradeCost}` : 'Upgrade to Ultra'}
            </button>
          </div>
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