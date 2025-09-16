'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { sanitizeHTML } from '@/utils/sanitizer';
import { formatCodeContent, containsCode, containsSteps, getCodeStyles } from '@/utils/codeFormatter';
import Button from '@/components/ui/Button';
import Flashcard from '@/components/notes/Flashcard';
import Spinner from '@/components/ui/Spinner';

import { FiFileText, FiClipboard, FiHelpCircle, FiEdit, FiArrowLeft, FiTrash2, FiShare2, FiMessageSquare, FiEye, FiX, FiChevronLeft, FiChevronRight, FiDownload } from 'react-icons/fi';
import { useScrollSticky } from '@/hooks/useScrollSticky';
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
const PracticeQuestionCard = ({ question, index, activePracticeTab, questionCategories, onPin, isPinned, allQuestions, currentIndex, sectionType }: {
  question: ICategorizedQuestion & { _id?: string; isPinned?: boolean };
  index: number;
  activePracticeTab: string;
  questionCategories: { key: string; label: string; }[];
  onPin: (questionId: string, marker: string) => void;
  isPinned?: boolean;
  allQuestions?: ICategorizedQuestion[];
  currentIndex?: number;
  sectionType?: 'theory' | 'practical';
}) => {
  const [showViewer, setShowViewer] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(currentIndex || 0);
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Debug logging
  useEffect(() => {
    if (showViewer) {
      console.log('Practice Question Popup Debug:', {
        activePracticeTab,
        allQuestions: allQuestions?.length || 0,
        currentIndex,
        viewerIndex
      });
    }
  }, [showViewer, activePracticeTab, allQuestions, currentIndex, viewerIndex]);
  
  // Keyboard navigation
  useEffect(() => {
    if (showViewer) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [showViewer]);
  
  useEffect(() => {
    if (!showViewer) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowViewer(false);
      } else if (e.key === 'ArrowRight' && allQuestions && viewerIndex < allQuestions.length - 1) {
        nextQuestion();
      } else if (e.key === 'ArrowLeft' && viewerIndex > 0) {
        prevQuestion();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showViewer, viewerIndex, allQuestions]);
  
  const nextQuestion = () => {
    if (allQuestions && viewerIndex < allQuestions.length - 1 && !isTransitioning) {
      setIsTransitioning(true);
      setViewerIndex(viewerIndex + 1);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  const prevQuestion = () => {
    if (viewerIndex > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setViewerIndex(viewerIndex - 1);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };



  // Calculate dynamic height based on content
  const calculateHeight = () => {
    const currentQuestion = allQuestions?.[viewerIndex] || question;
    const totalLength = currentQuestion.question.length + currentQuestion.answer.length;
    
    if (totalLength < 200) return '75vh';
    if (totalLength < 500) return '75vh';
    if (totalLength < 1000) return '80vh';
    if (totalLength < 2000) return '85vh';
    return '90vh';
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isTransitioning) return;
    const touch = e.touches[0];
    (e.currentTarget as any).startX = touch.clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || isTransitioning) return;
    const touch = e.touches[0];
    const startX = (e.currentTarget as any).startX;
    const diffX = startX - touch.clientX;
    
    // Limit drag to prevent going beyond bounds
    const maxDrag = window.innerWidth * 0.3;
    const limitedDiffX = Math.max(-maxDrag, Math.min(maxDrag, -diffX));
    setTranslateX(limitedDiffX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging || isTransitioning) return;
    
    const touch = e.changedTouches[0];
    const startX = (e.currentTarget as any).startX;
    const diffX = startX - touch.clientX;
    
    setIsDragging(false);
    setTranslateX(0);
    
    if (Math.abs(diffX) > 80) {
      if (diffX > 0 && allQuestions && viewerIndex < allQuestions.length - 1) {
        nextQuestion();
      } else if (diffX < 0 && viewerIndex > 0) {
        prevQuestion();
      }
    }
  };
  
  return (
    <>
      <div className={`glass-card rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-500 group hover:scale-105`}>
        <div className="relative p-6">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {isPinned && <span className="text-2xl animate-pulse">📌</span>}
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                      Question {index + 1}
                    </span>
                    <span className={`glass-card px-3 py-1 rounded-full text-xs font-bold ${
                      activePracticeTab === 'oneMarker' ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300' :
                      activePracticeTab === 'threeMarker' ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 text-yellow-700 dark:text-yellow-300' :
                      activePracticeTab === 'fourMarker' ? 'bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30 text-orange-700 dark:text-orange-300' :
                      'bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 text-red-700 dark:text-red-300'
                    }`}>
                      {questionCategories.find(c => c.key === activePracticeTab)?.label}
                    </span>
                  </div>
                  <button
                    onClick={() => onPin(question._id || `${index}`, activePracticeTab)}
                    className={`p-2 glass-card rounded-xl transition-all duration-300 hover:scale-110 ${
                      isPinned ? 'text-yellow-500 hover:text-yellow-600 shadow-lg' : 'text-gray-400 hover:text-gray-600'
                    }`}
                    title={isPinned ? 'Unpin question' : 'Pin question'}
                  >
                    📌
                  </button>
                </div>
                <div className="font-bold text-gray-900 dark:text-gray-100 leading-relaxed mb-4 text-lg max-h-32 overflow-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                  {containsCode(question.question, sectionType) ? (
                    <div dangerouslySetInnerHTML={{ __html: formatCodeContent(question.question, sectionType) }} />
                  ) : (
                    question.question
                  )}
                </div>
              
                <div className="mt-6">
                  <button
                    onClick={() => {
                      setShowViewer(true);
                      setTimeout(() => {
                        const contentDiv = document.querySelector('.question-viewer-content');
                        if (contentDiv) contentDiv.scrollTop = 0;
                        
                        // Scroll popup header to center of viewport
                        const popupElement = document.querySelector('.question-popup');
                        if (popupElement) {
                          popupElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }, 300);
                    }}
                    className="center-content gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-2xl font-medium transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    <FiEye className="w-4 h-4" />
                    <span>View Answer</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Question Viewer */}
      {showViewer && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-white dark:bg-gray-800 flex flex-col overflow-hidden question-popup" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999, width: '100vw', height: '100dvh', minHeight: '100dvh' }}>
            {/* Header - Always Show */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-indigo-600">
              <div className="flex justify-between items-center p-4">
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium text-white">
                    {allQuestions && allQuestions.length > 0 ? `${viewerIndex + 1} of ${allQuestions.length}` : '1 of 1'}
                  </span>
                  <div className="flex gap-2 md:hidden">
                    <button
                      onClick={prevQuestion}
                      disabled={!allQuestions || allQuestions.length <= 1 || viewerIndex === 0}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <FiChevronLeft className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={nextQuestion}
                      disabled={!allQuestions || allQuestions.length <= 1 || viewerIndex === allQuestions.length - 1}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <FiChevronRight className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setShowViewer(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <FiX className="w-6 h-6 text-white" />
                </button>
              </div>
              <div className="px-4 pb-3">
                <span className="text-sm font-medium text-white/80">Q & A</span>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 bg-white dark:bg-gray-800 overflow-y-auto question-viewer-content p-6">
              <div className="max-w-none space-y-8">
                {/* Question */}
                <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-l-4 border-blue-500">
                  <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-4">QUESTION</h3>
                  <div className="text-gray-800 dark:text-gray-200 leading-relaxed text-base overflow-auto whitespace-pre-wrap break-words" style={{ WebkitOverflowScrolling: 'touch', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    {containsCode(allQuestions?.[viewerIndex]?.question || question.question, sectionType) ? (
                      <div dangerouslySetInnerHTML={{ __html: formatCodeContent(allQuestions?.[viewerIndex]?.question || question.question, sectionType) }} />
                    ) : (
                      <p className="text-base leading-7">{allQuestions?.[viewerIndex]?.question || question.question}</p>
                    )}
                  </div>
                </div>
                
                {/* Answer */}
                <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border-l-4 border-green-500">
                  <h3 className="text-lg font-bold text-green-600 dark:text-green-400 mb-4">ANSWER</h3>
                  <div className="prose dark:prose-invert prose-base max-w-none text-gray-800 dark:text-gray-200 overflow-auto whitespace-pre-wrap break-words" style={{ WebkitOverflowScrolling: 'touch', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    {(containsCode(allQuestions?.[viewerIndex]?.answer || question.answer, sectionType) || containsSteps(allQuestions?.[viewerIndex]?.answer || question.answer)) ? (
                      <div dangerouslySetInnerHTML={{ __html: formatCodeContent(allQuestions?.[viewerIndex]?.answer || question.answer, sectionType) }} />
                    ) : (
                      <div className="text-base leading-7" dangerouslySetInnerHTML={{ __html: allQuestions?.[viewerIndex]?.answer || question.answer }} />
                    )}
                  </div>
                </div>
              </div>
              
              {/* Desktop Navigation - Always Show */}
              <div className="hidden md:flex justify-center gap-4 p-6 mt-8 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={prevQuestion}
                  disabled={!allQuestions || allQuestions.length <= 1 || viewerIndex === 0}
                  className="px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base font-medium"
                >
                  Previous
                </button>
                <button
                  onClick={nextQuestion}
                  disabled={!allQuestions || allQuestions.length <= 1 || viewerIndex === allQuestions.length - 1}
                  className="px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base font-medium"
                >
                  Next
                </button>
              </div>
            </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default function NoteDetailPage() {
  const { id: noteId } = useParams();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const isNotesScrolled = useScrollSticky(200);
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
  const [pinnedQuestions, setPinnedQuestions] = useState<any[]>([]);

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
      
      // Fetch pinned questions for this note's subject
      if (noteRes.data.subject) {
        try {
          const pinnedRes = await api.get(`/pinned-questions/${noteRes.data.subject}`);
          console.log('Fetched pinned questions:', pinnedRes.data.pinnedQuestions);
          setPinnedQuestions(pinnedRes.data.pinnedQuestions || []);
        } catch (error) {
          console.error('Failed to fetch pinned questions:', error);
          setPinnedQuestions([]);
        }
      }
      
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
  
  // Force re-render when pinned questions change
  useEffect(() => {
    // This will trigger a re-render and re-sort
  }, [pinnedQuestions]);
  

  
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
          payload = { markers: options.markers, type: activePracticeType };
        } else {
          endpoint = `/ai/categorized-questions/${noteId}`;
          payload = { type: activePracticeType };
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

  const handlePinQuestion = async (questionId: string, marker: string) => {
    const questionIndex = parseInt(questionId);
    const isPinned = pinnedQuestions.some(pin => 
      pin.questionIndex === questionIndex && pin.category === marker
    );
    
    try {
      if (isPinned) {
        await api.post('/pinned-questions/unpin', {
          subjectId: note?.subject,
          questionIndex,
          category: marker
        });
        setPinnedQuestions(prev => prev.filter(pin => 
          !(pin.questionIndex === questionIndex && pin.category === marker)
        ));
      } else {
        await api.post('/pinned-questions/pin', {
          subjectId: note?.subject,
          questionIndex,
          category: marker
        });
        setPinnedQuestions(prev => [...prev, {
          questionIndex,
          category: marker,
          subjectId: note?.subject
        }]);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to toggle pin');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-full"><Spinner /></div>;
  if (!note) return <p>Note not found.</p>;

  const TabButton = ({ tabName, label, icon: Icon, disabled = false }: { tabName: ActiveTab; label: string; icon: React.ElementType; disabled?: boolean }) => (
    <button
      onClick={() => {
        setActiveTab(tabName);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
      disabled={disabled}
      className={`flex items-center gap-1 md:gap-2 whitespace-nowrap py-3 md:py-3 px-4 md:px-4 rounded-lg md:rounded-xl font-medium text-sm md:text-sm transition-all duration-300 ${
        activeTab === tabName
          ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
          : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <Icon className="w-5 h-5 md:w-5 md:h-5 flex-shrink-0" />
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden text-sm">{label.split(' ')[0]}</span>
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
          <div className="bg-white dark:bg-gray-800 p-3 md:p-4 lg:p-6 rounded-lg shadow-md card-hover">
            {note.summary ? (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <h3 className="text-lg font-semibold">Summary</h3>
                  <Button 
                    onClick={() => handleGenerate('summary')} 
                    isLoading={generating === 'summary'}
                    variant="secondary"
                    size="sm"
                    className="w-full sm:w-auto"
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
              <div className="text-center">
                <Button onClick={() => handleGenerate('summary')} isLoading={generating === 'summary'} className="w-full sm:w-auto">
                  Generate Summary
                </Button>
              </div>
            )}
          </div>
        );
      case 'flashcards':
        return (
          <div className="space-y-6">
            {note.flashcards ? (
              <>
                {/* AI-Style Header */}
                <div className="glass-card rounded-2xl p-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/10"></div>
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 glass-card rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
                        <span className="text-xl">🃏</span>
                      </div>
                      <div>
                        <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Flashcards</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Interactive cards for quick knowledge review</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Theory/Practical Sections */}
                {((note.flashcards as any).theory || (note.flashcards as any).practical) && (
                  <div className="glass-card rounded-2xl p-1 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5"></div>
                    <div className="relative z-10 flex gap-1">
                      {[
                        { key: 'theory', label: 'Theory', icon: '📚', gradient: 'from-blue-500 to-indigo-500' },
                        { key: 'practical', label: 'Practical', icon: '⚡', gradient: 'from-indigo-500 to-purple-500' }
                      ].map(tab => {
                        const count = (note.flashcards as any)[tab.key]?.length || 0;
                        return (
                          <button
                            key={tab.key}
                            onClick={() => setActiveFlashcardType(tab.key)}
                            className={`flex-1 p-3 rounded-xl transition-all duration-300 hover:scale-105 ${
                              activeFlashcardType === tab.key 
                                ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg` 
                                : 'glass-card hover:bg-white/50 dark:hover:bg-gray-800/50'
                            }`}
                          >
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-lg">{tab.icon}</span>
                              <div>
                                <div className="font-bold text-sm">{tab.label}</div>
                                <div className={`text-xs ${activeFlashcardType === tab.key ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                                  {count} Cards
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Flashcards Grid */}
                <div className="glass-card rounded-2xl p-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5"></div>
                  <div className="relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(() => {
                        const allFlashcards = (note.flashcards as any)[activeFlashcardType] || [];
                        const currentPage = flashcardPages[activeFlashcardType] || 1;
                        const cardsPerPage = 6;
                        const startIndex = (currentPage - 1) * cardsPerPage;
                        const endIndex = startIndex + cardsPerPage;
                        const cardsToShow = allFlashcards.slice(startIndex, endIndex);
                        
                        if (cardsToShow.length === 0) {
                          return (
                            <div className="col-span-full text-center py-12">
                              <div className="w-16 h-16 glass-card rounded-2xl flex items-center justify-center mx-auto mb-4 bg-gradient-to-br from-gray-500/20 to-gray-600/20">
                                <span className="text-2xl">🃏</span>
                              </div>
                              <p className="text-gray-500 dark:text-gray-400">No {activeFlashcardType} flashcards found</p>
                            </div>
                          );
                        }
                        
                        return cardsToShow.map((fc: any, index: number) => {
                          if (!fc || !fc.question || !fc.answer) return null;
                          return (
                            <Flashcard 
                              key={`${activeFlashcardType}-${startIndex + index}`} 
                              flashcard={fc} 
                              allFlashcards={allFlashcards}
                              currentIndex={startIndex + index}
                              sectionType={activeFlashcardType as 'theory' | 'practical'}
                            />
                          );
                        }).filter(Boolean);
                      })()
                      }
                    </div>
                    
                    {/* Modern Pagination */}
                    {(() => {
                      const allFlashcards = (note.flashcards as any)[activeFlashcardType] || [];
                      const totalPages = Math.ceil(allFlashcards.length / 6);
                      const currentPage = flashcardPages[activeFlashcardType] || 1;
                      
                      if (totalPages <= 1) return null;
                      
                      return (
                        <div className="flex justify-center items-center gap-3 mt-8 pt-6 border-t border-white/20 dark:border-gray-700/50">
                          <span className="glass-card px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Page {currentPage} of {totalPages}
                          </span>
                          <div className="flex gap-2">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                              <button
                                key={pageNum}
                                onClick={() => setFlashcardPages(prev => ({ ...prev, [activeFlashcardType]: pageNum }))}
                                className={`w-10 h-10 rounded-xl text-sm font-bold transition-all duration-300 hover:scale-110 ${
                                  currentPage === pageNum
                                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                                    : 'glass-card hover:bg-white/50 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-300'
                                }`}
                              >
                                {pageNum}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                    
                    {/* Generate More Button */}
                    <div className="text-center mt-8">
                      {(() => {
                        const hasTheoryPractical = (note.flashcards as any).theory !== undefined || (note.flashcards as any).practical !== undefined;
                        const currentCards = (note.flashcards as any)[activeFlashcardType] || [];
                        const allGenerated = (note.flashcards as any).allGenerated?.[activeFlashcardType] || [];
                        const displayedCount = (note.flashcards as any).displayedCount?.[activeFlashcardType] || 0;
                        const hasMoreInDB = allGenerated.length > displayedCount;
                        
                        if (hasTheoryPractical) {
                          return (
                            <Button 
                              onClick={() => handleGenerate('flashcards', { flashcardType: activeFlashcardType })} 
                              isLoading={generating === 'flashcards'}
                              className="modern-button bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-2xl px-8 py-3 hover:scale-105 transition-all duration-300"
                            >
                              {hasMoreInDB ? 'Load More' : 'Generate More'} {activeFlashcardType === 'theory' ? 'Theory' : 'Practical'} Flashcards
                            </Button>
                          );
                        } else {
                          return (
                            <Button 
                              onClick={() => handleGenerate('flashcards')} 
                              isLoading={generating === 'flashcards'}
                              className="modern-button bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-2xl px-8 py-3 hover:scale-105 transition-all duration-300"
                            >
                              Get More Flashcards
                            </Button>
                          );
                        }
                      })()
                      }
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="glass-card rounded-2xl p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/10"></div>
                <div className="relative z-10">
                  <div className="w-16 h-16 glass-card rounded-2xl flex items-center justify-center mx-auto mb-4 bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
                    <span className="text-2xl">🃏</span>
                  </div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">Create Flashcards</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto text-sm">
                    Generate interactive flashcards to help you memorize key concepts and facts.
                  </p>
                  <Button 
                    onClick={() => handleGenerate('flashcards')} 
                    isLoading={generating === 'flashcards'}
                    className="modern-button bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-6 py-3 rounded-xl hover:scale-105 transition-all duration-300 shadow-xl"
                  >
                    🎆 Generate Flashcards
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      case 'practice':
        return (
          <div className="space-y-6">
            {note.categorizedQuestions && Object.keys(note.categorizedQuestions).length > 0 ? (
              <>
                {/* AI-Style Header */}
                <div className="glass-card rounded-2xl p-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10"></div>
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 glass-card rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                        <span className="text-xl">🎯</span>
                      </div>
                      <div>
                        <h2 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Practice Questions</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Master your knowledge with AI-generated practice questions</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="glass-card px-3 py-1 rounded-full">
                        <span className="text-xs font-medium bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                          {(note.categorizedQuestions as any).theory ? 
                            Object.values((note.categorizedQuestions as any).theory).reduce((total: number, arr: any) => total + (arr?.length || 0), 0) +
                            Object.values((note.categorizedQuestions as any).practical || {}).reduce((total: number, arr: any) => total + (arr?.length || 0), 0)
                          : Object.values(note.categorizedQuestions).reduce((total: number, arr: any) => total + (Array.isArray(arr) ? arr.length : 0), 0)} Total Questions
                        </span>
                      </div>
                      
                      <Button
                        onClick={async () => {
                          try {
                            const formatChoice = confirm('Choose download format:\n\nOK = PDF (Professional)\nCancel = Word Document (Editable)');
                            const format = formatChoice ? 'pdf' : 'word';
                            
                            toast.loading('Generating exam from uploaded notes...');
                            
                            // Call backend to generate exam directly from note content
                            const response = await api.post(`/ai/generate-exam/${noteId}`, {
                              totalMarks: 70,
                              duration: 3,
                              distribution: {
                                oneMarker: 10,
                                threeMarker: 6,
                                fourMarker: 4,
                                fiveMarker: 4
                              }
                            });
                            
                            const { generateQuickExam } = await import('@/utils/examGenerator');
                            await generateQuickExam(response.data.questions, note.title, format);
                            
                            toast.dismiss();
                            toast.success(`Exam paper generated as ${format.toUpperCase()} from uploaded notes!`);
                          } catch (error: any) {
                            toast.dismiss();
                            console.error('Exam generation failed:', error);
                            toast.error(error.response?.data?.message || 'Failed to generate exam paper.');
                          }
                        }}
                        disabled={!note.textContent}
                        className="modern-button bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl px-4 py-2 text-sm hover:scale-105 transition-all duration-300"
                      >
                        <FiDownload className="w-3 h-3 mr-1" />
                        Generate Exam from Notes
                      </Button>
                      
                      {(() => {
                        const currentQuestions = (note.categorizedQuestions as any).theory ? 
                          (note.categorizedQuestions as any)[activePracticeType] :
                          note.categorizedQuestions;
                        const allGenerated = (note.categorizedQuestions as any).allGenerated?.[activePracticeTab] || [];
                        const displayed = currentQuestions?.[activePracticeTab]?.length || 0;
                        const hasMore = allGenerated.length > displayed;
                        const markerValue = activePracticeTab === 'oneMarker' ? '1' : 
                                          activePracticeTab === 'threeMarker' ? '3' : 
                                          activePracticeTab === 'fourMarker' ? '4' : 
                                          activePracticeTab === 'fiveMarker' ? '5' : '1';
                        
                        return (
                          <Button 
                            onClick={() => handleGenerate('categorized', { markers: markerValue })}
                            isLoading={generating === `categorized-${markerValue}`}
                            className="modern-button bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl px-4 py-2 text-sm hover:scale-105 transition-all duration-300"
                          >
                            {hasMore ? '+ More' : '+ Generate'} {activePracticeTab.replace('Marker', ' Marker')}
                          </Button>
                        );
                      })()
                      }
                    </div>
                  </div>
                </div>

                {/* Theory/Practical Sections */}
                {((note.categorizedQuestions as any).theory || (note.categorizedQuestions as any).practical) && (
                  <div className="glass-card rounded-2xl p-1 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5"></div>
                    <div className="relative z-10 flex gap-1">
                      {[
                        { key: 'theory', label: 'Theory', icon: '📚', gradient: 'from-blue-500 to-indigo-500' },
                        { key: 'practical', label: 'Practical', icon: '⚡', gradient: 'from-purple-500 to-pink-500' }
                      ].filter(tab => {
                        const tabData = (note.categorizedQuestions as any)[tab.key];
                        return tabData && Object.keys(tabData).length > 0;
                      }).map(tab => {
                        const count = Object.values((note.categorizedQuestions as any)[tab.key] || {}).reduce((total: number, arr: any) => total + (Array.isArray(arr) ? arr.length : 0), 0);
                        return (
                          <button
                            key={tab.key}
                            onClick={() => setActivePracticeType(tab.key)}
                            className={`flex-1 p-3 rounded-xl transition-all duration-300 hover:scale-105 ${
                              activePracticeType === tab.key 
                                ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg` 
                                : 'glass-card hover:bg-white/50 dark:hover:bg-gray-800/50'
                            }`}
                          >
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-lg">{tab.icon}</span>
                              <div>
                                <div className="font-bold text-sm">{tab.label}</div>
                                <div className={`text-xs ${activePracticeType === tab.key ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                                  {count} Questions
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Marker Categories Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {questionCategories.map(tab => {
                    const currentQuestions = (note.categorizedQuestions as any).theory ? 
                      (note.categorizedQuestions as any)[activePracticeType] :
                      note.categorizedQuestions;
                    const count = currentQuestions?.[tab.key]?.length || 0;
                    const gradients = {
                      'oneMarker': 'from-green-500 to-emerald-500',
                      'threeMarker': 'from-yellow-500 to-orange-500', 
                      'fourMarker': 'from-orange-500 to-red-500',
                      'fiveMarker': 'from-red-500 to-pink-500'
                    };
                    const icons = {
                      'oneMarker': '🟢',
                      'threeMarker': '🟡',
                      'fourMarker': '🟠', 
                      'fiveMarker': '🔴'
                    };
                    
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActivePracticeTab(tab.key)}
                        className={`glass-card p-4 rounded-xl transition-all duration-300 hover:scale-105 relative overflow-hidden ${
                          activePracticeTab === tab.key ? 'ring-2 ring-indigo-500 shadow-xl' : ''
                        }`}
                      >
                        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${gradients[tab.key as keyof typeof gradients]}`}></div>
                        <div className="text-center">
                          <div className="text-xl mb-1">{icons[tab.key as keyof typeof icons]}</div>
                          <div className="font-bold text-sm text-gray-900 dark:text-gray-100">{tab.label}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{count} Questions</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Questions Display */}
                <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5"></div>
                  <div className="relative z-10">
                    <div className="mb-6">
                      <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        {questionCategories.find(c => c.key === activePracticeTab)?.label} Questions
                        {((note.categorizedQuestions as any).theory || (note.categorizedQuestions as any).practical) && (
                          <span className="ml-2 text-sm font-normal text-gray-500">({activePracticeType})</span>
                        )}
                      </h3>
                    </div>
                    
                    <div className="space-y-6" key={`${activePracticeTab}-${pinnedQuestions.length}`}>
                      {(() => {
                        const currentQuestions = (note.categorizedQuestions as any).theory ? 
                          (note.categorizedQuestions as any)[activePracticeType] :
                          note.categorizedQuestions;
                        const allQuestions = currentQuestions?.[activePracticeTab] || [];
                        const currentPage = practiceQuestionPages[activePracticeTab] || 1;
                        const questionsPerPage = 5;
                        const startIndex = (currentPage - 1) * questionsPerPage;
                        const endIndex = startIndex + questionsPerPage;
                        const questionsToShow = allQuestions.slice(startIndex, endIndex);
                        
                        if (questionsToShow.length === 0) {
                          return (
                            <div className="text-center py-12">
                              <div className="w-16 h-16 glass-card rounded-2xl flex items-center justify-center mx-auto mb-4 bg-gradient-to-br from-gray-500/20 to-gray-600/20">
                                <span className="text-2xl">📝</span>
                              </div>
                              <p className="text-gray-500 dark:text-gray-400">No questions available for {activePracticeTab}</p>
                            </div>
                          );
                        }
                        
                        const sortedQuestions = questionsToShow.sort((a, b) => {
                          const aIndex = allQuestions.indexOf(a);
                          const bIndex = allQuestions.indexOf(b);
                          const aPinned = pinnedQuestions.some(pin => 
                            pin.questionIndex === aIndex && pin.category === activePracticeTab
                          );
                          const bPinned = pinnedQuestions.some(pin => 
                            pin.questionIndex === bIndex && pin.category === activePracticeTab
                          );
                          if (aPinned && !bPinned) return -1;
                          if (!aPinned && bPinned) return 1;
                          return 0;
                        });
                        
                        return sortedQuestions.map((q: any, index: number) => {
                          const questionIndex = allQuestions.indexOf(q);
                          const isPinned = pinnedQuestions.some(pin => 
                            pin.questionIndex === questionIndex && pin.category === activePracticeTab
                          );
                          return (
                            <PracticeQuestionCard 
                              key={`${activePracticeTab}-${questionIndex}-${isPinned}`} 
                              question={{...q, _id: questionIndex.toString()}} 
                              index={index} 
                              activePracticeTab={activePracticeTab}
                              questionCategories={questionCategories}
                              onPin={handlePinQuestion}
                              isPinned={isPinned}
                              allQuestions={allQuestions}
                              currentIndex={questionIndex}
                              sectionType={activePracticeType as 'theory' | 'practical'}
                            />
                          );
                        });
                      })()}
                    </div>
                    
                    {/* Modern Pagination */}
                    {(() => {
                      const currentQuestions = (note.categorizedQuestions as any).theory ? 
                        (note.categorizedQuestions as any)[activePracticeType] :
                        note.categorizedQuestions;
                      const allQuestions = currentQuestions?.[activePracticeTab] || [];
                      const totalPages = Math.ceil(allQuestions.length / 5);
                      const currentPage = practiceQuestionPages[activePracticeTab] || 1;
                      
                      if (totalPages <= 1) return null;
                      
                      return (
                        <div className="flex justify-center items-center gap-3 mt-8 pt-6 border-t border-white/20 dark:border-gray-700/50">
                          <span className="glass-card px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            Page {currentPage} of {totalPages}
                          </span>
                          <div className="flex gap-2">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                              <button
                                key={pageNum}
                                onClick={() => setPracticeQuestionPages(prev => ({ ...prev, [activePracticeTab]: pageNum }))}
                                className={`w-10 h-10 rounded-xl text-sm font-bold transition-all duration-300 hover:scale-110 ${
                                  currentPage === pageNum
                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                                    : 'glass-card hover:bg-white/50 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-300'
                                }`}
                              >
                                {pageNum}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </>
            ) : (
              <div className="glass-card rounded-3xl p-12 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10"></div>
                <div className="relative z-10">
                  <div className="w-24 h-24 glass-card rounded-3xl flex items-center justify-center mx-auto mb-6 bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                    <span className="text-4xl">🎯</span>
                  </div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">Ready to Practice?</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto text-lg">
                    Generate comprehensive practice questions categorized by marks to test your understanding and prepare for exams.
                  </p>
                  <Button 
                    onClick={() => handleGenerate('categorized')} 
                    isLoading={generating === 'categorized'}
                    className="modern-button bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white text-lg px-8 py-4 rounded-2xl hover:scale-105 transition-all duration-300 shadow-xl"
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
            <div className="p-3 md:p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700">
              <Button onClick={() => setIsQuizModalOpen(true)} isLoading={generating === 'quiz'} className="w-full sm:w-auto">
                Generate New MCQ Quiz
              </Button>
            </div>
            
            <div className="p-3 md:p-4 lg:p-6">
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
                    <div key={quiz._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 md:p-4">
                        <div className="flex flex-col gap-3">
                          <div className="flex-grow">
                            <span className="font-medium break-words text-gray-800 dark:text-gray-200 text-sm md:text-base">{quiz.title}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400">{quiz.questionCount} MCQs</span>
                            </div>
                          </div>
                          <div className="button-group">
                              <Button onClick={() => router.push(`/study-room?quizId=${quiz._id}`)} variant="secondary" size="sm" className="flex-1 sm:flex-none">Host</Button>
                              <Button onClick={() => router.push(`/quiz/${quiz._id}`)} size="sm" className="flex-1 sm:flex-none">Solo</Button>
                              <Button 
                                  variant="secondary" 
                                  size="sm" 
                                  className="text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50 px-3 flex-shrink-0"
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
            <div className="p-3 md:p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h2 className="text-xl md:text-2xl font-semibold">Content Mind Map</h2>
                {note.mindMap && (
                  <Button 
                    onClick={() => handleGenerate('mindmap')} 
                    isLoading={generating === 'mindmap'}
                    variant="secondary"
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    🔄 Regenerate
                  </Button>
                )}
              </div>
            </div>
            
            {note.mindMap ? (
              <div className="p-3 md:p-4 lg:p-6">
                <MindMap data={note.mindMap} />
              </div>
            ) : (
              <div className="p-3 md:p-4 lg:p-6 text-center">
                <Button onClick={() => handleGenerate('mindmap')} isLoading={generating === 'mindmap'} className="w-full sm:w-auto">
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
    <>
      <style dangerouslySetInnerHTML={{ __html: getCodeStyles() }} />
      <div className="space-y-4 md:space-y-8 page-transition mobile-content">
      <div className="glass-card p-4 md:p-6 rounded-2xl md:rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-xl float"></div>
        <div className="relative z-10 flex items-center gap-3 md:gap-4">
          <button 
            onClick={() => router.push('/subjects')} 
            className="p-2 md:p-3 rounded-xl md:rounded-2xl hover:bg-white/20 dark:hover:bg-gray-800/50 transition-all duration-300 backdrop-blur-sm flex-shrink-0"
            aria-label="Go back"
          >
            <FiArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent truncate">{note.title}</h1>
            <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm mt-1">AI-Enhanced Study Material</p>
          </div>
        </div>
      </div>
      
      <div className={`notes-sticky-nav ${isNotesScrolled ? 'scrolled' : ''}`}>
        <div className="glass-card rounded-2xl p-2 mx-0">
          <nav className="scrollable-tabs" aria-label="Tabs">
            <div className="flex space-x-2 min-w-max px-2">
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
            </div>
          </nav>
        </div>
      </div>

      <div>
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
    </>
  );
}