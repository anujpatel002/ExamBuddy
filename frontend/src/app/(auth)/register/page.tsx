'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ThemeToggleButton from '@/components/ui/ThemeToggleButton';
import { useAuth } from '@/hooks/useAuth';
import { FiCheckCircle } from 'react-icons/fi';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

 const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // The register endpoint only returns a message, not user data
      await api.post('/auth/register', { name, email, password });
      setIsSuccess(true); // Show the "please verify email" message
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center">
                <FiCheckCircle className="mx-auto h-12 w-12 text-green-500" />
                <h2 className="text-2xl font-bold mt-4 mb-2">Registration Successful!</h2>
                <p className="text-gray-600 dark:text-gray-300">
                    A verification link has been sent to **{email}**. Please check your inbox to activate your account.
                </p>
                <Link href="/login" className="mt-6 inline-block">
                    <Button>Back to Login</Button>
                </Link>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggleButton />
      </div>
      <div className="max-w-md w-full bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">Create Your Account</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input type="text" placeholder="Your Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input type="password" placeholder="Create a Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type="submit" className="w-full" isLoading={isLoading}>Register</Button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}