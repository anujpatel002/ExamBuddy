'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface LeaderboardEntry {
  rank: number;
  name: string;
  points: number;
}

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data } = await api.get('/gamification/leaderboard');
        setLeaderboard(data);
      } catch (error) {
        // Silently handle error - show empty leaderboard
        setLeaderboard([]);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <div className="glass-card p-6 rounded-2xl">
      <h2 className="text-xl font-semibold mb-4 flex items-center theme-text-primary">
        🏆 Weekly Leaderboard
      </h2>
      <div className="space-y-3">
        {leaderboard.map((entry) => (
          <div key={entry.rank} className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 hover:scale-105 ${
            entry.rank === 1 ? 'bg-yellow-100/80 dark:bg-yellow-900/20 border border-yellow-200/50 dark:border-yellow-700/30' :
            entry.rank === 2 ? 'bg-gray-100/80 dark:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/30' :
            entry.rank === 3 ? 'bg-orange-100/80 dark:bg-orange-900/20 border border-orange-200/50 dark:border-orange-700/30' :
            'bg-white/50 dark:bg-gray-700/30 border border-gray-200/30 dark:border-gray-600/20'
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold">
                {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
              </span>
              <span className="font-medium theme-text-primary">{entry.name}</span>
            </div>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              {entry.points} pts
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}