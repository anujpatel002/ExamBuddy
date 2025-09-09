'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';

const VerifyEmailPage = () => {
  const { token } = useParams();
  const router = useRouter();
  const { login } = useAuth();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) return;

    const verifyToken = async () => {
      try {
        const { data } = await api.get(`/auth/verify-email/${token}`);
        setStatus('success');
        // Automatically log the user in with the data received from the verification endpoint
        await login(data);
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } catch (error: any) {
        setStatus('error');
        setErrorMessage(error.response?.data?.message || 'Verification failed.');
      }
    };
    
    verifyToken();
  }, [token, login, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center">
        {status === 'verifying' && (
          <>
            <Spinner />
            <h2 className="text-2xl font-bold mt-4">Verifying your email...</h2>
          </>
        )}
        {status === 'success' && (
          <>
            <FiCheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <h2 className="text-2xl font-bold mt-4">Verification Successful!</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-300">Redirecting you to the dashboard...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <FiXCircle className="mx-auto h-16 w-16 text-red-500" />
            <h2 className="text-2xl font-bold mt-4">Verification Failed</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-300">{errorMessage}</p>
            <Button onClick={() => router.push('/login')} className="mt-6">
              Back to Login
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;