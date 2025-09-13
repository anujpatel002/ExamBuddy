'use client';
import { createContext, useState, useEffect, ReactNode, useContext, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import api from '@/lib/api';
import { io } from 'socket.io-client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userInfo: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userInfoString = localStorage.getItem('userInfo');
    if (userInfoString) {
      setUser(JSON.parse(userInfoString));
    }
    setLoading(false);
    
    // Handle browser close/refresh
    const handleBeforeUnload = () => {
      localStorage.setItem('resetFlashcards', 'true');
      sessionStorage.removeItem('flashcardsReset');
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  useEffect(() => {
    if (!user?.token) return;
    
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001', {
      auth: { token: user.token }
    });
    
    // Register user with socket for real-time updates
    socket.emit('registerUser', user._id);
    
    socket.on('plan-updated', async (data) => {
      console.log('Received plan-updated event:', data);
      
      // Force complete refresh from server with cache busting
      try {
        const { data: profile } = await api.get(`/auth/profile?t=${Date.now()}`);
        const freshUser = { ...profile, token: user.token };
        localStorage.setItem('userInfo', JSON.stringify(freshUser));
        setUser(freshUser);
        console.log('User data refreshed from server:', freshUser.subscription);
        
        // Force page reload to ensure all components update
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } catch (error) {
        console.error('Failed to refresh user data:', error);
      }
    });
    
    return () => socket.disconnect();
  }, [user?.token, user?._id]);

  const login = useCallback((userInfo: User) => {
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    setUser(userInfo);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('userInfo');
    localStorage.setItem('resetFlashcards', 'true');
    sessionStorage.removeItem('flashcardsReset');
    setUser(null);
    router.push('/');
  }, [router]);

  const refreshUser = useCallback(async () => {
    const userInfoString = localStorage.getItem('userInfo');
    if (userInfoString) {
      const { token } = JSON.parse(userInfoString);
      if (token) {
        const { data: profile } = await api.get('/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const updatedUserInfo = { ...profile, token };
        localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
        setUser(updatedUserInfo);
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};