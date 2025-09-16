'use client';
import { ReactNode, useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';
import Spinner from '@/components/ui/Spinner';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import NoteProcessingToast from '@/components/ui/NoteProcessingToast';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { FiMail } from 'react-icons/fi';

function DashboardContent({ children }: { children: ReactNode }) {
  const { user, loading, login, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
    }
  }, [user, loading]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <Spinner />
      </div>
    );
  }

  if (!user.isVerified) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center">
                <FiMail className="mx-auto h-12 w-12 text-indigo-500" />
                <h2 className="text-2xl font-bold mt-4 mb-2">Please Verify Your Email</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    A verification link was sent to your email address. Please click the link to activate your account.
                </p>
                <Button onClick={logout}>Logout</Button>
            </div>
        </div>
    );
  }

  return (
    <div className={`dashboard-container min-h-screen transition-all duration-500 ${sidebarOpen ? 'sidebar-open' : ''}`} style={{background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'}}>
      <Sidebar isOpen={sidebarOpen} />
      <div className="main-content">
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="content-wrapper pt-6">
          {children}
        </main>
      </div>
      
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-10 md:hidden"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900"><Spinner /></div>}>
      <DashboardContent>{children}</DashboardContent>
    </Suspense>
  );
}