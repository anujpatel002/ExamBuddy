'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface GamificationStats {
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  weeklyPoints: number;
}

export default function StreakWidget() {
  const [stats, setStats] = useState<GamificationStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/gamification/stats');
        setStats(data);
      } catch (error) {
        // Silently handle error - component will not render if stats is null
        setStats(null);
      }
    };
    fetchStats();
  }, []);

  if (!stats) return null;

  return (
    <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white p-4 rounded-lg shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Study Streak 🔥</h3>
          <p className="text-2xl font-bold">{stats.currentStreak} days</p>
          <p className="text-sm opacity-90">Best: {stats.longestStreak} days</p>
        </div>
        <div className="text-right">
          <p className="text-sm opacity-90">This Week</p>
          <p className="text-xl font-bold">{stats.weeklyPoints} pts</p>
          <p className="text-xs opacity-75">Total: {stats.totalPoints}</p>
        </div>
      </div>
    </div>
  );
}