'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { sanitizeHTML } from '@/utils/sanitizer';
import Button from '@/components/ui/Button';
import { FiArrowLeft, FiBookmark, FiTrash2 } from 'react-icons/fi';
import SkeletonCard from '@/components/ui/SkeletonCard';

interface PinnedQuestion {
  _id: string;
  subjectId: {
    _id: string;
    name: string;
  };
  questionIndex: number;
  category: string;
  type?: string;
  pinnedAt: string;
  questionData: {
    question: string;
    answer: string;
    marks: number;
    source?: string;
  };
  subjectName: string;
}

const PinnedQuestionCard = ({ pinnedQuestion, onUnpin }: { 
  pinnedQuestion: PinnedQuestion; 
  onUnpin: (pin: PinnedQuestion) => void;
}) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const [isUnpinning, setIsUnpinning] = useState(false);
  const router = useRouter();

  const handleUnpin = async () => {
    setIsUnpinning(true);
    try {
      await api.post('/pinned-questions/unpin', {
        subjectId: pinnedQuestion.subjectId._id,
        questionIndex: pinnedQuestion.questionIndex,
        category: pinnedQuestion.category,
        type: pinnedQuestion.type
      });
      onUnpin(pinnedQuestion);
      toast.success('Question unpinned');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to unpin question');
    } finally {
      setIsUnpinning(false);
    }
  };

  return (
    <div className="border border-yellow-200 dark:border-yellow-700 rounded-lg overflow-hidden hover:shadow-md transition-all duration-300">
      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 border-b border-yellow-200 dark:border-yellow-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiBookmark className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            <button
              onClick={() => router.push(`/subjects/${pinnedQuestion.subjectId._id}`)}
              className="font-medium text-yellow-800 dark:text-yellow-200 hover:underline"
            >
              {pinnedQuestion.subjectName}
            </button>
            <span className="text-xs text-yellow-600 dark:text-yellow-400">
              • {pinnedQuestion.category.replace('Marker', ' Marker')}
              {pinnedQuestion.type && ` • ${pinnedQuestion.type.charAt(0).toUpperCase() + pinnedQuestion.type.slice(1)}`}
            </span>
          </div>
          <button
            onClick={handleUnpin}
            disabled={isUnpinning}
            className="p-1 rounded text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors"
            title="Unpin question"
          >
            {isUnpinning ? '⏳' : <FiTrash2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                Q{pinnedQuestion.questionIndex + 1}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300">
                {pinnedQuestion.questionData.marks}M
              </span>
              {pinnedQuestion.questionData.source && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300">
                  {pinnedQuestion.questionData.source}
                </span>
              )}
            </div>
            
            <h4 className="font-medium text-gray-900 dark:text-gray-100 leading-relaxed mb-3 break-words">
              {pinnedQuestion.questionData.question}
            </h4>
            
            {showAnswer && (
              <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-700">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-semibold text-green-700 dark:text-green-300">ANSWER</span>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <div 
                    className="prose dark:prose-invert prose-sm max-w-none text-sm leading-6 break-words"
                    dangerouslySetInnerHTML={{ 
                      __html: sanitizeHTML(pinnedQuestion.questionData.answer)
                        .replace(/\n\n/g, '</p><p class="mt-3">')
                        .replace(/\n/g, '<br>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-gray-100 bg-yellow-100 dark:bg-yellow-900/30 px-1 rounded">$1</strong>')
                    }} 
                  />
                </div>
              </div>
            )}
            
            <div className="mt-4">
              <button
                onClick={() => setShowAnswer(!showAnswer)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                  showAnswer 
                    ? 'bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/50 dark:hover:bg-green-900/70 dark:text-green-300'
                    : 'bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/50 dark:hover:bg-blue-900/70 dark:text-blue-300'
                }`}
              >
                {showAnswer ? '👁️ Hide' : '👀 Show'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function PinnedQuestionsPage() {
  const router = useRouter();
  const [pinnedQuestions, setPinnedQuestions] = useState<PinnedQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<'subject' | 'category'>('subject');

  const fetchPinnedQuestions = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/pinned-questions');
      setPinnedQuestions(data.pinnedQuestions);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch pinned questions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPinnedQuestions();
  }, []);

  const handleUnpin = (unpinnedQuestion: PinnedQuestion) => {
    setPinnedQuestions(prev => prev.filter(
      pin => !(pin.subjectId._id === unpinnedQuestion.subjectId._id && 
               pin.questionIndex === unpinnedQuestion.questionIndex && 
               pin.category === unpinnedQuestion.category &&
               pin.type === unpinnedQuestion.type)
    ));
  };

  const handleClearAll = async () => {
    if (!confirm('Clear all pinned questions? This action cannot be undone.')) return;
    
    try {
      for (const pin of pinnedQuestions) {
        await api.post('/pinned-questions/unpin', {
          subjectId: pin.subjectId._id,
          questionIndex: pin.questionIndex,
          category: pin.category,
          type: pin.type
        });
      }
      setPinnedQuestions([]);
      toast.success('All pinned questions cleared!');
    } catch (error: any) {
      toast.error('Failed to clear all pinned questions');
    }
  };

  const groupedQuestions = groupBy === 'subject' 
    ? pinnedQuestions.reduce((acc, pin) => {
        const subjectName = pin.subjectName;
        if (!acc[subjectName]) acc[subjectName] = [];
        acc[subjectName].push(pin);
        return acc;
      }, {} as Record<string, PinnedQuestion[]>)
    : pinnedQuestions.reduce((acc, pin) => {
        const category = pin.category.replace('Marker', ' Marker');
        if (!acc[category]) acc[category] = [];
        acc[category].push(pin);
        return acc;
      }, {} as Record<string, PinnedQuestion[]>);

  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/dashboard')} 
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Pinned Questions</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Your saved questions from all subjects
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full border text-sm text-gray-500 dark:text-gray-400">
            {pinnedQuestions.length} Questions
          </span>
          
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setGroupBy('subject')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                groupBy === 'subject'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              By Subject
            </button>
            <button
              onClick={() => setGroupBy('category')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                groupBy === 'category'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              By Category
            </button>
          </div>
          
          {pinnedQuestions.length > 0 && (
            <Button 
              onClick={handleClearAll}
              variant="secondary"
              size="sm"
              className="text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50"
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      {pinnedQuestions.length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedQuestions).map(([groupName, questions]) => (
            <div key={groupName} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {groupName}
                  </h2>
                  <span className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full border text-sm text-gray-500 dark:text-gray-400">
                    {questions.length} Questions
                  </span>
                </div>
              </div>
              
              <div className="p-4 space-y-4">
                {questions.map((pin, index) => (
                  <PinnedQuestionCard 
                    key={`${pin.subjectId._id}-${pin.questionIndex}-${pin.category}-${pin.type}`}
                    pinnedQuestion={pin}
                    onUnpin={handleUnpin}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiBookmark className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No Pinned Questions</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Pin important questions from any subject's Q-Bank to create your personalized practice collection.
          </p>
          <Button 
            onClick={() => router.push('/dashboard')}
            className="bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700"
          >
            Go to Dashboard
          </Button>
        </div>
      )}
    </div>
  );
}