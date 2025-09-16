'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import { FiUsers, FiPlus, FiArrowRight, FiRefreshCw } from 'react-icons/fi';

interface Quiz {
  _id: string;
  title: string;
  questions: any[];
  note: {
    subject: {
      _id: string;
      name: string;
    };
  };
}

interface Subject {
  _id: string;
  name: string;
}

export default function StudyRoomHub() {
  const [joinCode, setJoinCode] = useState('');
  const [customRoomCode, setCustomRoomCode] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();
  const { checkFeatureAccess, getUpgradeMessage } = usePlanLimits();

  useEffect(() => {
    fetchSubjects();
    // Check for URL parameters to auto-fill quiz details
    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('quizId');
    if (quizId) {
      autoFillQuizDetails(quizId);
    }
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetchQuizzes(selectedSubject);
    } else {
      setQuizzes([]);
      setSelectedQuiz('');
    }
  }, [selectedSubject]);

  const fetchSubjects = async () => {
    try {
      const { data } = await api.get('/subjects');
      setSubjects(data);
    } catch (error) {
      toast.error('Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizzes = async (subjectId: string) => {
    try {
      const { data } = await api.get(`/quizzes/my?subject=${subjectId}`);
      setQuizzes(data);
      if (data.length > 0) {
        setSelectedQuiz(data[0]._id);
      } else {
        setSelectedQuiz('');
      }
    } catch (error) {
      toast.error('Failed to fetch quizzes');
      setQuizzes([]);
    }
  };

  const autoFillQuizDetails = async (quizId: string) => {
    try {
      const { data: quiz } = await api.get(`/quizzes/${quizId}`);
      const subjectId = quiz.note?.subject?._id;
      if (subjectId) {
        setSelectedSubject(subjectId);
        // Fetch quizzes for this subject and then select the quiz
        const { data: subjectQuizzes } = await api.get(`/quizzes/my?subject=${subjectId}`);
        setQuizzes(subjectQuizzes);
        setSelectedQuiz(quizId);
      }
    } catch (error) {
      console.error('Failed to auto-fill quiz details:', error);
    }
  };

  const generateRoomCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setCustomRoomCode(code);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      toast.error('Please enter a room code');
      return;
    }
    router.push(`/study-room/${joinCode.trim().toUpperCase()}`);
  };

  const handleCreateRoom = () => {
    if (!checkFeatureAccess('createStudyRoom')) {
      toast.error(getUpgradeMessage('createStudyRoom'));
      return;
    }
    if (!selectedQuiz) {
      toast.error('Please select a quiz first');
      return;
    }
    const roomCode = customRoomCode || Math.random().toString(36).substring(2, 8).toUpperCase();
    router.push(`/study-room/${roomCode}?quizId=${selectedQuiz}&host=true`);
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 page-transition">
      <div className="glass-card p-8 rounded-3xl text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-xl float"></div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">Study Rooms</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">Create or join collaborative AI-powered study sessions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create Room */}
        <div className="stagger-item glass-card p-8 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full blur-lg"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                <FiPlus className="text-2xl text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Create New Room</h2>
            </div>
          
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Select Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200/50 dark:border-gray-600/50 bg-white/60 dark:bg-gray-800/60 rounded-xl backdrop-blur-sm focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300"
                >
                  <option value="">Choose a subject...</option>
                  {subjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
            
              {selectedSubject && (
                <div>
                  <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Select Quiz</label>
                  {quizzes.length > 0 ? (
                    <select
                      value={selectedQuiz}
                      onChange={(e) => setSelectedQuiz(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200/50 dark:border-gray-600/50 bg-white/60 dark:bg-gray-800/60 rounded-xl backdrop-blur-sm focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300"
                    >
                      {quizzes.map((quiz) => (
                        <option key={quiz._id} value={quiz._id}>
                          {quiz.title} ({quiz.questions?.length || 0} questions)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-4 bg-gradient-to-r from-yellow-50/80 to-orange-50/80 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200/50 dark:border-yellow-700/50 rounded-xl">
                      <p className="text-yellow-700 dark:text-yellow-300 text-sm font-medium">No quizzes found for this subject</p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Custom Room Code (Optional)</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter custom code"
                    value={customRoomCode}
                    onChange={(e) => setCustomRoomCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="w-full px-4 py-3 pr-12 border border-gray-200/50 dark:border-gray-600/50 bg-white/60 dark:bg-gray-800/60 rounded-xl backdrop-blur-sm focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300 font-mono text-center"
                  />
                  <button 
                    onClick={generateRoomCode} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white/80 dark:hover:bg-gray-700/80 rounded-lg transition-all duration-300"
                  >
                    <FiRefreshCw className="h-4 w-4 text-green-600" />
                  </button>
                </div>
              </div>
            
              <button 
                onClick={handleCreateRoom} 
                disabled={!selectedQuiz || !checkFeatureAccess('createStudyRoom')}
                className="w-full py-4 px-6 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                <FiPlus className="text-xl" />
                Create Room
              </button>
              {!checkFeatureAccess('createStudyRoom') && (
                <div className="p-4 bg-gradient-to-r from-yellow-50/80 to-orange-50/80 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200/50 dark:border-yellow-700/50 rounded-xl">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 text-center font-medium">
                    {getUpgradeMessage('createStudyRoom')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Join Room */}
        <div className="stagger-item glass-card p-8 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full blur-lg"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                <FiUsers className="text-2xl text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Join Existing Room</h2>
            </div>
            
            <form onSubmit={handleJoinRoom} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Room Code</label>
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-200/50 dark:border-gray-600/50 bg-white/60 dark:bg-gray-800/60 rounded-xl backdrop-blur-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 text-center text-lg font-mono tracking-wider"
                />
              </div>
              
              <button type="submit" className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3">
                <FiArrowRight className="text-xl" />
                Join Room
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}