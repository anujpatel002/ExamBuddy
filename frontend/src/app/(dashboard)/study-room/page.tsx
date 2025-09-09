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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 md:space-y-8">
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Study Rooms</h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Create or join collaborative study sessions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Create Room */}
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <FiPlus className="text-xl md:text-2xl text-green-500" />
            <h2 className="text-lg md:text-xl font-semibold">Create New Room</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md"
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
                <label className="block text-sm font-medium mb-2">Select Quiz</label>
                {quizzes.length > 0 ? (
                  <select
                    value={selectedQuiz}
                    onChange={(e) => setSelectedQuiz(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md"
                  >
                    {quizzes.map((quiz) => (
                      <option key={quiz._id} value={quiz._id}>
                        {quiz.title} ({quiz.questions?.length || 0} questions)
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-500 text-sm p-2 bg-gray-100 dark:bg-gray-700 rounded">No quizzes found for this subject</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Custom Room Code (Optional)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter custom code"
                  value={customRoomCode}
                  onChange={(e) => setCustomRoomCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md"
                />
                <Button onClick={generateRoomCode} variant="secondary" size="sm">
                  <FiRefreshCw />
                </Button>
              </div>
            </div>
            
            <Button 
              onClick={handleCreateRoom} 
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={!selectedQuiz || !checkFeatureAccess('createStudyRoom')}
            >
              <FiPlus className="mr-2" />
              Create Room
            </Button>
            {!checkFeatureAccess('createStudyRoom') && (
              <p className="text-sm text-yellow-600 dark:text-yellow-400 text-center">
                {getUpgradeMessage('createStudyRoom')}
              </p>
            )}
          </div>
        </div>

        {/* Join Room */}
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <FiUsers className="text-xl md:text-2xl text-blue-500" />
            <h2 className="text-lg md:text-xl font-semibold">Join Existing Room</h2>
          </div>
          
          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Room Code</label>
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md text-center text-lg font-mono"
              />
            </div>
            
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
              <FiArrowRight className="mr-2" />
              Join Room
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}