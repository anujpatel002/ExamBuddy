'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { FiBook, FiPlusCircle, FiUsers, FiStar, FiFileText } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import SkeletonCard from '@/components/ui/SkeletonCard';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';
import EditModal from '@/components/ui/EditModal';
import StreakWidget from '@/components/gamification/StreakWidget';
import Leaderboard from '@/components/gamification/Leaderboard';

interface Subject {
  _id: string;
  name: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/subjects');
      setSubjects(data);
    } catch (error) {
      toast.error('Failed to load subjects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);



  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 theme-bg-secondary rounded-lg animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="h-64 theme-bg-secondary rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 rounded-3xl shadow-lg">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl float"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-lg float-delayed"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2 text-white drop-shadow-lg">Welcome back! 🚀</h1>
          <p className="text-white text-lg drop-shadow-md">Your AI-powered learning dashboard</p>
        </div>
      </div>

      {/* Stats & Gamification Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <StreakWidget />
        </div>
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="font-semibold mb-4 theme-text-primary">Quick Stats</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="theme-text-secondary">Total Subjects:</span>
              <span className="font-medium theme-text-primary">{subjects.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="theme-text-secondary">Plan:</span>
              <span className="font-medium capitalize theme-text-primary">{user?.subscription?.plan || 'Free'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card-grid">
        <div 
          onClick={() => router.push('/subjects')}
          className="stagger-item glass-card p-8 rounded-2xl cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10 flex items-center gap-6">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl text-white shadow-lg">
              <FiBook className="text-2xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1 theme-text-primary">My Subjects</h3>
              <p className="theme-text-secondary mb-2">Manage your subjects</p>
              <div className="inline-flex items-center px-3 py-1 bg-blue-100/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium backdrop-blur-sm">
                {subjects.length} subjects
              </div>
            </div>
          </div>
        </div>

        <div 
          onClick={() => router.push('/study-room')}
          className="stagger-item glass-card p-8 rounded-2xl cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10 flex items-center gap-6">
            <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl text-white shadow-lg">
              <FiUsers className="text-2xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1 theme-text-primary">Study Rooms</h3>
              <p className="theme-text-secondary mb-2">Join or create rooms</p>
              <div className="inline-flex items-center px-3 py-1 bg-green-100/80 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium backdrop-blur-sm">
                Collaborate & learn
              </div>
            </div>
          </div>
        </div>

        <div 
          onClick={() => toast('🚀 Feature coming soon!')}
          className="stagger-item glass-card p-8 rounded-2xl cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10 flex items-center gap-6">
            <div className="p-4 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl text-white shadow-lg">
              <FiFileText className="text-2xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1 theme-text-primary">NotebookLM</h3>
              <p className="theme-text-secondary mb-2">AI document analysis</p>
              <div className="inline-flex items-center px-3 py-1 bg-orange-100/80 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium backdrop-blur-sm">
                Multi-doc chat
              </div>
            </div>
          </div>
        </div>

        <div 
          onClick={() => router.push('/pricing')}
          className="stagger-item glass-card p-8 rounded-2xl cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10 flex items-center gap-6">
            <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl text-white shadow-lg">
              <FiStar className="text-2xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1 theme-text-primary">Upgrade Plan</h3>
              <p className="theme-text-secondary mb-2">Get more features</p>
              <div className="inline-flex items-center px-3 py-1 bg-purple-100/80 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium capitalize backdrop-blur-sm">
                {user?.subscription?.plan || 'Free'} Plan
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity & Progress */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Progress */}
          <div className="glass-card p-8 rounded-3xl">
            <h2 className="text-2xl font-bold mb-6 theme-text-primary">Today's Progress</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-300">
                <div className="text-3xl font-bold mb-2">0</div>
                <div className="text-blue-100 text-sm font-medium">Notes Created</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-300">
                <div className="text-3xl font-bold mb-2">0</div>
                <div className="text-green-100 text-sm font-medium">Quizzes Taken</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-300">
                <div className="text-3xl font-bold mb-2">{subjects.length}</div>
                <div className="text-purple-100 text-sm font-medium">Total Subjects</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-300">
                <div className="text-3xl font-bold mb-2">0</div>
                <div className="text-orange-100 text-sm font-medium">Study Sessions</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-lg font-semibold mb-4 theme-text-primary">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => router.push('/subjects')}
                className="flex items-center gap-3 p-4 bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 rounded-xl hover:bg-white/70 dark:hover:bg-gray-700/70 hover:scale-105 transition-all duration-300 backdrop-blur-sm"
              >
                <FiBook className="text-blue-500 text-xl" />
                <div className="text-left">
                  <div className="font-medium theme-text-primary">Browse Subjects</div>
                  <div className="text-sm theme-text-secondary">View and manage your subjects</div>
                </div>
              </button>
              <button
                onClick={() => router.push('/study-room')}
                className="flex items-center gap-3 p-4 bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 rounded-xl hover:bg-white/70 dark:hover:bg-gray-700/70 hover:scale-105 transition-all duration-300 backdrop-blur-sm"
              >
                <FiUsers className="text-green-500 text-xl" />
                <div className="text-left">
                  <div className="font-medium theme-text-primary">Join Study Room</div>
                  <div className="text-sm theme-text-secondary">Collaborate with others</div>
                </div>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          {subjects.length > 0 ? (
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold theme-text-primary">Your Subjects</h3>
                <button
                  onClick={() => router.push('/subjects')}
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium transition-colors duration-300"
                >
                  Manage All →
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {subjects.slice(0, 4).map((subject) => (
                  <div
                    key={subject._id}
                    onClick={() => router.push(`/subjects/${subject._id}`)}
                    className="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 rounded-xl hover:bg-white/70 dark:hover:bg-gray-700/70 cursor-pointer hover:scale-105 transition-all duration-300 backdrop-blur-sm"
                  >
                    <FiBook className="text-indigo-500" />
                    <span className="font-medium theme-text-primary">{subject.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glass-card p-8 rounded-2xl text-center">
              <FiBook className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2 theme-text-primary">No subjects yet</h3>
              <p className="theme-text-secondary mb-4">Get started by creating your first subject</p>
              <Button onClick={() => router.push('/subjects')} className="modern-button bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <FiPlusCircle className="mr-2" />
                Create Subject
              </Button>
            </div>
          )}
        </div>

        {/* Sidebar Section */}
        <div className="space-y-6">
          <Leaderboard />
        </div>
      </div>


    </div>
  );
}