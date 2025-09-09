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
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        🏆 Weekly Leaderboard
      </h2>
      <div className="space-y-3">
        {leaderboard.map((entry) => (
          <div key={entry.rank} className={`flex items-center justify-between p-3 rounded-lg ${
            entry.rank === 1 ? 'bg-yellow-100 dark:bg-yellow-900/20' :
            entry.rank === 2 ? 'bg-gray-100 dark:bg-gray-700' :
            entry.rank === 3 ? 'bg-orange-100 dark:bg-orange-900/20' :
            'bg-gray-50 dark:bg-gray-700/50'
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold">
                {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
              </span>
              <span className="font-medium">{entry.name}</span>
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