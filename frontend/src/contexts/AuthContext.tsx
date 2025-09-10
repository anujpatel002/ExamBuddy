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
  }, []);

  useEffect(() => {
    if (!user?.token) return;
    
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001', {
      auth: { token: user.token }
    });
    
    socket.on('plan-updated', (data) => {
      const updatedUser = { ...data.user, token: user.token };
      localStorage.setItem('userInfo', JSON.stringify(updatedUser));
      setUser(updatedUser);
    });
    
    return () => socket.disconnect();
  }, [user?.token]);

  const login = useCallback((userInfo: User) => {
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    setUser(userInfo);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('userInfo');
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