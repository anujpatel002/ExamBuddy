'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface Quiz {
  _id: string;
  title: string;
}

export default function StudyRoomHub() {
  const [joinCode, setJoinCode] = useState('');
  const [myQuizzes, setMyQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  useEffect(() => {
    const preselectedQuizId = searchParams.get('quizId');

    const fetchQuizzes = async () => {
      try {
        const { data } = await api.get('/quizzes/my');
        setMyQuizzes(data);
        if (preselectedQuizId && data.some((q: Quiz) => q._id === preselectedQuizId)) {
          setSelectedQuiz(preselectedQuizId);
        } else if (data.length > 0) {
          setSelectedQuiz(data[0]._id);
        }
      } catch (error) {
        toast.error('Could not fetch your quizzes.');
      }
    };
    if (user) {
        fetchQuizzes();
    }
  }, [user, searchParams]);
  
  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) {
      router.push(`/study-room/${joinCode.trim()}`);
    } else {
      toast.error('Please enter a room code.');
    }
  };

  const handleCreateRoom = () => {
    if (!selectedQuiz) {
        toast.error('Please select a quiz to start a study room.');
        return;
    }
    const newRoomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    router.push(`/study-room/${newRoomCode}?quizId=${selectedQuiz}&host=true`);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Study Rooms</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Create a New Room</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="quiz-select" className="block text-sm font-medium text-gray-700 mb-1">
                Choose a quiz for the session:
              </label>
              {myQuizzes.length > 0 ? (
                <select
                  id="quiz-select"
                  value={selectedQuiz}
                  onChange={(e) => setSelectedQuiz(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {myQuizzes.map((quiz) => (
                    <option key={quiz._id} value={quiz._id}>
                      {quiz.title}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-500">You have no quizzes. Generate one from a note first!</p>
              )}
            </div>
            <Button onClick={handleCreateRoom} className="w-full" disabled={myQuizzes.length === 0}>
              Create Room
            </Button>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Join an Existing Room</h2>
          <form onSubmit={handleJoinRoom} className="space-y-4">
            <Input
              type="text"
              placeholder="Enter Room Code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            />
            <Button type="submit" className="w-full">
              Join Room
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}