'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { FiCheck } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import SuccessModal from '@/components/ui/SuccessModal';

// IMPORTANT: Replace these with your actual Plan IDs from the Razorpay Dashboard
const proPlanId = 'plan_RDXlqcfQJ71hbm'; 
const premiumPlanId = 'plan_RDXm8g4DU0U19i';
const ultraPlanId = 'plan_REkLuEt6XCuh08';

const PricingPage = () => {
  const [loading, setLoading] = useState('');
  const { user, logout } = useAuth();
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handleSubscribe = async (plan_id: string) => {
    setLoading(plan_id);
    try {
      const { data } = await api.post('/payments/create-subscription', { plan_id });
      
      const options = {
        key: data.key_id,
        subscription_id: data.subscriptionId,
        name: 'ExamBuddy Subscription',
        handler: function (response: any) {
          setShowSuccessModal(true);
        },
        prefill: {
            name: user?.name,
            email: user?.email,
        },
        theme: {
            color: "#4f46e5"
        }
      };
      
      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (error) {
      toast.error('Failed to start subscription. Please try again.');
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
          <Button variant="secondary" className="mt-auto w-full" disabled>Your Current Plan</Button>
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
          <Button onClick={() => handleSubscribe(proPlanId)} isLoading={loading === proPlanId} className="mt-auto w-full">Upgrade to Pro</Button>
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
          <Button onClick={() => handleSubscribe(premiumPlanId)} isLoading={loading === premiumPlanId} className="mt-auto w-full">Upgrade to Premium</Button>
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
          <Button onClick={() => handleSubscribe(ultraPlanId)} isLoading={loading === ultraPlanId} className="mt-auto w-full">Upgrade to Ultra</Button>
        </div>
      </div>
      
      <SuccessModal
        isOpen={showSuccessModal}
        onConfirm={logout}
        title="Plan Updated Successfully!"
        message="Your subscription plan will be updated shortly. Please log in again in a moment to access your new features."
      />
    </div>
  );
};

export default PricingPage;