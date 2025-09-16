import React from 'react';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ 
  password, 
  className = '' 
}) => {
  const getPasswordStrength = (password: string) => {
    let score = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    Object.values(checks).forEach(check => {
      if (check) score++;
    });

    return { score, checks };
  };

  const { score, checks } = getPasswordStrength(password);
  
  const getStrengthText = () => {
    if (score === 0) return '';
    if (score <= 2) return 'Weak';
    if (score <= 3) return 'Fair';
    if (score <= 4) return 'Good';
    return 'Strong';
  };

  const getStrengthColor = () => {
    if (score <= 2) return 'text-red-500';
    if (score <= 3) return 'text-yellow-500';
    if (score <= 4) return 'text-blue-500';
    return 'text-green-500';
  };

  const getBarColor = () => {
    if (score <= 2) return 'bg-red-500';
    if (score <= 3) return 'bg-yellow-500';
    if (score <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  if (!password) return null;

  return (
    <div className={`mt-2 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Password Strength
        </span>
        <span className={`text-sm font-medium ${getStrengthColor()}`}>
          {getStrengthText()}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${getBarColor()}`}
          style={{ width: `${(score / 5) * 100}%` }}
        />
      </div>
      
      <div className="space-y-1">
        <div className={`flex items-center text-xs ${checks.length ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
          <span className="mr-2">{checks.length ? '✓' : '○'}</span>
          At least 8 characters
        </div>
        <div className={`flex items-center text-xs ${checks.uppercase ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
          <span className="mr-2">{checks.uppercase ? '✓' : '○'}</span>
          One uppercase letter
        </div>
        <div className={`flex items-center text-xs ${checks.lowercase ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
          <span className="mr-2">{checks.lowercase ? '✓' : '○'}</span>
          One lowercase letter
        </div>
        <div className={`flex items-center text-xs ${checks.numbers ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
          <span className="mr-2">{checks.numbers ? '✓' : '○'}</span>
          One number
        </div>
        <div className={`flex items-center text-xs ${checks.special ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
          <span className="mr-2">{checks.special ? '✓' : '○'}</span>
          One special character
        </div>
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;