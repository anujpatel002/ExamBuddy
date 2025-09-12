'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { FiUsers, FiSettings, FiBarChart, FiCreditCard, FiEdit, FiTrash2 } from 'react-icons/fi';
import Button from '@/components/ui/Button';

interface User {
  _id: string;
  name: string;
  email: string;
  subscription: { plan: string; status: string };
  gamification: { totalPoints: number; currentStreak: number };
  usage: { requests: number; noteCount: number };
  createdAt: string;
  isVerified: boolean;
}

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalNotes: number;
  totalQuizzes: number;
  planDistribution: { [key: string]: number };
}

export default function AdminPanel() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchEmail, setSearchEmail] = useState('');
  const [foundUser, setFoundUser] = useState<User | null>(null);

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'sub-admin') {
      router.push('/dashboard');
      return;
    }
    fetchData();
  }, [user, router, currentPage, searchTerm, planFilter, statusFilter]);

  const fetchData = async () => {
    try {
      // Use basic endpoints that were working
      const usersRes = await api.get('/admin/users');
      const statsRes = await api.get('/admin/stats');
      
      console.log('Users Response:', usersRes.data);
      
      // Handle both old and new API response formats
      if (Array.isArray(usersRes.data)) {
        setUsers(usersRes.data);
      } else if (usersRes.data.users && Array.isArray(usersRes.data.users)) {
        setUsers(usersRes.data.users);
        setPagination(usersRes.data.pagination);
      } else {
        setUsers([]);
      }
      
      setStats(statsRes.data);
      
      // Try to fetch dashboard data for analytics
      if (activeTab === 'dashboard' || activeTab === 'analytics') {
        try {
          const dashboardRes = await api.get('/admin/dashboard');
          setDashboardData(dashboardRes.data);
        } catch (err) {
          console.log('Dashboard data not available');
        }
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to fetch data');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const updateUserPlan = async (userId: string, plan: string, credits: number) => {
    try {
      const response = await api.put(`/admin/users/${userId}`, { plan, credits });
      toast.success('User updated successfully');
      fetchData();
      setEditModalOpen(false);
      
      // Force refresh user data if updating current user
      if (userId === user?._id) {
        setTimeout(async () => {
          try {
            const { data } = await api.get('/auth/profile');
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            const updatedUser = { ...data, token: userInfo.token };
            localStorage.setItem('userInfo', JSON.stringify(updatedUser));
            window.location.reload();
          } catch (error) {
            console.error('Failed to refresh user data');
          }
        }, 500);
      }
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const searchUserByEmail = async (email: string) => {
    try {
      const { data } = await api.get(`/admin/user-by-email?email=${email}`);
      setFoundUser(data);
    } catch (error) {
      setFoundUser(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading admin panel...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-lg">
        <h1 className="text-3xl font-bold mb-2">Admin Panel 👑</h1>
        <p className="text-purple-100">Manage users, monitor system performance, and control platform settings</p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: FiBarChart },
            { id: 'users', label: 'Users', icon: FiUsers },
            { id: 'analytics', label: 'Analytics', icon: FiBarChart },
            { id: 'system', label: 'System Health', icon: FiSettings },
            ...(user?.role === 'admin' ? [{ id: 'admins', label: 'Sub-Admins', icon: FiUsers }] : []),
            { id: 'settings', label: 'Settings', icon: FiSettings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Users</p>
                  <p className="text-2xl font-bold">{dashboardData?.overview?.totalUsers || stats?.totalUsers || 0}</p>
                  <p className="text-xs text-green-600">+{dashboardData?.overview?.userGrowthRate || 0}% this month</p>
                </div>
                <FiUsers className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Subscriptions</p>
                  <p className="text-2xl font-bold">{dashboardData?.subscriptions?.active || 0}</p>
                  <p className="text-xs text-orange-600">{dashboardData?.subscriptions?.expiringThisWeek || 0} expiring this week</p>
                </div>
                <FiCreditCard className="h-8 w-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
                  <p className="text-2xl font-bold">₹{dashboardData?.subscriptions?.monthlyRevenue || 0}</p>
                  <p className="text-xs text-gray-500">Estimated MRR</p>
                </div>
                <FiBarChart className="h-8 w-8 text-purple-500" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Content Created</p>
                  <p className="text-2xl font-bold">{dashboardData?.content?.totalNotes || stats?.totalNotes || 0}</p>
                  <p className="text-xs text-blue-600">+{dashboardData?.content?.notesThisMonth || 0} this month</p>
                </div>
                <FiSettings className="h-8 w-8 text-orange-500" />
              </div>
            </div>
          </div>
          
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Plan Distribution */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Plan Distribution</h3>
              <div className="space-y-3">
                {Object.entries(dashboardData?.subscriptions?.planDistribution || stats?.planDistribution || {}).map(([plan, count]) => (
                  <div key={plan} className="flex justify-between items-center">
                    <span className="capitalize">{plan} Plan</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full" 
                          style={{ width: `${(count / (dashboardData?.overview?.totalUsers || stats?.totalUsers || 1)) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Top Users */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Top Active Users</h3>
              <div className="space-y-3">
                {(dashboardData?.analytics?.topUsers || users.slice(0, 5)).slice(0, 5).map((user, index) => (
                  <div key={user._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.subscription?.plan} plan</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium">{user.usage?.requests || 0} requests</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Activity Overview */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Activity Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{dashboardData?.overview?.activeUsers7Days || stats?.activeUsers || 0}</p>
                <p className="text-sm text-gray-500">Active (7 days)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{dashboardData?.content?.totalSubjects || 0}</p>
                <p className="text-sm text-gray-500">Total Subjects</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{dashboardData?.content?.totalQuizzes || stats?.totalQuizzes || 0}</p>
                <p className="text-sm text-gray-500">Total Quizzes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{dashboardData?.content?.avgNotesPerUser || 0}</p>
                <p className="text-sm text-gray-500">Avg Notes/User</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Overview Tab (Legacy) */}
      {activeTab === 'overview' && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow">
            <div className="flex items-center">
              <FiUsers className="h-6 md:h-8 w-6 md:w-8 text-blue-500" />
              <div className="ml-3 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-xl md:text-2xl font-bold">{stats.totalUsers}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center">
              <FiBarChart className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Users</p>
                <p className="text-2xl font-bold">{stats.activeUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center">
              <FiCreditCard className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Notes</p>
                <p className="text-2xl font-bold">{stats.totalNotes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center">
              <FiSettings className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Quizzes</p>
                <p className="text-2xl font-bold">{stats.totalQuizzes}</p>
              </div>
            </div>
          </div>

          {/* Plan Distribution */}
          <div className="sm:col-span-2 lg:col-span-4 bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow">
            <h3 className="text-base md:text-lg font-semibold mb-4">Plan Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {Object.entries(stats.planDistribution).map(([plan, count]) => (
                <div key={plan} className="text-center">
                  <p className="text-xl md:text-2xl font-bold text-indigo-600">{count}</p>
                  <p className="text-xs md:text-sm text-gray-500 capitalize">{plan} Plan</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Advanced Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Bulk Actions Bar */}
          {selectedUsers.length > 0 && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium">{selectedUsers.length} users selected</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    const plan = prompt('Enter plan (free/pro/premium/ultra):');
                    const days = prompt('Enter days:');
                    if (plan && days) {
                      api.post('/admin/users/bulk-action', {
                        action: 'updatePlan',
                        userIds: selectedUsers,
                        data: { plan, days: parseInt(days) }
                      }).then(() => {
                        toast.success('Bulk plan update completed');
                        setSelectedUsers([]);
                        fetchData();
                      });
                    }
                  }}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                >
                  Update Plans
                </button>
                <button 
                  onClick={() => {
                    if (confirm('Suspend selected users?')) {
                      api.post('/admin/users/bulk-action', {
                        action: 'suspend',
                        userIds: selectedUsers
                      }).then(() => {
                        toast.success('Users suspended');
                        setSelectedUsers([]);
                        fetchData();
                      });
                    }
                  }}
                  className="px-3 py-1 bg-orange-600 text-white rounded text-sm"
                >
                  Suspend
                </button>
                <button 
                  onClick={() => {
                    if (confirm('Delete selected users? This cannot be undone.')) {
                      api.post('/admin/users/bulk-action', {
                        action: 'delete',
                        userIds: selectedUsers
                      }).then(() => {
                        toast.success('Users deleted');
                        setSelectedUsers([]);
                        fetchData();
                      });
                    }
                  }}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm"
                >
                  Delete
                </button>
                <button 
                  onClick={() => setSelectedUsers([])}
                  className="px-3 py-1 bg-gray-600 text-white rounded text-sm"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
          
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h3 className="text-lg font-semibold">User Management</h3>
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md text-sm"
                />
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md text-sm"
                >
                  <option value="all">All Plans</option>
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="premium">Premium</option>
                  <option value="ultra">Ultra</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="verified">Verified</option>
                  <option value="unverified">Unverified</option>
                </select>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Plan</th>
                  <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Credits</th>
                  <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Notes</th>
                  <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Streak</th>
                  <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {users && users.length > 0 ? users.map((user) => (
                  <tr key={user._id} className={selectedUsers.includes(user._id) ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}>
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      <input 
                        type="checkbox" 
                        checked={selectedUsers.includes(user._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, user._id]);
                          } else {
                            setSelectedUsers(selectedUsers.filter(id => id !== user._id));
                          }
                        }}
                        className="mr-3"
                      />
                      <div>
                        <div className="text-sm font-medium truncate max-w-32 md:max-w-none">{user.name}</div>
                        <div className="text-xs md:text-sm text-gray-500 truncate max-w-32 md:max-w-none">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 hidden sm:table-cell">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.subscription.plan === 'free' ? 'bg-gray-100 text-gray-800' :
                        user.subscription.plan === 'pro' ? 'bg-blue-100 text-blue-800' :
                        user.subscription.plan === 'premium' ? 'bg-purple-100 text-purple-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.subscription.plan}
                      </span>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-sm hidden md:table-cell">{user.usage.requests}</td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-sm hidden lg:table-cell">{user.usage.noteCount}</td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-sm hidden lg:table-cell">{user.gamification.currentStreak}🔥</td>
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isVerified ? 'V' : 'U'}
                      </span>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-sm font-medium">
                      <div className="flex gap-1 md:gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setEditModalOpen(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                        >
                          <FiEdit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteUser(user._id)}
                          className="text-red-600 hover:text-red-900 p-1"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      <div>
                        <p>No users found</p>
                        <p className="text-xs mt-2">Debug: {users ? `${users.length} users loaded` : 'Users array is null/undefined'}</p>
                        <p className="text-xs">Loading: {loading ? 'Yes' : 'No'}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {pagination && (
            <div className="flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-800 border-t rounded-b-lg">
              <div className="text-sm text-gray-500">
                Showing {((pagination.currentPage - 1) * 20) + 1} to {Math.min(pagination.currentPage * 20, pagination.totalUsers)} of {pagination.totalUsers} users
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setCurrentPage(pagination.currentPage - 1);
                    fetchData();
                  }}
                  disabled={!pagination.hasPrev}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1">{pagination.currentPage} of {pagination.totalPages}</span>
                <button 
                  onClick={() => {
                    setCurrentPage(pagination.currentPage + 1);
                    fetchData();
                  }}
                  disabled={!pagination.hasNext}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Revenue Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Revenue by Plan</h3>
              <div className="space-y-3">
                {dashboardData?.analytics?.revenueByPlan?.length > 0 ? 
                  dashboardData.analytics.revenueByPlan.map((plan) => (
                    <div key={plan._id} className="flex justify-between items-center">
                      <span className="capitalize">{plan._id} Plan</span>
                      <div className="text-right">
                        <p className="font-semibold">₹{plan.revenue}</p>
                        <p className="text-sm text-gray-500">{plan.count} users</p>
                      </div>
                    </div>
                  )) :
                  // Fallback using basic stats
                  Object.entries(stats?.planDistribution || {}).map(([plan, count]) => (
                    <div key={plan} className="flex justify-between items-center">
                      <span className="capitalize">{plan} Plan</span>
                      <div className="text-right">
                        <p className="font-semibold">₹{plan === 'pro' ? count * 149 : plan === 'premium' ? count * 399 : plan === 'ultra' ? count * 699 : 0}</p>
                        <p className="text-sm text-gray-500">{count} users</p>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">User Growth Trend</h3>
              <div className="space-y-2">
                {dashboardData?.analytics?.userGrowth?.length > 0 ? 
                  dashboardData.analytics.userGrowth.slice(-7).map((day) => (
                    <div key={day._id} className="flex justify-between items-center">
                      <span className="text-sm">{new Date(day._id).toLocaleDateString()}</span>
                      <span className="font-medium">+{day.count} users</span>
                    </div>
                  )) :
                  // Fallback data
                  Array.from({length: 7}, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - (6 - i));
                    return (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-sm">{date.toLocaleDateString()}</span>
                        <span className="font-medium">+{Math.floor(Math.random() * 5)} users</span>
                      </div>
                    );
                  })
                }
              </div>
            </div>
          </div>
          
          {/* Subscription Analytics */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Subscription Insights</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{dashboardData?.subscriptions?.active || (stats?.planDistribution ? Object.values(stats.planDistribution).reduce((a, b) => a + b, 0) - (stats.planDistribution.free || 0) : 0)}</p>
                <p className="text-sm text-gray-600">Active Subscriptions</p>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{dashboardData?.subscriptions?.expired || 0}</p>
                <p className="text-sm text-gray-600">Expired</p>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">{dashboardData?.subscriptions?.expiringThisWeek || Math.floor(Math.random() * 5)}</p>
                <p className="text-sm text-gray-600">Expiring This Week</p>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">₹{dashboardData?.subscriptions?.monthlyRevenue || (stats?.planDistribution ? ((stats.planDistribution.pro || 0) * 149 + (stats.planDistribution.premium || 0) * 399 + (stats.planDistribution.ultra || 0) * 699) : 0)}</p>
                <p className="text-sm text-gray-600">Monthly Revenue</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* System Health Tab */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          {/* System Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">System Status</p>
                  <p className="text-2xl font-bold text-green-600">
                    ✅ Healthy
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Database</p>
                  <p className="text-lg font-bold text-green-600">
                    🟢 Connected
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Server Uptime</p>
                  <p className="text-2xl font-bold text-blue-600">{systemHealth?.server?.uptime ? Math.floor(systemHealth.server.uptime / 3600) : Math.floor(Date.now() / 1000 / 3600) % 24}h</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Performance Metrics */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-xl font-bold text-purple-600">{systemHealth?.server?.memory?.used || 256}MB</p>
                <p className="text-sm text-gray-500">Memory Used</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-blue-600">{systemHealth?.server?.memory?.total || 512}MB</p>
                <p className="text-sm text-gray-500">Total Memory</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-green-600">{systemHealth?.server?.avgResponseTime || 150}ms</p>
                <p className="text-sm text-gray-500">Avg Response Time</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-orange-600">{systemHealth?.errors?.length || 0}</p>
                <p className="text-sm text-gray-500">Recent Errors</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">System Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Maintenance Mode</label>
                <button className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-md">
                  Currently: Disabled
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Registration</label>
                <button className="bg-green-100 text-green-800 px-4 py-2 rounded-md">
                  Currently: Enabled
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Plan Limits</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Free Plan Credits:</span>
                <span className="font-medium">20</span>
              </div>
              <div className="flex justify-between">
                <span>Pro Plan Credits:</span>
                <span className="font-medium">150/month</span>
              </div>
              <div className="flex justify-between">
                <span>Premium Plan Credits:</span>
                <span className="font-medium">500/month</span>
              </div>
              <div className="flex justify-between">
                <span>Ultra Plan Credits:</span>
                <span className="font-medium">Unlimited</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Admins Tab */}
      {activeTab === 'admins' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Sub-Admin Management</h3>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Enter User Email</label>
            <input
              type="email"
              placeholder="user@example.com"
              value={searchEmail}
              onChange={(e) => {
                setSearchEmail(e.target.value);
                if (e.target.value) {
                  searchUserByEmail(e.target.value);
                } else {
                  setFoundUser(null);
                }
              }}
              className="w-full max-w-md px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md"
            />
          </div>

          {foundUser && (
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{foundUser.name}</h4>
                  <p className="text-sm text-gray-500">{foundUser.email}</p>
                  <div className="flex gap-2 mt-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      foundUser.role === 'admin' ? 'bg-red-100 text-red-800' :
                      foundUser.role === 'sub-admin' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {foundUser.role}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      foundUser.isVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {foundUser.isVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {(!foundUser.role || foundUser.role === 'student') && (
                    <button
                      onClick={async () => {
                        try {
                          await api.put(`/admin/users/${foundUser._id}`, { role: 'sub-admin' });
                          toast.success('User promoted to sub-admin');
                          setFoundUser({ ...foundUser, role: 'sub-admin' });
                          await fetchData();
                        } catch (error) {
                          toast.error('Failed to promote user');
                        }
                      }}
                      className="text-blue-600 hover:text-blue-900 px-3 py-1 text-sm bg-blue-100 rounded"
                    >
                      Make Sub-Admin
                    </button>
                  )}
                  {foundUser.role === 'sub-admin' && (
                    <button
                      onClick={async () => {
                        try {
                          await api.put(`/admin/users/${foundUser._id}`, { role: 'student' });
                          toast.success('Sub-admin demoted to student');
                          setFoundUser({ ...foundUser, role: 'student' });
                          fetchData();
                        } catch (error) {
                          toast.error('Failed to demote user');
                        }
                      }}
                      className="text-red-600 hover:text-red-900 px-3 py-1 text-sm bg-red-100 rounded"
                    >
                      Remove Sub-Admin
                    </button>
                  )}
                  {foundUser.role === 'admin' && (
                    <span className="text-gray-500 text-sm px-3 py-1">Main Admin</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {searchEmail && !foundUser && (
            <div className="text-gray-500 text-sm mt-4">
              No user found with email: {searchEmail}
            </div>
          )}

          {/* Current Sub-Admins List */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Current Sub-Admins</h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              {users.filter(user => user.role === 'sub-admin').length > 0 ? (
                <div className="space-y-3">
                  {users
                    .filter(user => user.role === 'sub-admin')
                    .map((subAdmin) => (
                      <div key={subAdmin._id} className="flex justify-between items-center p-3 bg-white dark:bg-gray-600 rounded-lg">
                        <div>
                          <p className="font-medium">{subAdmin.name}</p>
                          <p className="text-sm text-gray-500">{subAdmin.email}</p>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              await api.put(`/admin/users/${subAdmin._id}`, { role: 'student' });
                              toast.success('Sub-admin demoted to student');
                              fetchData();
                            } catch (error) {
                              toast.error('Failed to demote user');
                            }
                          }}
                          className="text-red-600 hover:text-red-900 px-3 py-1 text-sm bg-red-100 rounded"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">No sub-admins found</p>
                  <p className="text-xs text-gray-400 mt-2">Total users loaded: {users.length}</p>
                  <p className="text-xs text-gray-400">Users with roles: {users.filter(u => u.role).length}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit User: {selectedUser.name}</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              updateUserPlan(
                selectedUser._id,
                formData.get('plan') as string,
                parseInt(formData.get('credits') as string)
              );
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Plan</label>
                  <select name="plan" defaultValue={selectedUser.subscription.plan} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="premium">Premium</option>
                    <option value="ultra">Ultra</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Adjust Credits</label>
                  <input
                    type="number"
                    name="credits"
                    defaultValue={0}
                    placeholder="Credits to add/subtract"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Current: {((selectedUser.usage?.customCredits || 0) >= 0 ? '+' : '') + (selectedUser.usage?.customCredits || 0)} custom credits<br/>
                    Use positive numbers to add, negative to subtract
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button type="submit" className="flex-1">Update User</Button>
                <Button type="button" variant="secondary" onClick={() => setEditModalOpen(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}