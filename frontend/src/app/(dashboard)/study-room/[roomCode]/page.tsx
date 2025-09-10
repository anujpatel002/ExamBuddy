'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import { FiUsers, FiPlay, FiArrowLeft, FiStar, FiChevronLeft, FiChevronRight, FiClock } from 'react-icons/fi';
import api from '@/lib/api';

interface Member {
  _id: string;
  name: string;
  score: number;
  submitted?: boolean;
}

interface RoomState {
  quizId: string;
  host: string;
  members: Member[];
  status: 'waiting' | 'in-progress' | 'finished';
  currentQuestion?: number;
  totalTime?: number;
}

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
}

interface Quiz {
  _id: string;
  title: string;
  questions: Question[];
}

export default function StudyRoomPage() {
  const { roomCode } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [roomMembers, setRoomMembers] = useState<Member[]>([]);
  const [socket, setSocket] = useState<any>(null);
  const hasJoinedRef = useRef(false);

  useEffect(() => {
    if (!user || !roomCode) return;

    const initializeRoom = async () => {
      const quizId = searchParams.get('quizId');
      const isHost = searchParams.get('host') === 'true';
      
      // Initialize socket connection
      const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001');
      setSocket(newSocket);
      
      if (isHost && quizId) {
        // Create room
        fetchQuiz(quizId);
        const roomData = {
          quizId,
          host: user._id,
          hostName: user.name,
          members: [{ _id: user._id, name: user.name, score: 0 }],
          status: 'waiting',
          roomCode: roomCode as string
        };
        
        // Store room in backend
        try {
          const { data: createdRoom } = await api.post('/study-rooms', {
            roomCode,
            quizId,
            host: user._id,
            hostName: user.name
          });
          setRoomState(createdRoom);
          setRoomMembers(createdRoom.members);
        } catch (error) {
          console.error('Failed to create room in backend');
          setRoomState(roomData);
          setRoomMembers(roomData.members);
        }
        
        setLoading(false);
      } else {
        // Join existing room from backend
        try {
          const { data: roomData } = await api.get(`/study-rooms/${roomCode}`);
          
          // Join the room
          const { data: updatedRoom } = await api.put(`/study-rooms/${roomCode}/join`, {
            userId: user._id,
            userName: user.name
          });
          
          // Fetch the quiz for this room
          fetchQuiz(updatedRoom.quizId);
          setRoomState(updatedRoom);
          setRoomMembers(updatedRoom.members);
          setLoading(false);
          
          if (!hasJoinedRef.current) {
            toast.success(`Joined room ${roomCode}`);
            hasJoinedRef.current = true;
          }
        } catch (error) {
          // Create a demo room if not found
          const demoRoomData = {
            quizId: 'demo123',
            host: 'demo_host',
            hostName: 'Demo Host',
            members: [
              { _id: 'demo_host', name: 'Demo Host', score: 0 },
              { _id: user._id, name: user.name, score: 0 }
            ],
            status: 'waiting' as const,
            roomCode: roomCode as string
          };
          
          setQuiz({
            _id: 'demo123',
            title: `Demo Quiz - Room ${roomCode}`,
            questions: [
              {
                question: 'What is 2 + 2?',
                options: ['3', '4', '5', '6'],
                correctAnswer: '4'
              },
              {
                question: 'What is the capital of France?',
                options: ['London', 'Berlin', 'Paris', 'Madrid'],
                correctAnswer: 'Paris'
              }
            ]
          });
          
          setRoomState(demoRoomData);
          setRoomMembers(demoRoomData.members);
          setLoading(false);
          
          if (!hasJoinedRef.current) {
            toast.success(`Joined room ${roomCode}`);
            hasJoinedRef.current = true;
          }
        }
      }
    };
    
    initializeRoom();
    
    // Poll for room updates every 3 seconds
    const pollInterval = setInterval(async () => {
      try {
        const { data: updatedRoom } = await api.get(`/study-rooms/${roomCode}`);
        setRoomMembers(updatedRoom.members);
        
        // Only update status if it actually changed
        if (updatedRoom.status !== roomState?.status) {
          setRoomState(updatedRoom);
          if (updatedRoom.status === 'in-progress') {
            setTimeLeft(updatedRoom.totalTime || 1800);
          } else if (updatedRoom.status === 'finished') {
            setTimeLeft(0);
            setRoomMembers(updatedRoom.members);
          }
        } else if (updatedRoom.status === 'finished') {
          // Update member scores even if status hasn't changed
          setRoomMembers(updatedRoom.members);
        }
      } catch (error) {
        // Room might not exist in backend, ignore
      }
    }, 3000);
    
    return () => {
      clearInterval(pollInterval);
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user, roomCode, searchParams]);

  const fetchQuiz = async (quizId: string) => {
    try {
      const { data } = await api.get(`/quizzes/${quizId}`);
      setQuiz(data);
    } catch (error) {
      toast.error('Failed to load quiz');
    }
  };

  const handleStartQuiz = async () => {
    const totalMinutes = parseInt((document.getElementById('totalTime') as HTMLInputElement)?.value) || 30;
    
    // Update room status in backend
    try {
      await api.put(`/study-rooms/${roomCode}/start`, { timePerQuestion: totalMinutes });
    } catch (error) {
      console.error('Failed to start quiz in backend');
    }
    
    setTimeLeft(totalMinutes * 60);
    setRoomState(prev => prev ? {...prev, status: 'in-progress', totalTime: totalMinutes * 60} : null);
    toast.success('Quiz started!');
  };

  const handleAnswerSelect = (answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answer
    }));
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!quiz) return;
    
    let score = 0;
    quiz.questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        score++;
      }
    });

    // Update score in backend
    try {
      const { data: updatedRoom } = await api.put(`/study-rooms/${roomCode}/submit`, {
        userId: user?._id,
        score
      });
      
      // Update local state with backend response
      setRoomState(updatedRoom);
      setRoomMembers(updatedRoom.members);
      
      if (updatedRoom.status === 'finished') {
        setTimeLeft(0);
      }
    } catch (error) {
      console.error('Failed to submit score');
    }

    toast.success(`Quiz submitted! Score: ${score}/${quiz.questions.length}`);
  };

  const handleLeaveRoom = async () => {
    const isHost = roomState?.host === user?._id;
    
    try {
      if (isHost) {
        // Delete room if host leaves
        await api.delete(`/study-rooms/${roomCode}`);
      } else {
        // Just leave room if regular user
        await api.put(`/study-rooms/${roomCode}/leave`, {
          userId: user?._id
        });
      }
    } catch (error) {
      console.error('Failed to leave room');
    }
    
    toast.success('Left the room');
    router.push('/study-room');
  };

  // Timer effect
  useEffect(() => {
    if (roomState?.status !== 'in-progress' || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1 && roomState?.status === 'in-progress') {
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [roomState?.status, timeLeft, handleSubmitQuiz]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p>Loading room...</p>
        </div>
      </div>
    );
  }

  if (!roomState || !user) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">Failed to load room</p>
        <Button onClick={() => router.push('/study-room')}>
          <FiArrowLeft className="mr-2" />
          Back to Study Rooms
        </Button>
      </div>
    );
  }

  const isHost = roomState.host === user._id;
  const currentQuestion = quiz?.questions[currentQuestionIndex];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Room: {roomCode}</h1>
            <p className="text-gray-600 dark:text-gray-400">{quiz?.title}</p>
          </div>
          <div className="flex items-center gap-4">
            {roomState.status === 'in-progress' && (
              <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/20 px-3 py-1 rounded-lg">
                <FiClock className="text-blue-600" />
                <span className="font-bold text-blue-600">{formatTime(timeLeft)}</span>
              </div>
            )}
            <Button onClick={handleLeaveRoom} variant="secondary">
              <FiArrowLeft className="mr-2" />
              Leave Room
            </Button>
          </div>
        </div>
      </div>

      {/* Members */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="flex items-center gap-2 mb-4">
          <FiUsers className="text-xl" />
          <h2 className="text-lg font-semibold">Participants ({roomMembers.length})</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {roomMembers.map((member) => (
            <div key={member._id} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              {member._id === roomState.host && <FiStar className="text-yellow-500" />}
              <div>
                <p className="font-medium text-sm">{member.name}</p>
                <p className="text-xs text-gray-500">
                  Score: {member.score}
                  {member.submitted && <span className="ml-2 text-green-600">✓ Submitted</span>}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Waiting Room */}
      {roomState.status === 'waiting' && (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow text-center">
          <h2 className="text-xl font-semibold mb-4">Ready to start?</h2>
          {isHost && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Total quiz time (minutes)</label>
                <input
                  id="totalTime"
                  type="number"
                  defaultValue={30}
                  min={5}
                  max={180}
                  className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md text-center"
                />
              </div>
              <Button onClick={handleStartQuiz} className="bg-green-600 hover:bg-green-700">
                <FiPlay className="mr-2" />
                Start Quiz
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Quiz Interface */}
      {roomState.status === 'in-progress' && currentQuestion && quiz && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </h2>
              <div className="w-full bg-gray-200 rounded-full h-2 mx-4">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all"
                  style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            <h3 className="text-xl mb-4">{currentQuestion.question}</h3>
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(option)}
                  className={`w-full p-4 text-left border rounded-lg transition-colors ${
                    answers[currentQuestionIndex] === option
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <Button 
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              variant="secondary"
            >
              <FiChevronLeft className="mr-2" />
              Previous
            </Button>

            <div className="flex gap-2">
              {currentQuestionIndex === quiz.questions.length - 1 ? (
                <Button onClick={handleSubmitQuiz} className="bg-green-600 hover:bg-green-700">
                  Submit Quiz
                </Button>
              ) : (
                <Button 
                  onClick={handleNext}
                  disabled={currentQuestionIndex === quiz.questions.length - 1}
                >
                  Next
                  <FiChevronRight className="ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {roomState.status === 'finished' && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-6 text-center">Quiz Results 🎉</h2>
          <div className="space-y-3">
            {roomMembers
              .sort((a, b) => b.score - a.score)
              .slice(0, 10)
              .map((member, index) => (
                <div key={member._id} className={`flex justify-between items-center p-4 rounded-lg ${
                  index === 0 ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                  index === 1 ? 'bg-gray-100 dark:bg-gray-700' :
                  index === 2 ? 'bg-orange-100 dark:bg-orange-900/20' :
                  'bg-gray-50 dark:bg-gray-700/50'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </span>
                    <span className="font-medium">{member.name}</span>
                  </div>
                  <span className="text-xl font-bold">{member.score}/{quiz?.questions.length}</span>
                </div>
              ))}
          </div>
          <div className="text-center mt-6">
            <Button onClick={handleLeaveRoom}>
              <FiArrowLeft className="mr-2" />
              Back to Study Rooms
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}