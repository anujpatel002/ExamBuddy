'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi';

// Updated type for quiz to include the note ID
interface IQuestion { question: string; options: string[]; correctAnswer: string; }
interface IQuiz { _id: string; title: string; questions: IQuestion[]; note?: { _id: string; subject: string; }; subject?: { _id: string; name: string; }; }

export default function SoloQuizPage() {
    const { id: quizId } = useParams();
    const router = useRouter();
    const [quiz, setQuiz] = useState<IQuiz | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
    const [isFinished, setIsFinished] = useState(false);
    const [isReviewMode, setIsReviewMode] = useState(false);

    useEffect(() => {
        const fetchQuiz = async () => {
            if (!quizId) return;
            try {
                const { data } = await api.get(`/quizzes/${quizId}`);
                setQuiz(data);
                setSelectedAnswers(new Array(data.questions.length).fill(null));
            } catch (error) {
                // Handle error
            }
        };
        fetchQuiz();
    }, [quizId]);

    const handleAnswerSelect = (option: string) => {
        const newAnswers = [...selectedAnswers];
        newAnswers[currentQuestionIndex] = option;
        setSelectedAnswers(newAnswers);
    };

    const score = quiz ? quiz.questions.reduce((total, question, index) => {
        return selectedAnswers[index] === question.correctAnswer ? total + 1 : total;
    }, 0) : 0;

    if (!quiz) return <div className="flex justify-center items-center h-full"><Spinner /></div>;
    
    // --- RENDER LOGIC ---

    if (isFinished) {
        return (
            <div className="max-w-3xl mx-auto">
                <div className="glass-card p-8 md:p-10 rounded-3xl shadow-2xl text-center mb-8 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-teal-500/10"></div>
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400"></div>
                    
                    <div className="relative z-10">
                        <div className="w-20 h-20 glass-card rounded-2xl flex items-center justify-center mx-auto mb-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                            <span className="text-4xl">🏆</span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-6">Quiz Complete!</h2>
                        <p className="text-4xl md:text-5xl font-bold theme-text-primary mb-8">Your Score: {score} / {quiz.questions.length}</p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Button 
                                variant="secondary" 
                                onClick={() => setIsReviewMode(!isReviewMode)}
                                className="modern-button glass-card hover:scale-105 transition-all duration-300"
                            >
                                {isReviewMode ? 'Hide Answers' : 'View Answers'}
                            </Button>
                            <Button 
                                onClick={() => {
                                    if (quiz.subject) {
                                        router.push(`/subjects/${quiz.subject._id}`);
                                    } else if (quiz.note) {
                                        router.push(`/notes/${quiz.note._id}`);
                                    } else {
                                        router.push('/dashboard');
                                    }
                                }}
                                className="modern-button bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white hover:scale-105 transition-all duration-300"
                            >
                                {quiz.subject ? 'Back to Subject' : 'Back to Note'}
                            </Button>
                        </div>
                    </div>
                </div>

                {isReviewMode && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Answer Review</h3>
                        {quiz.questions.map((q, index) => {
                            const userAnswer = selectedAnswers[index];
                            const isCorrect = userAnswer === q.correctAnswer;
                            return (
                                <div key={index} className="glass-card p-6 rounded-2xl shadow-lg relative overflow-hidden">
                                    <div className={`absolute top-0 left-0 w-full h-1 ${isCorrect ? 'bg-gradient-to-r from-green-400 to-emerald-400' : 'bg-gradient-to-r from-red-400 to-pink-400'}`}></div>
                                    <p className="font-bold theme-text-primary mb-4 text-lg">{index + 1}. {q.question}</p>
                                    <div className="space-y-3">
                                        {q.options.map(option => {
                                            let style = "glass-card border theme-border theme-text-primary";
                                            if (option === q.correctAnswer) {
                                                style = "glass-card quiz-correct";
                                            } else if (option === userAnswer) {
                                                style = "glass-card quiz-wrong";
                                            }
                                            return <div key={option} className={`p-4 rounded-xl ${style} transition-all duration-300`}>{option}</div>;
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    const currentQuestion = quiz.questions[currentQuestionIndex];
    return (
        <div className="max-w-3xl mx-auto">
            <div className="glass-card p-6 rounded-3xl mb-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10"></div>
                <div className="relative z-10">
                    <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent truncate">{quiz.title}</h1>
                </div>
            </div>
            
            <div className="glass-card p-6 md:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5"></div>
                
                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg md:text-xl font-bold theme-text-primary">Question {currentQuestionIndex + 1} of {quiz.questions.length}</h3>
                        <div className="glass-card px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            {selectedAnswers.filter(ans => ans !== null).length} / {quiz.questions.length} Answered
                        </div>
                    </div>
                
                    <p className="text-lg md:text-xl mb-8 theme-text-primary leading-relaxed">{currentQuestion.question}</p>
                    <div className="space-y-4">
                        {currentQuestion.options.map((option) => (
                            <button
                                key={option}
                                onClick={() => handleAnswerSelect(option)}
                                className={`quiz-option w-full text-left p-4 rounded-2xl border-2 transition-all duration-300 theme-text-primary ${
                                    selectedAnswers[currentQuestionIndex] === option 
                                        ? 'glass-card quiz-selected shadow-lg' 
                                        : 'glass-card theme-border'
                                }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>

                    <div className="mt-10 flex justify-between items-center">
                        <Button 
                            onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)} 
                            disabled={currentQuestionIndex === 0}
                            variant="secondary"
                            aria-label="Previous Question"
                            className="modern-button glass-card hover:scale-105 transition-all duration-300 p-4 rounded-2xl"
                        >
                            <FiArrowLeft className="w-5 h-5" />
                        </Button>

                        {currentQuestionIndex < quiz.questions.length - 1 ? (
                            <Button 
                                onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                                disabled={!selectedAnswers[currentQuestionIndex]}
                                aria-label="Next Question"
                                className="modern-button bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white hover:scale-105 transition-all duration-300 px-6 py-4 rounded-2xl"
                            >
                               <span className="hidden sm:inline">Next</span> <FiArrowRight className="w-5 h-5 sm:ml-2" />
                            </Button>
                        ) : (
                            <Button 
                                onClick={() => setIsFinished(true)}
                                disabled={!selectedAnswers[currentQuestionIndex]}
                                className="modern-button bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white hover:scale-105 transition-all duration-300 px-6 py-4 rounded-2xl"
                            >
                                Finish Quiz
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}