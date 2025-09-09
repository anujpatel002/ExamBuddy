'use client';
import { useAuth } from '@/hooks/useAuth';

export default function TestAdmin() {
  const { user } = useAuth();
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Test Page</h1>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
        <p><strong>User Email:</strong> {user?.email}</p>
        <p><strong>User Role:</strong> {user?.role}</p>
        <p><strong>Is Admin:</strong> {user?.role === 'admin' ? 'YES' : 'NO'}</p>
      </div>
    </div>
  );
}