'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ThemeToggleButton from '@/components/ui/ThemeToggleButton';
import { FiMail, FiLock, FiStar } from 'react-icons/fi';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If the user object exists, it means they are already logged in.
    // Redirect them to the dashboard immediately.
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      await login(data); // Pass the full user object
      router.push('/dashboard');
      toast.success('Logged in successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container min-h-screen flex flex-col items-center justify-center theme-bg-primary px-4 transition-all duration-500 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/10 animate-pulse"></div>
      <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-xl animate-float"></div>
      <div className="absolute bottom-10 right-10 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-float-delayed"></div>
      

      
      <div className="auth-card max-w-md w-full glass-card p-8 rounded-3xl shadow-2xl relative z-10">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-t-3xl"></div>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg hover:scale-110 transition-transform duration-300">
            <span className="text-2xl font-bold text-white">EB</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm border border-blue-200/20 dark:border-blue-700/30 rounded-full text-xs font-medium text-blue-700 dark:text-blue-300 mb-4">
            <FiStar className="w-3 h-3" />
            <span>Trusted by 50K+ Students</span>
          </div>
          <h2 className="text-3xl font-bold theme-text-primary mb-2">Welcome Back</h2>
          <p className="theme-text-secondary">Sign in to your ExamBuddy account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative group">
              <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 theme-text-muted group-focus-within:text-blue-500 transition-colors duration-300" />
              <Input 
                type="email" 
                placeholder="Your Email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="pl-10 glass-input hover:border-blue-300 dark:hover:border-blue-600 focus:border-blue-500 dark:focus:border-blue-400"
              />
            </div>
            <div className="relative group">
              <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 theme-text-muted group-focus-within:text-blue-500 transition-colors duration-300" />
              <Input 
                type="password" 
                placeholder="Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="pl-10 glass-input hover:border-blue-300 dark:hover:border-blue-600 focus:border-blue-500 dark:focus:border-blue-400"
              />
            </div>
          </div>
          <Button type="submit" className="w-full modern-button bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" isLoading={isLoading}>
            Sign In
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <Link href="/forgot-password" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all duration-300">
            Forgot your password?
          </Link>
        </div>
        
        <div className="mt-8 pt-6 border-t theme-border text-center">
          <p className="text-sm theme-text-secondary">
            Don't have an account?{' '}
            <Link href="/register" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-300">
              Create Account
            </Link>
          </p>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}