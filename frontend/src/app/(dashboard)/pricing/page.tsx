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

  const handleSubscribe = async (plan_id: string) => {
    if (!user?.isVerified) {
      toast.error('Please verify your email before subscribing');
      return;
    }
    
    setLoading(plan_id);
    try {
      toast.loading('Initializing payment...', { id: 'payment-init' });
      const { data } = await api.post('/payments/create-subscription', { plan_id });
      toast.dismiss('payment-init');
      
      const planNames = {
        'plan_RDXlqcfQJ71hbm': 'Pro',
        'plan_RDXm8g4DU0U19i': 'Premium', 
        'plan_REkLuEt6XCuh08': 'Ultra'
      };
      
      const options = {
        key: data.key_id,
        subscription_id: data.subscriptionId,
        name: 'ExamBuddy Subscription',
        description: `${planNames[plan_id as keyof typeof planNames]} Plan Subscription`,
        handler: function (response: any) {
          console.log('Payment successful:', response);
          toast.success('Payment successful! Updating your plan...');
          
          // Refresh subscription status after successful payment
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

    } catch (error: any) {
      toast.dismiss('payment-init');
      console.error('Subscription error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to start subscription. Please try again.';
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
            onClick={() => handleSubscribe(proPlanId)} 
            isLoading={loading === proPlanId} 
            className={`mt-auto w-full ${isCurrentPlan('pro') ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
            disabled={isCurrentPlan('pro')}
          >
            {isCurrentPlan('pro') ? (
              remainingDays ? `Current Plan (${remainingDays} days left)` : 'Your Current Plan'
            ) : 'Upgrade to Pro'}
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
            onClick={() => handleSubscribe(premiumPlanId)} 
            isLoading={loading === premiumPlanId} 
            className={`mt-auto w-full ${isCurrentPlan('premium') ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
            disabled={isCurrentPlan('premium')}
          >
            {isCurrentPlan('premium') ? (
              remainingDays ? `Current Plan (${remainingDays} days left)` : 'Your Current Plan'
            ) : 'Upgrade to Premium'}
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
            onClick={() => handleSubscribe(ultraPlanId)} 
            isLoading={loading === ultraPlanId} 
            className={`mt-auto w-full ${isCurrentPlan('ultra') ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-orange-600 hover:bg-orange-700 text-white'}`}
            disabled={isCurrentPlan('ultra')}
          >
            {isCurrentPlan('ultra') ? (
              remainingDays ? `Current Plan (${remainingDays} days left)` : 'Your Current Plan'
            ) : 'Upgrade to Ultra'}
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