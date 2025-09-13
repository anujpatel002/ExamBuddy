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
                <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow text-center mb-6">
                    <h2 className="text-xl md:text-2xl font-bold mb-4">Quiz Complete!</h2>
                    <p className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100">Your Score: {score} / {quiz.questions.length}</p>
                    <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
                        <Button variant="secondary" onClick={() => setIsReviewMode(!isReviewMode)}>
                            {isReviewMode ? 'Hide Answers' : 'View Answers'}
                        </Button>
                        <Button onClick={() => {
                            if (quiz.subject) {
                                router.replace(`/subjects/${quiz.subject._id}`);
                            } else if (quiz.note) {
                                router.replace(`/notes/${quiz.note._id}`);
                            } else {
                                router.replace('/dashboard');
                            }
                        }}>
                            {quiz.subject ? 'Back to Subject' : 'Back to Note'}
                        </Button>
                    </div>
                </div>

                {isReviewMode && (
                    <div className="space-y-4 animate-fade-in">
                        <h3 className="text-lg md:text-xl font-bold">Answer Review</h3>
                        {quiz.questions.map((q, index) => {
                            const userAnswer = selectedAnswers[index];
                            const isCorrect = userAnswer === q.correctAnswer;
                            return (
                                <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                                    <p className="font-semibold text-gray-900 dark:text-gray-100">{index + 1}. {q.question}</p>
                                    <div className="mt-2 space-y-2">
                                        {q.options.map(option => {
                                            let style = "border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-300";
                                            if (option === q.correctAnswer) {
                                                style = "bg-green-100 dark:bg-green-900/50 border-green-500 dark:border-green-700 text-green-800 dark:text-green-200";
                                            } else if (option === userAnswer) {
                                                style = "bg-red-100 dark:bg-red-900/50 border-red-500 dark:border-red-700 text-red-800 dark:text-red-200";
                                            }
                                            return <div key={option} className={`p-2 border rounded ${style}`}>{option}</div>;
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
            <h1 className="text-2xl md:text-3xl font-bold mb-6 truncate">{quiz.title}</h1>
            <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg md:text-xl font-semibold">Question {currentQuestionIndex + 1} of {quiz.questions.length}</h3>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {selectedAnswers.filter(ans => ans !== null).length} / {quiz.questions.length} Answered
                    </div>
                </div>
                
                <p className="text-md md:text-lg mb-6">{currentQuestion.question}</p>
                <div className="space-y-3">
                    {currentQuestion.options.map((option) => (
                        <button
                            key={option}
                            onClick={() => handleAnswerSelect(option)}
                            className={`w-full text-left p-3 rounded-md border-2 transition-colors text-gray-800 dark:text-gray-200 ${selectedAnswers[currentQuestionIndex] === option ? 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-500' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                        >{option}</button>
                    ))}
                </div>

                <div className="mt-8 flex justify-between items-center">
                    <Button 
                        onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)} 
                        disabled={currentQuestionIndex === 0}
                        variant="secondary"
                        aria-label="Previous Question"
                    >
                        <FiArrowLeft className="w-5 h-5" />
                    </Button>

                    {currentQuestionIndex < quiz.questions.length - 1 ? (
                        <Button 
                            onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                            disabled={!selectedAnswers[currentQuestionIndex]}
                            aria-label="Next Question"
                        >
                           <span className="hidden sm:inline">Next</span> <FiArrowRight className="w-5 h-5 sm:ml-2" />
                        </Button>
                    ) : (
                        <Button 
                            onClick={() => setIsFinished(true)}
                            disabled={!selectedAnswers[currentQuestionIndex]}
                        >
                            Finish Quiz
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}