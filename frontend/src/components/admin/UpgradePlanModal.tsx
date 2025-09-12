'use client';
import { useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface UpgradePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onSuccess: () => void;
}

const UpgradePlanModal = ({ isOpen, onClose, user, onSuccess }: UpgradePlanModalProps) => {
  const [selectedPlan, setSelectedPlan] = useState('');
  const [months, setMonths] = useState('1');
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlan) {
      toast.error('Please select a plan');
      return;
    }

    if (selectedPlan !== 'free' && (!months || parseInt(months) < 1)) {
      toast.error('Please enter valid number of months');
      return;
    }

    setLoading(true);
    try {
      await api.put(`/admin/users/${user._id}/upgrade-plan`, {
        plan: selectedPlan,
        months: selectedPlan === 'free' ? undefined : parseInt(months)
      });
      
      toast.success(`User plan upgraded to ${selectedPlan} ${selectedPlan !== 'free' ? `for ${months} months` : ''}`);
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upgrade plan');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Upgrade User Plan</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          User: {user?.name} ({user?.email})
        </p>
        
        <form onSubmit={handleUpgrade} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Plan</label>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              required
            >
              <option value="">Choose a plan</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="premium">Premium</option>
              <option value="ultra">Ultra</option>
            </select>
          </div>

          {selectedPlan && selectedPlan !== 'free' && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Duration (Months) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={months}
                onChange={(e) => setMonths(e.target.value)}
                min="1"
                max="120"
                placeholder="Enter number of months"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter 1-120 months (1-10 years)
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={loading}
              className="flex-1"
            >
              Upgrade Plan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpgradePlanModal;