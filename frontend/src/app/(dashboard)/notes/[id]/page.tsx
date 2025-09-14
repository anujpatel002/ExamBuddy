'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { sanitizeHTML } from '@/utils/sanitizer';
import Button from '@/components/ui/Button';
import Flashcard from '@/components/notes/Flashcard';
import Spinner from '@/components/ui/Spinner';

import { FiFileText, FiClipboard, FiHelpCircle, FiEdit, FiArrowLeft, FiTrash2, FiShare2, FiMessageSquare } from 'react-icons/fi';
import GenerateQuizModal from '@/components/notes/GenerateQuizModal';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';
import MindMap from '@/components/notes/MindMap';
import ChatInterface from '@/components/notes/ChatInterface';

// --- Type Definitions ---
interface IFlashcard { question: string; answer: string; }
interface IQuiz { _id: string; title: string; note: { _id: string; title: string; }; questionCount: number; }
interface ICategorizedQuestion { question: string; answer: string; }
interface INote {
  _id: string;
  title: string;
  summary?: string;
  flashcards?: IFlashcard[] | {
    theory?: IFlashcard[];
    practical?: IFlashcard[];
  };
  categorizedQuestions?: {
    oneMarker?: ICategorizedQuestion[];
    threeMarker?: ICategorizedQuestion[];
    fourMarker?: ICategorizedQuestion[];
    fiveMarker?: ICategorizedQuestion[];
  } | {
    theory?: {
      oneMarker?: ICategorizedQuestion[];
      threeMarker?: ICategorizedQuestion[];
      fourMarker?: ICategorizedQuestion[];
      fiveMarker?: ICategorizedQuestion[];
    };
    practical?: {
      oneMarker?: ICategorizedQuestion[];
      threeMarker?: ICategorizedQuestion[];
      fourMarker?: ICategorizedQuestion[];
      fiveMarker?: ICategorizedQuestion[];
    };
  };
  mindMap?: any;
  embeddingStatus?: 'pending' | 'completed' | 'failed';
}
type ActiveTab = 'summary' | 'flashcards' | 'practice' | 'mcq' | 'mindmap' | 'chat';

// Practice Question Card Component
const PracticeQuestionCard = ({ question, index, activePracticeTab, questionCategories, onPin, isPinned }: {
  question: ICategorizedQuestion & { _id?: string; isPinned?: boolean };
  index: number;
  activePracticeTab: string;
  questionCategories: { key: string; label: string; }[];
  onPin: (questionId: string, marker: string) => void;
  isPinned?: boolean;
}) => {
  const [showAnswer, setShowAnswer] = useState(false);
  
  return (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-md transition-all duration-300 ${showAnswer ? 'shadow-lg' : ''}`}>
      <div className="bg-gray-50 dark:bg-gray-800/50 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {isPinned && <span className="text-yellow-500">📌</span>}
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                  Question {index + 1}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  activePracticeTab === 'oneMarker' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                  activePracticeTab === 'threeMarker' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
                  activePracticeTab === 'fourMarker' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300' :
                  'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                }`}>
                  {questionCategories.find(c => c.key === activePracticeTab)?.label}
                </span>
              </div>
              <button
                onClick={() => onPin(question._id || `${index}`, activePracticeTab)}
                className={`p-1 rounded transition-colors ${
                  isPinned ? 'text-yellow-500 hover:text-yellow-600' : 'text-gray-400 hover:text-gray-600'
                }`}
                title={isPinned ? 'Unpin question' : 'Pin question'}
              >
                📌
              </button>
            </div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 leading-relaxed mb-3">{question.question}</h4>
            
            <div className={`mt-4 overflow-hidden transition-all duration-500 ease-in-out ${
              showAnswer ? 'max-h-none opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-700">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-semibold text-green-700 dark:text-green-300">ANSWER</span>
                </div>
                <div className="prose dark:prose-invert prose-sm max-w-none text-sm leading-7 overflow-y-auto max-h-96 overflow-x-hidden">
                  <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(question.answer) }} />
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <button
                onClick={() => setShowAnswer(!showAnswer)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                  showAnswer 
                    ? 'bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/50 dark:hover:bg-green-900/70 dark:text-green-300'
                    : 'bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/50 dark:hover:bg-blue-900/70 dark:text-blue-300'
                }`}
              >
                {showAnswer ? '👁️ Hide Answer' : '👀 Show Answer'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function NoteDetailPage() {
  const { id: noteId } = useParams();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [note, setNote] = useState<INote | null>(null);
  const [quizzes, setQuizzes] = useState<IQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('summary');
  const [activePracticeTab, setActivePracticeTab] = useState('oneMarker');
  const [practiceQuestionPages, setPracticeQuestionPages] = useState<{[key: string]: number}>({});
  const [quizPage, setQuizPage] = useState(1);
  const [flashcardPages, setFlashcardPages] = useState<{[key: string]: number}>({});
  
  // Auto-logout after inactivity and reset flashcards on tab visibility change
  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;
    const INACTIVITY_TIME = 30 * 60 * 1000; // 30 minutes
    let wasInactive = false;
    
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        console.log('=== BEFORE LOGOUT - FLASHCARD STATE ===');
        if (note?.flashcards) {
          console.log('Theory flashcards displayed:', (note.flashcards as any).theory?.length || 0);
          console.log('Practical flashcards displayed:', (note.flashcards as any).practical?.length || 0);
          console.log('Theory total in DB:', (note.flashcards as any).allGenerated?.theory?.length || 0);
          console.log('Practical total in DB:', (note.flashcards as any).allGenerated?.practical?.length || 0);
        }
        console.log('=== END BEFORE LOGOUT ===');
        
        console.log('Auto-logout due to inactivity');
        localStorage.removeItem('token');
        localStorage.setItem('resetFlashcards', 'true');
        sessionStorage.removeItem('flashcardsReset');
        window.location.href = '/login';
      }, INACTIVITY_TIME);
    };
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab became inactive
        wasInactive = true;
        console.log('Tab became inactive');
      } else if (wasInactive) {
        // Tab became active after being inactive
        console.log('Tab became active after inactivity - resetting flashcards');
        localStorage.setItem('resetFlashcards', 'true');
        wasInactive = false;
        // Refresh the page to reset flashcards
        window.location.reload();
      }
    };
    
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // Set initial timer
    resetTimer();
    
    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });
    
    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  const [activePracticeType, setActivePracticeType] = useState('theory');
  const [activeFlashcardType, setActiveFlashcardType] = useState('theory');
  const [activeMindMapType, setActiveMindMapType] = useState('theory');
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<IQuiz | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [aiProgress, setAiProgress] = useState({ message: '', progress: 0 });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [pinnedQuestions, setPinnedQuestions] = useState<{[key: string]: string[]}>({});

  // Detect theme changes
  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark') ||
                    document.documentElement.getAttribute('data-theme') === 'dark' ||
                    window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(isDark);
    };
    
    checkTheme();
    
    // Listen for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkTheme);
    
    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', checkTheme);
    };
  }, []);

  // Monitor background color changes and adjust text accordingly
  useEffect(() => {
    if (note?.summary) {
      const summaryContainer = document.querySelector('.summary-content')?.parentElement;
      if (summaryContainer) {
        const observer = new MutationObserver(() => {
          const bgColor = window.getComputedStyle(summaryContainer).backgroundColor;
          const rgb = bgColor.match(/\d+/g);
          
          if (rgb) {
            // Calculate brightness of background
            const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
            const isDarkBg = brightness < 128;
            
            const summaryElement = document.querySelector('.summary-content');
            if (summaryElement) {
              // Apply text colors based on background brightness
              const textElements = summaryElement.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, td, th, span, div');
              textElements.forEach(el => {
                (el as HTMLElement).style.color = isDarkBg ? '#ffffff' : '#374151';
                (el as HTMLElement).style.setProperty('color', isDarkBg ? '#ffffff' : '#374151', 'important');
              });
              
              // Special colors for headings
              const headings = summaryElement.querySelectorAll('h1, h2, h3');
              headings.forEach(el => {
                (el as HTMLElement).style.setProperty('color', isDarkBg ? '#60a5fa' : '#1f2937', 'important');
              });
            }
          }
        });
        
        // Observe background changes
        observer.observe(summaryContainer, { attributes: true, attributeFilter: ['class', 'style'] });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
        
        // Initial call
        observer.disconnect();
        observer.observe(summaryContainer, { attributes: true, attributeFilter: ['class', 'style'] });
        
        // Trigger initial check
        setTimeout(() => {
          observer.disconnect();
          observer.observe(summaryContainer, { attributes: true, attributeFilter: ['class', 'style'] });
        }, 100);
        
        return () => observer.disconnect();
      }
    }
  }, [note?.summary]);

  const fetchNoteAndQuizzes = async () => {
    if (!noteId || noteId === 'undefined') {
      setLoading(false);
      router.push('/dashboard');
      return;
    }
    try {
      const noteRes = await api.get(`/notes/${noteId}`);
      console.log('Fetched note data:', noteRes.data);
      
      // Check if content needs to be reset on fresh login
      const shouldReset = localStorage.getItem('resetFlashcards') === 'true' || 
                         sessionStorage.getItem('flashcardsReset') !== 'true';
      
      if (shouldReset) {
        console.log('=== FRESH LOGIN - RESETTING CONTENT ===');
        
        // Reset flashcards
        const flashcards = noteRes.data.flashcards;
        if (flashcards && flashcards.allGenerated) {
          const updatedFlashcards = { ...flashcards };
          
          if (flashcards.allGenerated.theory?.length > 0) {
            const theoryCards = flashcards.allGenerated.theory.slice(0, 5);
            updatedFlashcards.theory = theoryCards;
            updatedFlashcards.displayedCount = { ...updatedFlashcards.displayedCount, theory: theoryCards.length };
          }
          
          if (flashcards.allGenerated.practical?.length > 0) {
            const practicalCards = flashcards.allGenerated.practical.slice(0, 5);
            updatedFlashcards.practical = practicalCards;
            updatedFlashcards.displayedCount = { ...updatedFlashcards.displayedCount, practical: practicalCards.length };
          }
          
          noteRes.data.flashcards = updatedFlashcards;
        }
        
        // Reset practice questions
        const categorizedQuestions = noteRes.data.categorizedQuestions;
        if (categorizedQuestions && categorizedQuestions.allGenerated) {
          const updatedQuestions = { ...categorizedQuestions };
          const markerKeys = ['oneMarker', 'threeMarker', 'fourMarker', 'fiveMarker'];
          
          markerKeys.forEach(key => {
            if (categorizedQuestions.allGenerated[key]) {
              const questionsToShow = categorizedQuestions.allGenerated[key].slice(0, 3);
              updatedQuestions[key] = questionsToShow;
              updatedQuestions.displayedCount = { ...updatedQuestions.displayedCount, [key]: questionsToShow.length };
            }
          });
          
          noteRes.data.categorizedQuestions = updatedQuestions;
        }
        
        // Save reset state to backend
        try {
          if (flashcards && flashcards.allGenerated) {
            await api.post(`/notes/${noteId}/reset-flashcards`, {
              displayedCount: noteRes.data.flashcards.displayedCount
            });
          }
          if (categorizedQuestions && categorizedQuestions.allGenerated) {
            await api.post(`/notes/${noteId}/reset-practice-questions`);
          }
        } catch (error) {
          console.error('Reset save failed:', error);
        }
        
        // Mark as reset for this session
        sessionStorage.setItem('flashcardsReset', 'true');
        localStorage.removeItem('resetFlashcards');
        
        console.log('=== RESET COMPLETE ===');
      }
      
      setNote(noteRes.data);
      const quizRes = await api.get('/quizzes/my');
      const noteQuizzes = quizRes.data.filter((quiz: IQuiz) => quiz.note?._id === noteId);
      
      // Apply quiz reset if needed
      if (shouldReset && noteQuizzes.length > 3) {
        try {
          await api.post(`/notes/${noteId}/reset-quizzes`);
          // Refetch quizzes after reset
          const updatedQuizRes = await api.get('/quizzes/my');
          setQuizzes(updatedQuizRes.data.filter((quiz: IQuiz) => quiz.note?._id === noteId && quiz.isVisible !== false));
        } catch (error) {
          console.error('Quiz reset failed:', error);
          setQuizzes(noteQuizzes.slice(0, 3)); // Fallback to client-side limit
        }
      } else {
        setQuizzes(noteQuizzes.filter((quiz: IQuiz) => quiz.isVisible !== false));
      }
    } catch (error: any) {
      console.error('Error fetching note:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch note details.';
      toast.error(errorMessage);
      
      // If it's a 404, redirect to dashboard
      if (error.response?.status === 404) {
        router.push('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNoteAndQuizzes();
  }, [noteId]);
  

  
  // Set default active types when data loads
  useEffect(() => {
    if (note?.flashcards && ((note.flashcards as any).theory !== undefined || (note.flashcards as any).practical !== undefined)) {
      // Only set default if not already set
      if (!activeFlashcardType || activeFlashcardType === 'theory') {
        setActiveFlashcardType('theory');
      }
    }
    
    if (note?.categorizedQuestions && ((note.categorizedQuestions as any).theory || (note.categorizedQuestions as any).practical)) {
      // Set to theory if it has content, otherwise practical
      const theoryHasContent = (note.categorizedQuestions as any).theory && Object.values((note.categorizedQuestions as any).theory).some((arr: any) => arr && arr.length > 0);
      const practicalHasContent = (note.categorizedQuestions as any).practical && Object.values((note.categorizedQuestions as any).practical).some((arr: any) => arr && arr.length > 0);
      
      if (theoryHasContent) {
        setActivePracticeType('theory');
      } else if (practicalHasContent) {
        setActivePracticeType('practical');
      }
    }
    
    if (note?.mindMap && (note.mindMap.theory || note.mindMap.practical)) {
      // Set to theory if it exists, otherwise practical
      if (note.mindMap.theory) {
        setActiveMindMapType('theory');
      } else if (note.mindMap.practical) {
        setActiveMindMapType('practical');
      }
    }
  }, [note]);
  
  // Reset pagination when switching tabs
  useEffect(() => {
    setPracticeQuestionPages({});
    setFlashcardPages({});
  }, [activePracticeTab, activeFlashcardType]);
  
  useEffect(() => {
    const handleAiProgress = (data: { message: string; progress: number }) => {
      setAiProgress(data);
    };
    
    // Add socket listener for AI progress
    if (typeof window !== 'undefined' && (window as any).socket) {
      (window as any).socket.on('ai-progress', handleAiProgress);
    }
    
    return () => {
      if (typeof window !== 'undefined' && (window as any).socket) {
        (window as any).socket.off('ai-progress', handleAiProgress);
      }
    };
  }, []);
  
  const handleGenerate = async (type: 'summary' | 'flashcards' | 'categorized' | 'mindmap', options?: any) => {
    const loadingState = type === 'categorized' && (options?.category || options?.markers) ? `${type}-${options.category || options.markers}` : type;
    setGenerating(loadingState);
    
    let endpoint = '';
    let payload = {};

    switch(type) {
      case 'summary': endpoint = `/ai/summarize/${noteId}`; break;
      case 'flashcards': 
        endpoint = `/ai/flashcards/${noteId}`;
        if (options?.flashcardType) {
          payload = { type: options.flashcardType };
        }
        break;
      case 'mindmap': endpoint = `/ai/mindmap/${noteId}`; break;
      case 'categorized':
        if (options?.markers) {
          endpoint = `/ai/more-categorized-questions/${noteId}`;
          payload = { markers: options.markers };
        } else {
          endpoint = `/ai/categorized-questions/${noteId}`;
        }
        break;
    }
    
    try {
      const response = await api.post(endpoint, payload);
      console.log(`${type} generation response:`, response.data);
      
      // Update state directly with response data
      if (response.data) {
        console.log('=== FRONTEND UPDATE ===');
        console.log('Response data:', response.data);
        setNote(prevNote => {
          if (!prevNote) return prevNote;
          const updatedNote = { ...prevNote };
          
          if (type === 'summary' && response.data.summary) {
            updatedNote.summary = response.data.summary;
          } else if (type === 'flashcards') {
            // Handle flashcards response
            if (response.data.flashcards) {
              console.log('Updating flashcards:', response.data.flashcards);
              updatedNote.flashcards = response.data.flashcards;
            }
          } else if (type === 'categorized') {
            // Handle categorized questions response
            if (response.data.categorizedQuestions) {
              updatedNote.categorizedQuestions = response.data.categorizedQuestions;
            } else if (response.data.practiceQuestions) {
              updatedNote.categorizedQuestions = response.data.practiceQuestions;
            }
          } else if (type === 'mindmap' && response.data.mindMap) {
            updatedNote.mindMap = response.data.mindMap;
          }
          
          console.log('Updated note flashcards:', updatedNote.flashcards);
          return updatedNote;
        });
      }
      
      toast.success(`Content generated successfully!`);
      // Only refetch for summary and mindmap, not for practice questions and flashcards
      if (type === 'summary' || type === 'mindmap') {
        await fetchNoteAndQuizzes();
      }
      await refreshUser(); // Refresh user data to update credits
    } catch (error: any) {
      console.error(`Error generating ${type}:`, error);
      const errorMessage = error.response?.data?.message || `Failed to generate content.`;
      
      if (errorMessage.includes('JSON')) {
        toast.error('Content generation completed but there was a formatting issue. Please try regenerating.');
        // Still try to fetch updated data in case something was saved
        await fetchNoteAndQuizzes();
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setGenerating('');
    }
  };

  const handleGenerateQuiz = async (quizName: string, questionCount: number) => {
    setGenerating('quiz');
    try {
      const response = await api.post(`/ai/quiz/${noteId}`, { quizName, questionCount });
      toast.success(`Quiz "${quizName}" generated successfully with ${response.data.quiz.questionCount} questions!`);
      await fetchNoteAndQuizzes();
      await refreshUser(); // Refresh user data to update credits
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to generate quiz.`);
    } finally {
      setGenerating('');
      setIsQuizModalOpen(false);
    }
  };

  const handleDeleteQuizClick = (quiz: IQuiz) => {
    setSelectedQuiz(quiz);
    setDeleteModalOpen(true);
  };

  const confirmDeleteQuiz = async () => {
    if (!selectedQuiz) return;
    setIsDeleting(true);
    try {
      await api.delete(`/quizzes/${selectedQuiz._id}`);
      toast.success('Quiz deleted successfully!');
      fetchNoteAndQuizzes();
    } catch (error) {
      toast.error('Failed to delete quiz.');
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setSelectedQuiz(null);
    }
  };

  const handlePinQuestion = (questionId: string, marker: string) => {
    setPinnedQuestions(prev => {
      const markerPinned = prev[marker] || [];
      const isCurrentlyPinned = markerPinned.includes(questionId);
      
      if (isCurrentlyPinned) {
        return {
          ...prev,
          [marker]: markerPinned.filter(id => id !== questionId)
        };
      } else {
        return {
          ...prev,
          [marker]: [...markerPinned, questionId]
        };
      }
    });
  };

  if (loading) return <div className="flex justify-center items-center h-full"><Spinner /></div>;
  if (!note) return <p>Note not found.</p>;

  const TabButton = ({ tabName, label, icon: Icon, disabled = false }: { tabName: ActiveTab; label: string; icon: React.ElementType; disabled?: boolean }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      disabled={disabled}
      className={`flex items-center gap-2 whitespace-nowrap py-4 px-3 border-b-2 font-medium text-sm transition-colors ${
        activeTab === tabName
          ? 'border-indigo-500 text-indigo-600'
          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );

  const questionCategories = note?.categorizedQuestions ? [
    { key: 'oneMarker', label: '1 Marker' },
    { key: 'threeMarker', label: '3 Marker' },
    { key: 'fourMarker', label: '4 Marker' },
    { key: 'fiveMarker', label: '5 Marker' },
  ].filter(cat => {
    const currentQuestions = (note.categorizedQuestions as any).theory ? 
      (note.categorizedQuestions as any)[activePracticeType] :
      note.categorizedQuestions;
    const questions = currentQuestions?.[cat.key];
    return Array.isArray(questions) && questions.length > 0;
  }) : [];

  const renderContent = () => {
    switch (activeTab) {
      case 'summary':
        return (
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
            {note.summary ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Summary</h3>
                  <Button 
                    onClick={() => handleGenerate('summary')} 
                    isLoading={generating === 'summary'}
                    variant="secondary"
                    size="sm"
                  >
                    🔄 Regenerate
                  </Button>
                </div>
                <div 
                  className="prose dark:prose-invert prose-sm max-w-none summary-content"
                  style={{ color: isDarkMode ? '#ffffff' : 'inherit' }}
                  dangerouslySetInnerHTML={{ __html: sanitizeHTML(note.summary) }} 
                />
              </>
            ) : (
              <Button onClick={() => handleGenerate('summary')} isLoading={generating === 'summary'}>Generate Summary</Button>
            )}
          </div>
        );
      case 'flashcards':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            {note.flashcards ? (
              <div>
                {/* Type Tabs for Theory/Practical */}
                {((note.flashcards as any).theory || (note.flashcards as any).practical) && (
                  <div className="bg-gray-100 dark:bg-gray-700/50 px-4 sm:px-6">
                    <nav className="-mb-px flex space-x-1" aria-label="Type Tabs">
                      {[
                        { key: 'theory', label: 'Theory', icon: '📚' },
                        { key: 'practical', label: 'Practical', icon: '⚡' }
                      ].map(tab => (
                        <button
                          key={tab.key}
                          onClick={() => setActiveFlashcardType(tab.key)}
                          className={`${activeFlashcardType === tab.key 
                            ? 'border-purple-500 text-purple-600 bg-white dark:bg-gray-800' 
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                          } whitespace-nowrap py-2 px-4 border-b-2 font-medium text-sm transition-all duration-200 flex items-center gap-2`}
                        >
                          <span>{tab.icon}</span>
                          {tab.label}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            activeFlashcardType === tab.key 
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' 
                              : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                          }`}>
                            {(note.flashcards as any)[tab.key]?.length || 0}
                          </span>
                        </button>
                      ))}
                    </nav>
                  </div>
                )}
                
                <div className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                    {(() => {
                      const allFlashcards = (note.flashcards as any)[activeFlashcardType] || [];
                      console.log('All flashcards for', activeFlashcardType, ':', allFlashcards.length, allFlashcards);
                      const currentPage = flashcardPages[activeFlashcardType] || 1;
                      const cardsPerPage = 9; // 3x3 grid
                      const startIndex = (currentPage - 1) * cardsPerPage;
                      const endIndex = startIndex + cardsPerPage;
                      const cardsToShow = allFlashcards.slice(startIndex, endIndex);
                      console.log('Cards to show:', cardsToShow.length, 'from', startIndex, 'to', endIndex);
                      
                      console.log('Flashcards to render:', cardsToShow.length, cardsToShow);
                      
                      if (cardsToShow.length === 0) {
                        return <div className="col-span-full text-center py-8 text-gray-500">No {activeFlashcardType} flashcards found</div>;
                      }
                      
                      return cardsToShow.map((fc: any, index: number) => {
                        console.log('Rendering flashcard:', index, fc);
                        if (!fc || !fc.question || !fc.answer) {
                          console.log('Invalid flashcard:', fc);
                          return null;
                        }
                        return (
                          <Flashcard 
                            key={`${activeFlashcardType}-${startIndex + index}`} 
                            flashcard={fc} 
                            allFlashcards={allFlashcards}
                            currentIndex={startIndex + index}
                          />
                        );
                      }).filter(Boolean);
                    })()
                    }
                  </div>
                  
                  {/* Flashcard Pagination */}
                  {(() => {
                    const allFlashcards = (note.flashcards as any)[activeFlashcardType] || [];
                    const totalPages = Math.ceil(allFlashcards.length / 9);
                    const currentPage = flashcardPages[activeFlashcardType] || 1;
                    
                    if (totalPages <= 1) return null;
                    
                    return (
                      <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-sm text-gray-600 dark:text-gray-400 mr-4">
                          Page {currentPage} of {totalPages} ({allFlashcards.length} flashcards)
                        </span>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                          <button
                            key={pageNum}
                            onClick={() => setFlashcardPages(prev => ({ ...prev, [activeFlashcardType]: pageNum }))}
                            className={`w-8 h-8 rounded-full text-sm font-medium transition-all duration-200 ${
                              currentPage === pageNum
                                ? 'bg-blue-500 text-white shadow-md'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {pageNum}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                  
                  {/* Show message if no flashcards for current type */}
                  {((note.flashcards as any)[activeFlashcardType]?.length || 0) === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">
                        No {activeFlashcardType} flashcards yet. Generate some below!
                      </p>
                    </div>
                  )}
                  <div className="text-center mt-6">
                    {(() => {
                      const hasTheoryPractical = (note.flashcards as any).theory !== undefined || (note.flashcards as any).practical !== undefined;
                      const currentCards = (note.flashcards as any)[activeFlashcardType] || [];
                      const allGenerated = (note.flashcards as any).allGenerated?.[activeFlashcardType] || [];
                      const displayedCount = (note.flashcards as any).displayedCount?.[activeFlashcardType] || 0;
                      const hasMoreInDB = allGenerated.length > displayedCount;
                      
                      console.log('Button logic:', {
                        activeFlashcardType,
                        currentCards: currentCards.length,
                        allGenerated: allGenerated.length,
                        displayedCount,
                        hasMoreInDB
                      });
                      
                      if (hasTheoryPractical) {
                        return (
                          <Button 
                            onClick={() => handleGenerate('flashcards', { flashcardType: activeFlashcardType })} 
                            isLoading={generating === 'flashcards'}
                          >
                            {hasMoreInDB ? 'Load More' : 'Generate More'} {activeFlashcardType === 'theory' ? 'Theory' : 'Practical'} Flashcards
                          </Button>
                        );
                      } else {
                        return (
                          <Button onClick={() => handleGenerate('flashcards')} isLoading={generating === 'flashcards'}>
                            Get More Flashcards
                          </Button>
                        );
                      }
                    })()
                    }
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 sm:p-6">
                <Button onClick={() => handleGenerate('flashcards')} isLoading={generating === 'flashcards'}>Generate Flashcards</Button>
              </div>
            )}
          </div>
        );
      case 'practice':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            {note.categorizedQuestions && Object.keys(note.categorizedQuestions).length > 0 ? (
              <div>
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Practice Questions</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Test your understanding with exam-style questions</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full border text-sm text-gray-500 dark:text-gray-400">
                        {(note.categorizedQuestions as any).theory ? 
                          Object.values((note.categorizedQuestions as any).theory).reduce((total: number, arr: any) => total + (arr?.length || 0), 0) +
                          Object.values((note.categorizedQuestions as any).practical || {}).reduce((total: number, arr: any) => total + (arr?.length || 0), 0)
                        : Object.values(note.categorizedQuestions).reduce((total: number, arr: any) => total + (Array.isArray(arr) ? arr.length : 0), 0)} Questions
                      </span>
                      {(() => {
                        const currentQuestions = (note.categorizedQuestions as any).theory ? 
                          (note.categorizedQuestions as any)[activePracticeType] :
                          note.categorizedQuestions;
                        const allGenerated = (note.categorizedQuestions as any).allGenerated?.[activePracticeTab] || [];
                        const displayed = currentQuestions?.[activePracticeTab]?.length || 0;
                        const hasMore = allGenerated.length > displayed;
                        const markerValue = activePracticeTab.replace('Marker', '').replace('one', '1').replace('three', '3').replace('four', '4').replace('five', '5');
                        
                        return (
                          <Button 
                            onClick={() => handleGenerate('categorized', { markers: markerValue })}
                            isLoading={generating === `categorized-${markerValue}`}
                            variant="secondary"
                            size="sm"
                          >
                            {hasMore ? '+ More' : '+ Generate'} {activePracticeTab.replace('Marker', ' Marker')}
                          </Button>
                        );
                      })()
                      }
                    </div>
                  </div>
                </div>

                {/* Type Tabs (Theory/Practical) */}
                {((note.categorizedQuestions as any).theory || (note.categorizedQuestions as any).practical) && (
                  <div className="bg-gray-100 dark:bg-gray-700/50 px-4 sm:px-6">
                    <nav className="-mb-px flex space-x-1" aria-label="Type Tabs">
                      {[
                        { key: 'theory', label: 'Theory', icon: '📚' },
                        { key: 'practical', label: 'Practical', icon: '⚡' }
                      ].filter(tab => (note.categorizedQuestions as any)[tab.key]).map(tab => {
                        const count = Object.values((note.categorizedQuestions as any)[tab.key] || {}).reduce((total: number, arr: any) => total + (Array.isArray(arr) ? arr.length : 0), 0);
                        return (
                          <button
                            key={tab.key}
                            onClick={() => setActivePracticeType(tab.key)}
                            className={`${activePracticeType === tab.key 
                              ? 'border-purple-500 text-purple-600 bg-white dark:bg-gray-800' 
                              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            } whitespace-nowrap py-2 px-4 border-b-2 font-medium text-sm transition-all duration-200 flex items-center gap-2`}
                          >
                            <span>{tab.icon}</span>
                            {tab.label}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              activePracticeType === tab.key 
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' 
                                : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                            }`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </nav>
                  </div>
                )}

                {/* Category Tabs */}
                <div className="bg-gray-50 dark:bg-gray-800/50 px-4 sm:px-6">
                  <nav className="-mb-px flex space-x-1 overflow-x-auto" aria-label="Tabs">
                    {questionCategories.map(tab => {
                      const currentQuestions = (note.categorizedQuestions as any).theory ? 
                        (note.categorizedQuestions as any)[activePracticeType] :
                        note.categorizedQuestions;
                      const count = currentQuestions?.[tab.key]?.length || 0;
                      return (
                        <button
                          key={tab.key}
                          onClick={() => setActivePracticeTab(tab.key)}
                          className={`${activePracticeTab === tab.key 
                            ? 'border-indigo-500 text-indigo-600 bg-white dark:bg-gray-800' 
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-800/50'
                          } whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm transition-all duration-200 rounded-t-lg flex items-center gap-2`}
                        >
                          <span className={`w-2 h-2 rounded-full ${
                            activePracticeTab === tab.key ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'
                          }`}></span>
                          {tab.label}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            activePracticeTab === tab.key 
                              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' 
                              : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Questions Content */}
                <div className="p-4 sm:p-6">
                  <div className="space-y-4">
                    {(() => {
                      const currentQuestions = (note.categorizedQuestions as any).theory ? 
                        (note.categorizedQuestions as any)[activePracticeType] :
                        note.categorizedQuestions;
                      const allQuestions = currentQuestions?.[activePracticeTab] || [];
                      const currentPage = practiceQuestionPages[activePracticeTab] || 1;
                      const questionsPerPage = 10;
                      const startIndex = (currentPage - 1) * questionsPerPage;
                      const endIndex = startIndex + questionsPerPage;
                      const questionsToShow = allQuestions.slice(startIndex, endIndex);
                      
                      if (questionsToShow.length === 0) {
                        return <div className="text-center py-8 text-gray-500">No questions found for {activePracticeTab}</div>;
                      }
                      
                      // Sort questions to show pinned ones first
                      const pinnedIds = pinnedQuestions[activePracticeTab] || [];
                      const sortedQuestions = questionsToShow.sort((a, b) => {
                        const aId = a._id || `${questionsToShow.indexOf(a)}`;
                        const bId = b._id || `${questionsToShow.indexOf(b)}`;
                        const aPinned = pinnedIds.includes(aId);
                        const bPinned = pinnedIds.includes(bId);
                        if (aPinned && !bPinned) return -1;
                        if (!aPinned && bPinned) return 1;
                        return 0;
                      });
                      
                      return sortedQuestions.map((q: any, index: number) => {
                        const questionId = q._id || `${allQuestions.indexOf(q)}`;
                        const isPinned = pinnedIds.includes(questionId);
                        return (
                          <PracticeQuestionCard 
                            key={questionId} 
                            question={{...q, _id: questionId}} 
                            index={index} 
                            activePracticeTab={activePracticeTab}
                            questionCategories={questionCategories}
                            onPin={handlePinQuestion}
                            isPinned={isPinned}
                          />
                        );
                      });
                    })()}
                  </div>
                  
                  {/* Pagination */}
                  {(() => {
                    const currentQuestions = (note.categorizedQuestions as any).theory ? 
                      (note.categorizedQuestions as any)[activePracticeType] :
                      note.categorizedQuestions;
                    const allQuestions = currentQuestions?.[activePracticeTab] || [];
                    const totalPages = Math.ceil(allQuestions.length / 10);
                    const currentPage = practiceQuestionPages[activePracticeTab] || 1;
                    
                    if (totalPages <= 1) return null;
                    
                    return (
                      <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-sm text-gray-600 dark:text-gray-400 mr-4">
                          Page {currentPage} of {totalPages} ({allQuestions.length} questions)
                        </span>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                          <button
                            key={pageNum}
                            onClick={() => setPracticeQuestionPages(prev => ({ ...prev, [activePracticeTab]: pageNum }))}
                            className={`w-8 h-8 rounded-full text-sm font-medium transition-all duration-200 ${
                              currentPage === pageNum
                                ? 'bg-blue-500 text-white shadow-md'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {pageNum}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                  

                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/30 rounded-2xl p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Ready to Practice?</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    Generate comprehensive practice questions categorized by marks to test your understanding and prepare for exams.
                  </p>
                  <Button 
                    onClick={() => handleGenerate('categorized')} 
                    isLoading={generating === 'categorized'}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg px-8 py-3"
                  >
                    🚀 Generate Practice Questions
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      case 'mcq':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <Button onClick={() => setIsQuizModalOpen(true)} isLoading={generating === 'quiz'}>
                Generate New MCQ Quiz
              </Button>
            </div>
            
            <div className="p-4 sm:p-6">
              <div className="space-y-3">
                {(() => {
                  if (quizzes.length === 0) {
                    return <p className='text-sm text-gray-600 dark:text-gray-400'>No MCQ quizzes generated for this note yet.</p>;
                  }
                  
                  const quizzesPerPage = 5;
                  const startIndex = (quizPage - 1) * quizzesPerPage;
                  const endIndex = startIndex + quizzesPerPage;
                  const quizzesToShow = quizzes.slice(startIndex, endIndex);
                  
                  return quizzesToShow.map(quiz => (
                    <div key={quiz._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div className="flex-grow">
                            <span className="font-medium break-words text-gray-800 dark:text-gray-200">{quiz.title}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm text-gray-500 dark:text-gray-400">{quiz.questionCount} MCQs</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                              <Button onClick={() => router.push(`/study-room?quizId=${quiz._id}`)} variant="secondary">Host</Button>
                              <Button onClick={() => router.push(`/quiz/${quiz._id}`)}>Solo</Button>
                              <Button 
                                  variant="secondary" 
                                  size="sm" 
                                  className="text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50 px-3"
                                  onClick={() => handleDeleteQuizClick(quiz)}
                              >
                                <FiTrash2 />
                              </Button>
                          </div>
                        </div>
                    </div>
                  ));
                })()}
              </div>
              
              {/* Quiz Pagination */}
              {(() => {
                const totalPages = Math.ceil(quizzes.length / 5);
                if (totalPages <= 1) return null;
                
                return (
                  <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400 mr-4">
                      Page {quizPage} of {totalPages} ({quizzes.length} quizzes)
                    </span>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                      <button
                        key={pageNum}
                        onClick={() => setQuizPage(pageNum)}
                        className={`w-8 h-8 rounded-full text-sm font-medium transition-all duration-200 ${
                          quizPage === pageNum
                            ? 'bg-blue-500 text-white shadow-md'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        );
      case 'mindmap':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Content Mind Map</h2>
                {note.mindMap && (
                  <Button 
                    onClick={() => handleGenerate('mindmap')} 
                    isLoading={generating === 'mindmap'}
                    variant="secondary"
                    size="sm"
                  >
                    🔄 Regenerate
                  </Button>
                )}
              </div>
            </div>
            
            {note.mindMap ? (
              <div className="p-4 sm:p-6">
                <MindMap data={note.mindMap} />
              </div>
            ) : (
              <div className="p-4 sm:p-6">
                <Button onClick={() => handleGenerate('mindmap')} isLoading={generating === 'mindmap'}>
                  Generate Mind Map
                </Button>
              </div>
            )}
          </div>
        );
      case 'chat':
        return <ChatInterface noteId={noteId as string} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()} 
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
          aria-label="Go back"
        >
          <FiArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold truncate">{note.title}</h1>
      </div>
      
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
          <TabButton tabName="summary" label="Summary" icon={FiFileText} />
          <TabButton tabName="flashcards" label="Flashcards" icon={FiClipboard} />
          <TabButton tabName="practice" label="Practice Questions" icon={FiHelpCircle} />
          <TabButton tabName="mcq" label="MCQ Quizzes" icon={FiEdit} />
          <TabButton tabName="mindmap" label="Mind Map" icon={FiShare2} />
          <TabButton 
            tabName="chat" 
            label="Doubt Solver" 
            icon={FiMessageSquare} 
            disabled={note.embeddingStatus !== 'completed'}
          />
        </nav>
      </div>

      <div className="mt-6">
        {renderContent()}
      </div>

      <GenerateQuizModal
        isOpen={isQuizModalOpen}
        onClose={() => setIsQuizModalOpen(false)}
        onGenerate={handleGenerateQuiz}
        isLoading={generating === 'quiz'}
      />

      {selectedQuiz && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={confirmDeleteQuiz}
          isLoading={isDeleting}
          itemName={`quiz "${selectedQuiz.title}"`}
        />
      )}
    </div>
  );
}