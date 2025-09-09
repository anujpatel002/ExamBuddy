'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { FiBook, FiPlusCircle, FiUsers, FiStar } from 'react-icons/fi';
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
        <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-lg">
        <h1 className="text-xl font-bold mb-1">Dashboard 📚</h1>
        <p className="text-indigo-100 text-sm">Your learning overview and quick actions</p>
      </div>

      {/* Stats & Gamification Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <StreakWidget />
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Quick Stats</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total Subjects:</span>
              <span className="font-medium">{subjects.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Plan:</span>
              <span className="font-medium capitalize">{user?.subscription?.plan || 'Free'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          onClick={() => router.push('/subjects')}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-blue-500"
        >
          <div className="flex items-center gap-4">
            <FiBook className="text-3xl text-blue-500" />
            <div>
              <h3 className="text-lg font-semibold">My Subjects</h3>
              <p className="text-gray-600 dark:text-gray-400">Manage your subjects</p>
              <p className="text-sm text-blue-600 font-medium">{subjects.length} subjects</p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => router.push('/study-room')}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-green-500"
        >
          <div className="flex items-center gap-4">
            <FiUsers className="text-3xl text-green-500" />
            <div>
              <h3 className="text-lg font-semibold">Study Rooms</h3>
              <p className="text-gray-600 dark:text-gray-400">Join or create rooms</p>
              <p className="text-sm text-green-600 font-medium">Collaborate & learn</p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => router.push('/pricing')}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-purple-500"
        >
          <div className="flex items-center gap-4">
            <FiStar className="text-3xl text-purple-500" />
            <div>
              <h3 className="text-lg font-semibold">Upgrade Plan</h3>
              <p className="text-gray-600 dark:text-gray-400">Get more features</p>
              <p className="text-sm text-purple-600 font-medium capitalize">{user?.subscription?.plan || 'Free'} Plan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity & Progress */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Progress */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Today's Progress</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">0</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Notes Created</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600">0</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Quizzes Taken</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{subjects.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Subjects</div>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">0</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Study Sessions</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => router.push('/subjects')}
                className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <FiBook className="text-blue-500 text-xl" />
                <div className="text-left">
                  <div className="font-medium">Browse Subjects</div>
                  <div className="text-sm text-gray-500">View and manage your subjects</div>
                </div>
              </button>
              <button
                onClick={() => router.push('/study-room')}
                className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <FiUsers className="text-green-500 text-xl" />
                <div className="text-left">
                  <div className="font-medium">Join Study Room</div>
                  <div className="text-sm text-gray-500">Collaborate with others</div>
                </div>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          {subjects.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Your Subjects</h3>
                <button
                  onClick={() => router.push('/subjects')}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  Manage All →
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {subjects.slice(0, 4).map((subject) => (
                  <div
                    key={subject._id}
                    onClick={() => router.push(`/subjects/${subject._id}`)}
                    className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    <FiBook className="text-indigo-500" />
                    <span className="font-medium">{subject.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow text-center">
              <FiBook className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No subjects yet</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first subject</p>
              <Button onClick={() => router.push('/subjects')}>
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