'use client';
import { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import Lobby from '@/components/study/Lobby';
import QuizInterface from '@/components/study/QuizInterface';
import Scoreboard from '@/components/study/Scoreboard';
import Spinner from '@/components/ui/Spinner';
import api from '@/lib/api';

// Define types
interface Member { _id: string; name: string; score: number; }
interface RoomState {
    quizId: string;
    host: string;
    members: Member[];
    status: 'waiting' | 'in-progress' | 'finished';
}
interface IQuestion { question: string; options: string[]; correctAnswer: string; }
interface IQuiz { _id: string; title: string; questions: IQuestion[]; }

// Use a memoized socket instance to prevent re-creation on re-renders
const useSocket = (uri: string) => {
    return useMemo(() => io(uri, { autoConnect: false }), [uri]);
}

export default function StudyRoomPage() {
    const { roomCode } = useParams();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const [roomState, setRoomState] = useState<RoomState | null>(null);
    const [quiz, setQuiz] = useState<IQuiz | null>(null);
    const socket = useSocket(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001');
    
    useEffect(() => {
        if (!user || !roomCode) return;

        socket.on('connect', () => {
            console.log(`Socket connected: ${socket.id}`);
            const quizId = searchParams.get('quizId');
            const isHost = searchParams.get('host');
            
            if (isHost && quizId) {
                socket.emit('createRoom', { roomCode, quizId, user: { id: user._id, name: user.name } });
            } else {
                socket.emit('joinRoom', { roomCode, user: { id: user._id, name: user.name } });
            }
        });

        socket.on('roomUpdate', (updatedRoom: RoomState) => {
            setRoomState(updatedRoom);
            if(updatedRoom.quizId && !quiz){
                api.get(`/quizzes/${updatedRoom.quizId}`).then(res => setQuiz(res.data));
            }
        });

        socket.on('quizStarted', () => {
            setRoomState(prev => prev ? {...prev, status: 'in-progress'} : null);
            toast.success('The quiz has started!');
        });

        socket.on('quizEnded', ({ finalScores }: { finalScores: Member[] }) => {
             setRoomState(prev => prev ? {...prev, status: 'finished', members: finalScores} : null);
             toast('The quiz has ended!', { icon: '🎉' });
        });

        socket.on('error', (error) => toast.error(error.message));
        
        socket.connect();

        return () => {
            socket.disconnect();
        };
    }, [user, roomCode, searchParams, socket, quiz]);

    if (!user || !roomState) {
        return <div className="flex justify-center items-center h-full"><Spinner /> <p className='ml-4'>Connecting to room...</p></div>;
    }

    const isHost = roomState.host === user._id;

    const handleStartQuiz = () => {
        socket.emit('startQuiz', { roomCode });
    };

    const handleAnswerSubmit = (questionIndex: number, answer: string) => {
        const isCorrect = quiz?.questions[questionIndex].correctAnswer === answer;
        socket.emit('submitAnswer', { roomCode, userId: user._id, questionIndex, answer, isCorrect });
        toast(isCorrect ? 'Correct!' : 'Incorrect.', { icon: isCorrect ? '✅' : '❌' });
    };
    
    const handleEndQuiz = () => {
        socket.emit('endQuiz', { roomCode });
    }

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold mb-2">Study Room: {roomCode}</h1>
            <p className="text-xl mb-6">Quiz: {quiz?.title || 'Loading quiz...'}</p>
            
            {roomState.status === 'waiting' && (
                <Lobby members={roomState.members} isHost={isHost} onStartQuiz={handleStartQuiz} />
            )}

            {roomState.status === 'in-progress' && quiz && (
                <QuizInterface quiz={quiz} onSubmitAnswer={handleAnswerSubmit} onEndQuiz={handleEndQuiz} />
            )}

            {roomState.status === 'finished' && (
                <Scoreboard scores={roomState.members} />
            )}
        </div>
    );
}