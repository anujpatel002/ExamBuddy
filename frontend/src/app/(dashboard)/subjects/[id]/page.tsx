'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { sanitizeHTML } from '@/utils/sanitizer';
import { formatCodeContent, containsCode, containsSteps } from '@/utils/codeFormatter';
import NoteCard from '@/components/notes/NoteCard';
import UploadNoteModal from '@/components/notes/UploadNoteModal';
import Button from '@/components/ui/Button';
import { FiArrowLeft, FiEdit, FiTrash2, FiCheckSquare, FiX, FiBook, FiTarget, FiCalendar, FiColumns, FiEye, FiBookmark, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';
import EditModal from '@/components/ui/EditModal';
import Link from 'next/link';
import SkeletonCard from '@/components/ui/SkeletonCard';

interface Note { _id: string; title: string; createdAt: string; status: 'approved' | 'pending'; }
interface Subject { _id: string; name: string; questionBank: any[]; studyPlan?: any }

// Q-Bank Question Card Component
const QBankQuestionCard = ({ question, index, subjectId, category, type, isPinned, onPinToggle, allQuestions, currentIndex }: { 
  question: any; 
  index: number; 
  subjectId: string; 
  category: string; 
  type?: string; 
  isPinned?: boolean;
  onPinToggle?: (pinned: boolean) => void;
  allQuestions?: any[];
  currentIndex?: number;
}) => {
  const [showViewer, setShowViewer] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(currentIndex || 0);
  const [isToggling, setIsToggling] = useState(false);
  
  const handlePinToggle = async () => {
    if (!onPinToggle) return;
    
    setIsToggling(true);
    try {
      const endpoint = isPinned ? '/pinned-questions/unpin' : '/pinned-questions/pin';
      await api.post(endpoint, {
        subjectId,
        questionIndex: index,
        category,
        type
      });
      onPinToggle(!isPinned);
      toast.success(isPinned ? 'Question unpinned' : 'Question pinned');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to toggle pin');
    } finally {
      setIsToggling(false);
    }
  };
  
  const nextQuestion = () => {
    if (allQuestions && viewerIndex < allQuestions.length - 1) {
      setViewerIndex(viewerIndex + 1);
    }
  };

  const prevQuestion = () => {
    if (viewerIndex > 0) {
      setViewerIndex(viewerIndex - 1);
    }
  };
  
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
  
  return (
    <div className={`glass-card rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-500 group hover:scale-105 ${showViewer ? 'shadow-2xl' : ''}`}>
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
                    category === 'oneMarker' ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300' :
                    category === 'threeMarker' ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 text-yellow-700 dark:text-yellow-300' :
                    category === 'fourMarker' ? 'bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30 text-orange-700 dark:text-orange-300' :
                    'bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 text-red-700 dark:text-red-300'
                  }`}>
                    {category.replace('Marker', ' Marker')}
                  </span>
                </div>
                <button
                  onClick={handlePinToggle}
                  disabled={isToggling}
                  className={`p-2 glass-card rounded-xl transition-all duration-300 hover:scale-110 ${
                    isPinned ? 'text-yellow-500 hover:text-yellow-600 shadow-lg' : 'text-gray-400 hover:text-gray-600'
                  } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={isPinned ? 'Unpin question' : 'Pin question'}
                >
                  {isToggling ? '⏳' : '📌'}
                </button>
              </div>
              <div className="font-bold text-gray-900 dark:text-gray-100 leading-relaxed mb-4 text-lg">
                {containsCode(question.question, type as 'theory' | 'practical') ? (
                  <div dangerouslySetInnerHTML={{ __html: formatCodeContent(question.question, type as 'theory' | 'practical') }} />
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
                  <div className="text-gray-800 dark:text-gray-200 leading-relaxed text-base overflow-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {containsCode(allQuestions?.[viewerIndex]?.question || question.question, type as 'theory' | 'practical') ? (
                      <div dangerouslySetInnerHTML={{ __html: formatCodeContent(allQuestions?.[viewerIndex]?.question || question.question, type as 'theory' | 'practical') }} />
                    ) : (
                      <p className="text-base leading-7">{allQuestions?.[viewerIndex]?.question || question.question}</p>
                    )}
                  </div>
                </div>
                
                {/* Answer */}
                <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border-l-4 border-green-500">
                  <h3 className="text-lg font-bold text-green-600 dark:text-green-400 mb-4">ANSWER</h3>
                  <div className="prose dark:prose-invert prose-base max-w-none text-gray-800 dark:text-gray-200 overflow-auto whitespace-pre-wrap break-words" style={{ WebkitOverflowScrolling: 'touch', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    {(containsCode(allQuestions?.[viewerIndex]?.answer || question.answer, type as 'theory' | 'practical') || containsSteps(allQuestions?.[viewerIndex]?.answer || question.answer)) ? (
                      <div dangerouslySetInnerHTML={{ __html: formatCodeContent(allQuestions?.[viewerIndex]?.answer || question.answer, type as 'theory' | 'practical') }} />
                    ) : (
                      <div className="text-base leading-7" dangerouslySetInnerHTML={{ __html: sanitizeHTML(allQuestions?.[viewerIndex]?.answer || question.answer) }} />
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
    </div>
  );
};

export default function SubjectDetailPage() {
  const { id: subjectId } = useParams();
  const router = useRouter();
  const { limits, checkFeatureAccess, getUpgradeMessage } = usePlanLimits();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeTab, setActiveTab] = useState('notes');
  const [studyPlan, setStudyPlan] = useState<any>(null);
  const [comparison, setComparison] = useState<any>(null);
  const [selectedNotesForCompare, setSelectedNotesForCompare] = useState<string[]>([]);
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [noteToManage, setNoteToManage] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [activeQBankTab, setActiveQBankTab] = useState('oneMarker');
  const [activeQBankType, setActiveQBankType] = useState('theory');
  const [qbankProgress, setQbankProgress] = useState({ message: '', progress: 0 });
  const [subjectQuizzes, setSubjectQuizzes] = useState<any[]>([]);
  const [pinnedQuestions, setPinnedQuestions] = useState<any[]>([]);

  const fetchSubjectDetails = async () => {
    if (!subjectId) return;
    setIsLoading(true);
    try {
      const { data } = await api.get(`/subjects/${subjectId}`);
      console.log('Subject data:', data.subject);
      console.log('Question bank:', data.subject.questionBank);
      setSubject(data.subject);
      setNotes(data.notes);
      setStudyPlan(data.subject.studyPlan || null);
      
      // Fetch subject-level quizzes
      const quizRes = await api.get('/quizzes/my');
      const allSubjectQuizzes = quizRes.data.filter((quiz: any) => quiz.subject?._id === subjectId);
      setSubjectQuizzes(allSubjectQuizzes);
      
      // Fetch pinned questions for this subject
      const pinnedRes = await api.get(`/pinned-questions/${subjectId}`);
      setPinnedQuestions(pinnedRes.data.pinnedQuestions);
    } catch (error) {
      toast.error('Failed to fetch subject details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjectDetails();
    
    // Socket connection for progress updates
    if (typeof window !== 'undefined') {
      import('socket.io-client').then(({ io }) => {
        const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001', {
          auth: { token: localStorage.getItem('token') }
        });
        
        socket.on('qbank-progress', (data) => {
          setQbankProgress(data);
        });
        
        return () => socket.disconnect();
      });
    }
  }, [subjectId]);
  


  useEffect(() => {
    if (subject?.questionBank) {
      if (subject.questionBank.theory) {
        setActiveQBankType('theory');
      }
    }
  }, [subject?.questionBank]);

  const handleSelectNote = (noteId: string) => {
    setSelectedNotes(prev =>
      prev.includes(noteId)
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    );
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedNotes([]);
  };

  const handleEditClick = (note: Note) => {
    setNoteToManage(note);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (note?: Note) => {
    if (note) {
      setNoteToManage(note);
    } else {
      setNoteToManage(null);
    }
    setDeleteModalOpen(true);
  };
  
  const confirmDelete = async () => {
    setIsSubmitting(true);
    try {
      if (noteToManage) {
        await api.delete(`/notes/${noteToManage._id}`);
        toast.success(`Note "${noteToManage.title}" deleted.`);
      } else {
        await api.delete('/notes', { data: { ids: selectedNotes } });
        toast.success(`${selectedNotes.length} notes deleted.`);
      }
      fetchSubjectDetails();
    } catch (error) {
      toast.error('Failed to delete.');
    } finally {
      setIsSubmitting(false);
      setDeleteModalOpen(false);
      setIsSelectionMode(false);
      setSelectedNotes([]);
      setNoteToManage(null);
    }
  };

  const handleSaveChanges = async (newTitle: string) => {
    if (!noteToManage) return;
    setIsSubmitting(true);
    try {
      await api.put(`/notes/${noteToManage._id}`, { title: newTitle });
      toast.success('Note updated!');
      fetchSubjectDetails();
    } catch (error) {
      toast.error('Failed to update note.');
    } finally {
      setIsSubmitting(false);
      setEditModalOpen(false);
      setNoteToManage(null);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 page-transition">
      <div className="glass-card p-6 rounded-3xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-xl float"></div>
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.replace('/subjects')} className="p-3 rounded-2xl hover:bg-white/20 dark:hover:bg-gray-800/50 transition-all duration-300 backdrop-blur-sm">
              <FiArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold theme-text-primary">{subject?.name}</h1>
              <p className="theme-text-secondary text-sm mt-1">Subject Dashboard</p>
            </div>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            {activeTab === 'notes' && notes.length > 0 && (
              <button onClick={toggleSelectionMode} className="btn-modern px-4 py-2 text-sm">
                {isSelectionMode ? <FiX className="mr-2"/> : <FiCheckSquare className="mr-2"/>}
                {isSelectionMode ? 'Cancel' : 'Select'}
              </button>
            )}
            {activeTab === 'notes' && (
              <button onClick={() => setUploadModalOpen(true)} className="btn-modern px-6 py-2 text-sm">
                Upload Note
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-2 mb-8">
        <nav className="flex space-x-2 overflow-x-auto scrollbar-hide">
          <button onClick={() => setActiveTab('notes')} className={`flex items-center gap-2 whitespace-nowrap py-3 px-4 rounded-xl font-medium text-sm transition-all duration-300 flex-shrink-0 ${activeTab === 'notes' ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg' : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50'}`}>
            <FiBook className="w-4 h-4" /> Notes
          </button>
          <button onClick={() => setActiveTab('qbank')} className={`flex items-center gap-2 whitespace-nowrap py-3 px-4 rounded-xl font-medium text-sm transition-all duration-300 flex-shrink-0 ${activeTab === 'qbank' ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg' : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50'}`}>
            <FiTarget className="w-4 h-4" /> Q-Bank
          </button>
          <button onClick={() => setActiveTab('studyplan')} className={`flex items-center gap-2 whitespace-nowrap py-3 px-4 rounded-xl font-medium text-sm transition-all duration-300 flex-shrink-0 ${activeTab === 'studyplan' ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg' : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50'}`}>
            <FiCalendar className="w-4 h-4" /> Plan
          </button>
          <button onClick={() => setActiveTab('compare')} className={`flex items-center gap-2 whitespace-nowrap py-3 px-4 rounded-xl font-medium text-sm transition-all duration-300 flex-shrink-0 ${activeTab === 'compare' ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg' : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50'}`}>
            <FiColumns className="w-4 h-4" /> Compare
          </button>
          <button onClick={() => setActiveTab('mcq')} className={`flex items-center gap-2 whitespace-nowrap py-3 px-4 rounded-xl font-medium text-sm transition-all duration-300 flex-shrink-0 ${activeTab === 'mcq' ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg' : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50'}`}>
            <FiEdit className="w-4 h-4" /> MCQ
          </button>
          <button onClick={() => setActiveTab('examcreator')} className={`flex items-center gap-2 whitespace-nowrap py-3 px-4 rounded-xl font-medium text-sm transition-all duration-300 flex-shrink-0 ${activeTab === 'examcreator' ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg' : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50'}`}>
            🎯 Exam
          </button>
          <button onClick={() => setActiveTab('pinned')} className={`flex items-center gap-2 whitespace-nowrap py-3 px-4 rounded-xl font-medium text-sm transition-all duration-300 flex-shrink-0 ${activeTab === 'pinned' ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg' : 'text-slate-800 dark:text-slate-200 hover:bg-white/50 dark:hover:bg-gray-800/50'}`}>
            📌 Pinned
            {pinnedQuestions.length > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'pinned' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300'}`}>
                {pinnedQuestions.length}
              </span>
            )}
          </button>
          <button onClick={() => toast('🚀 Feature coming soon!')} className="flex items-center gap-2 whitespace-nowrap py-3 px-4 rounded-xl font-medium text-sm transition-all duration-300 flex-shrink-0 text-slate-800 dark:text-slate-200 hover:bg-white/50 dark:hover:bg-gray-800/50">
            🤖 NotebookLM
          </button>
        </nav>
      </div>

      {activeTab === 'notes' && (
        <>
          {isSelectionMode && selectedNotes.length > 0 && (
            <div className="mb-6 glass-card p-6 rounded-2xl bg-gradient-to-r from-red-50/50 to-pink-50/50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200/50 dark:border-red-700/50">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <span className="font-bold text-lg text-red-700 dark:text-red-300">{selectedNotes.length} note(s) selected</span>
                <button onClick={() => handleDeleteClick()} className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                  <FiTrash2 className="mr-2"/> Delete Selected
                </button>
              </div>
            </div>
          )}
          
          {notes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {notes.map((note, index) => (
                <div key={note._id} className={`stagger-item relative glass-card rounded-2xl flex flex-col transition-all duration-500 select-none group ${isSelectionMode ? 'cursor-pointer' : 'hover:scale-105 cursor-pointer'} ${selectedNotes.includes(note._id) ? 'ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : ''}`} style={{animationDelay: `${index * 0.1}s`}} onClick={() => isSelectionMode ? handleSelectNote(note._id) : router.push(`/notes/${note._id}`)}>
                  {isSelectionMode ? (
                    <div className="p-6 flex-grow relative overflow-hidden">
                      <div className="absolute top-4 right-4 z-20">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 shadow-lg ${
                          selectedNotes.includes(note._id) 
                            ? 'bg-blue-500 border-blue-500 shadow-blue-200 dark:shadow-blue-900' 
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-gray-200 dark:shadow-gray-800'
                        }`}>
                          {selectedNotes.includes(note._id) ? (
                            <FiCheckSquare className="w-5 h-5 text-white" />
                          ) : (
                            <div className="w-3 h-3 rounded-full border border-gray-400 dark:border-gray-500"></div>
                          )}
                        </div>
                      </div>
                      <NoteCard note={note} />
                    </div>
                  ) : (
                    <Link href={`/notes/${note._id}`} className="p-6 flex-grow block relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="relative z-10">
                        <NoteCard note={note} />
                      </div>
                    </Link>
                  )}
                  
                  {!isSelectionMode && (
                    <div className="flex items-center gap-3 p-6 pt-0 border-t border-white/20 dark:border-gray-700/50">
                      <div className="ml-auto flex gap-2">
                        <button className="p-2 bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-600/50 rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditClick(note); }}><FiEdit /></button>
                        <button className="p-2 bg-red-50/50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-700/50 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-300 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteClick(note); }}><FiTrash2 /></button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-12 rounded-3xl text-center">
              <div className="relative inline-block mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-xl opacity-20 animate-pulse"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                  <FiBook className="h-10 w-10 text-white" />
                </div>
              </div>
              <h3 className="text-3xl font-bold mb-4 theme-text-primary">No notes yet</h3>
              <p className="theme-text-secondary text-lg mb-8 max-w-md mx-auto">Upload your first note to start building your AI-powered study materials.</p>
            </div>
          )}
        </>
      )}

      {activeTab === 'qbank' && (
        <div className="space-y-6">
          {subject?.questionBank && (
            (subject.questionBank.oneMarker?.length > 0 || subject.questionBank.threeMarker?.length > 0 || subject.questionBank.fourMarker?.length > 0 || subject.questionBank.fiveMarker?.length > 0) ||
            (subject.questionBank.theory || subject.questionBank.practical)
          ) ? (
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
                      <h2 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">AI-Curated Question Bank</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Comprehensive questions from all uploaded notes</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="glass-card px-3 py-1 rounded-full">
                      <span className="text-xs font-medium bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        {subject.questionBank ? (
                          (subject.questionBank.theory || subject.questionBank.practical) ? 
                            Object.values(subject.questionBank.theory || {}).reduce((total: number, arr: any) => total + (arr?.length || 0), 0) +
                            Object.values(subject.questionBank.practical || {}).reduce((total: number, arr: any) => total + (arr?.length || 0), 0)
                          : Object.values(subject.questionBank).reduce((total: number, arr: any) => total + (arr?.length || 0), 0)
                        ) : 0} Total Questions
                      </span>
                    </div>
                    
                    <Button 
                      onClick={async () => {
                        setIsGeneratingMore(true);
                        try {
                          const { data } = await api.post(`/question-bank/${subjectId}/generate-more`, { 
                            category: activeQBankTab,
                            type: (subject?.questionBank?.theory || subject?.questionBank?.practical) ? activeQBankType : undefined
                          });
                          
                          const message = data.fromDatabase 
                            ? `Retrieved ${data.questions.length} ${activeQBankTab} questions from database`
                            : `Generated ${data.questions.length} new ${activeQBankTab} questions`;
                          
                          toast.success(message);
                          
                          setSubject(prev => {
                            if (!prev) return prev;
                            const updated = { ...prev };
                            if (!updated.questionBank) updated.questionBank = {};
                            
                            if (updated.questionBank.theory || updated.questionBank.practical) {
                              if (!updated.questionBank[activeQBankType]) updated.questionBank[activeQBankType] = {};
                              updated.questionBank[activeQBankType][activeQBankTab] = data.questions;
                            } else {
                              updated.questionBank[activeQBankTab] = data.questions;
                            }
                            
                            return updated;
                          });
                        } catch (error: any) {
                          toast.error(error.response?.data?.message || 'Failed to load questions.');
                        } finally {
                          setIsGeneratingMore(false);
                        }
                      }}
                      isLoading={isGeneratingMore}
                      className="modern-button bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl px-4 py-2 text-sm hover:scale-105 transition-all duration-300"
                    >
                      {isGeneratingMore ? 'Loading...' : '+ More'} {activeQBankTab.replace('Marker', ' Marker')}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Theory/Practical Sections */}
              {(subject.questionBank.theory || subject.questionBank.practical) && (
                <div className="glass-card rounded-2xl p-1 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5"></div>
                  <div className="relative z-10 flex gap-1">
                    {[
                      { key: 'theory', label: 'Theory', icon: '📚', gradient: 'from-blue-500 to-indigo-500' },
                      { key: 'practical', label: 'Practical', icon: '⚡', gradient: 'from-purple-500 to-pink-500' }
                    ].filter(tab => {
                      const tabData = subject.questionBank[tab.key];
                      return tabData && Object.keys(tabData).length > 0;
                    }).map(tab => {
                      const count = Object.values(subject.questionBank[tab.key] || {}).reduce((total: number, arr: any) => total + (Array.isArray(arr) ? arr.length : 0), 0);
                      return (
                        <button
                          key={tab.key}
                          onClick={() => setActiveQBankType(tab.key)}
                          className={`flex-1 p-3 rounded-xl transition-all duration-300 hover:scale-105 ${
                            activeQBankType === tab.key 
                              ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg` 
                              : 'glass-card hover:bg-white/50 dark:hover:bg-gray-800/50'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-lg">{tab.icon}</span>
                            <div>
                              <div className="font-bold text-sm">{tab.label}</div>
                              <div className={`text-xs ${activeQBankType === tab.key ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
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
                {[
                  { key: 'oneMarker', label: '1 Marker' },
                  { key: 'threeMarker', label: '3 Marker' },
                  { key: 'fourMarker', label: '4 Marker' },
                  { key: 'fiveMarker', label: '5 Marker' }
                ].filter(tab => {
                  const currentBank = (subject.questionBank.theory || subject.questionBank.practical) ? subject.questionBank[activeQBankType] : subject.questionBank;
                  return currentBank && currentBank[tab.key]?.length > 0;
                }).map(tab => {
                  const currentBank = (subject.questionBank.theory || subject.questionBank.practical) ? subject.questionBank[activeQBankType] : subject.questionBank;
                  const count = currentBank?.[tab.key]?.length || 0;
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
                      onClick={() => setActiveQBankTab(tab.key)}
                      className={`glass-card p-4 rounded-xl transition-all duration-300 hover:scale-105 relative overflow-hidden ${
                        activeQBankTab === tab.key ? 'ring-2 ring-indigo-500 shadow-xl' : ''
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
                      {activeQBankTab.replace('Marker', ' Marker')} Questions
                      {(subject.questionBank.theory || subject.questionBank.practical) && (
                        <span className="ml-2 text-sm font-normal text-gray-500">({activeQBankType})</span>
                      )}
                    </h3>
                  </div>
                  
                  <div className="space-y-6">
                    {(() => {
                      const currentBank = (subject.questionBank.theory || subject.questionBank.practical) ? subject.questionBank[activeQBankType] : subject.questionBank;
                      return currentBank?.[activeQBankTab]?.map((q: any, index: number) => {
                        const isPinned = pinnedQuestions.some(
                          pin => pin.questionIndex === index && 
                                 pin.category === activeQBankTab && 
                                 pin.type === ((subject.questionBank.theory || subject.questionBank.practical) ? activeQBankType : undefined)
                        );
                        
                        return (
                          <QBankQuestionCard 
                            key={index} 
                            question={q} 
                            index={index}
                            subjectId={subjectId as string}
                            category={activeQBankTab}
                            type={(subject.questionBank.theory || subject.questionBank.practical) ? activeQBankType : undefined}
                            isPinned={isPinned}
                            allQuestions={currentBank?.[activeQBankTab]}
                            currentIndex={index}
                            onPinToggle={(pinned) => {
                              if (pinned) {
                                setPinnedQuestions(prev => [...prev, {
                                  subjectId,
                                  questionIndex: index,
                                  category: activeQBankTab,
                                  type: (subject.questionBank.theory || subject.questionBank.practical) ? activeQBankType : undefined,
                                  questionData: q
                                }]);
                              } else {
                                setPinnedQuestions(prev => prev.filter(
                                  pin => !(pin.questionIndex === index && 
                                           pin.category === activeQBankTab && 
                                           pin.type === ((subject.questionBank.theory || subject.questionBank.practical) ? activeQBankType : undefined))
                                ));
                              }
                            }}
                          />
                        );
                      });
                    })()}
                  </div>
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
                <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">Generate Your Question Bank</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto text-lg">
                  Analyze all notes in this subject to generate comprehensive questions with unit combinations for better exam preparation.
                </p>
                <Button 
                  onClick={async () => {
                    setIsSubmitting(true);
                    setQbankProgress({ message: 'Starting...', progress: 0 });
                    try {
                      await api.post(`/question-bank/${subjectId}`);
                      toast.success('Question Bank generated successfully!');
                      await fetchSubjectDetails();
                    } catch (error: any) {
                      toast.error(error.response?.data?.message || 'Failed to generate Question Bank.');
                    } finally {
                      setIsSubmitting(false);
                      setQbankProgress({ message: '', progress: 0 });
                    }
                  }} 
                  isLoading={isSubmitting}
                  className="modern-button bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white text-lg px-8 py-4 rounded-2xl hover:scale-105 transition-all duration-300 shadow-xl"
                >
                  {isSubmitting ? `${qbankProgress.message} (${qbankProgress.progress}%)` : '🚀 Generate Question Bank'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'studyplan' && (
        <div className="glass-card p-6 md:p-8 rounded-3xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
            <h2 className="text-xl md:text-2xl font-semibold">AI Study Plan</h2>
            {studyPlan && (
              <Button 
                onClick={async () => {
                  setIsSubmitting(true);
                  try {
                    const { data } = await api.post(`/ai/study-plan/${subjectId}`);
                    setStudyPlan(data.studyPlan);
                    toast.success('Study plan regenerated successfully!');
                    fetchSubjectDetails();
                  } catch (error: any) {
                    toast.error(error.response?.data?.message || 'Failed to regenerate study plan.');
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                variant="secondary"
                size="sm"
                isLoading={isSubmitting}
                className="w-full sm:w-auto"
              >
                🔄 Regenerate
              </Button>
            )}
          </div>
          {studyPlan ? (
            <div className="space-y-4">
              {studyPlan.weeks?.map((week: any, index: number) => (
                <div key={index} className="border dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2">Week {week.week}: {week.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-3">{week.description}</p>
                  <div className="space-y-2">
                    <h4 className="font-medium">Topics to Cover:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {week.topics?.map((topic: string, i: number) => (
                        <li key={i} className="text-sm text-gray-600 dark:text-gray-400">{topic}</li>
                      ))}
                    </ul>
                  </div>
                  {week.activities && (
                    <div className="mt-3">
                      <h4 className="font-medium">Recommended Activities:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {week.activities.map((activity: string, i: number) => (
                          <li key={i} className="text-sm text-gray-600 dark:text-gray-400">{activity}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : notes.length >= 2 ? (
            <div className="text-center py-12">
              <FiCalendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-xl font-semibold">Generate Your Study Plan</h3>
              <p className="mt-1 text-sm text-gray-500 mb-4">AI will analyze all your notes to create a personalized revision schedule.</p>
              <Button 
                onClick={async () => {
                  setIsSubmitting(true);
                  try {
                    const { data } = await api.post(`/ai/study-plan/${subjectId}`);
                    setStudyPlan(data.studyPlan);
                    toast.success('Study plan generated successfully!');
                    fetchSubjectDetails();
                  } catch (error: any) {
                    toast.error(error.response?.data?.message || 'Failed to generate study plan.');
                  } finally {
                    setIsSubmitting(false);
                  }
                }} 
                isLoading={isSubmitting}
              >
                Generate Study Plan
              </Button>
            </div>
          ) : (
            <div className="text-center py-12">
              <FiCalendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-xl font-semibold">Upload More Notes</h3>
              <p className="mt-1 text-sm text-gray-500">You need at least 2 notes to generate a comprehensive study plan.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'compare' && (
        <div className="glass-card p-6 md:p-8 rounded-3xl">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">Compare Concepts</h2>
          {comparison ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{comparison.title}</h3>
                <Button onClick={() => setComparison(null)} variant="secondary" size="sm">
                  New Comparison
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <th className="border border-gray-300 dark:border-gray-600 p-3 text-left">Aspect</th>
                      <th className="border border-gray-300 dark:border-gray-600 p-3 text-left">{comparison.concept1}</th>
                      <th className="border border-gray-300 dark:border-gray-600 p-3 text-left">{comparison.concept2}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.comparisons?.map((row: any, index: number) => (
                      <tr key={index}>
                        <td className="border border-gray-300 dark:border-gray-600 p-3 font-medium">{row.aspect}</td>
                        <td className="border border-gray-300 dark:border-gray-600 p-3">{row.value1}</td>
                        <td className="border border-gray-300 dark:border-gray-600 p-3">{row.value2}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : notes.length >= 2 ? (
            <div>
              <p className="mb-4 text-gray-600 dark:text-gray-300">Select two notes to compare their concepts:</p>
              <div className="space-y-3 mb-6">
                {notes.map(note => (
                  <div key={note._id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={note._id}
                      checked={selectedNotesForCompare.includes(note._id)}
                      onChange={(e) => {
                        if (e.target.checked && selectedNotesForCompare.length < 2) {
                          setSelectedNotesForCompare([...selectedNotesForCompare, note._id]);
                        } else if (!e.target.checked) {
                          setSelectedNotesForCompare(selectedNotesForCompare.filter(id => id !== note._id));
                        }
                      }}
                      disabled={!selectedNotesForCompare.includes(note._id) && selectedNotesForCompare.length >= 2}
                      className="mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor={note._id} className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {note.title}
                    </label>
                  </div>
                ))}
              </div>
              {selectedNotesForCompare.length === 2 && (
                <Button 
                  onClick={async () => {
                    if (!checkFeatureAccess('compareNotes')) {
                      toast.error(getUpgradeMessage('compareNotes'));
                      return;
                    }
                    setIsSubmitting(true);
                    try {
                      const { data } = await api.post('/ai/compare-concepts', {
                        noteIds: selectedNotesForCompare
                      });
                      setComparison(data.comparison);
                      toast.success('Concept comparison generated successfully!');
                    } catch (error: any) {
                      toast.error(error.response?.data?.message || 'Failed to generate comparison.');
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  isLoading={isSubmitting}
                  disabled={!checkFeatureAccess('compareNotes')}
                >
                  Compare Concepts
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <FiColumns className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-xl font-semibold">Upload More Notes</h3>
              <p className="mt-1 text-sm text-gray-500">You need at least 2 notes to compare concepts.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'mcq' && (
        <div className="glass-card rounded-3xl overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">MCQ Quiz Generator</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Generate MCQ quizzes from all notes in this subject</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 sm:p-6">
            {notes.length > 0 ? (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/30 rounded-2xl p-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiEdit className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 text-center">Generate Subject Quiz</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto text-center">
                    Create comprehensive MCQ quizzes using content from all {notes.length} notes in this subject.
                  </p>
                  
                  <div className="max-w-md mx-auto space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Quiz Name</label>
                      <input 
                        type="text" 
                        id="quizName"
                        placeholder={`${subject?.name} Quiz`}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Number of Questions</label>
                      <select 
                        id="questionCount"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md text-gray-900 dark:text-gray-100"
                      >
                        <option value="10">10 Questions</option>
                        <option value="15">15 Questions</option>
                        <option value="20">20 Questions</option>
                        <option value="25">25 Questions</option>
                        <option value="30">30 Questions</option>
                      </select>
                    </div>
                    <Button 
                      onClick={async () => {
                        const quizName = (document.getElementById('quizName') as HTMLInputElement).value || `${subject?.name} Quiz`;
                        const questionCount = parseInt((document.getElementById('questionCount') as HTMLSelectElement).value);
                        
                        setIsSubmitting(true);
                        try {
                          const response = await api.post(`/ai/subject-quiz/${subjectId}`, { quizName, questionCount });
                          toast.success(`Quiz "${quizName}" generated successfully with ${response.data.quiz.questionCount} questions!`);
                          // Clear form
                          (document.getElementById('quizName') as HTMLInputElement).value = '';
                          (document.getElementById('questionCount') as HTMLSelectElement).value = '10';
                          // Refresh subject quizzes
                          await fetchSubjectDetails();
                        } catch (error: any) {
                          toast.error(error.response?.data?.message || 'Failed to generate quiz.');
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                      isLoading={isSubmitting}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg px-8 py-3"
                    >
                      {isSubmitting ? 'Generating Quiz...' : '🚀 Generate MCQ Quiz'}
                    </Button>
                  </div>
                </div>
                
                {/* Display Subject Quizzes */}
                {subjectQuizzes.length > 0 && (
                  <div className="mt-8">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Subject Quizzes</h4>
                    <div className="space-y-3">
                      {subjectQuizzes.map(quiz => (
                        <div key={quiz._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className="flex-grow">
                              <span className="font-medium break-words text-gray-800 dark:text-gray-200">{quiz.title}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-gray-500 dark:text-gray-400">{quiz.questionCount} MCQs</span>
                                <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-1 rounded-full">Subject Quiz</span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                              <Button onClick={() => router.push(`/study-room?quizId=${quiz._id}`)} variant="secondary">Host</Button>
                              <Button onClick={() => router.push(`/quiz/${quiz._id}`)}>Solo</Button>
                              <Button 
                                variant="secondary" 
                                size="sm" 
                                className="text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50 px-3"
                                onClick={async () => {
                                  if (confirm(`Delete quiz "${quiz.title}"?`)) {
                                    try {
                                      await api.delete(`/quizzes/${quiz._id}`);
                                      toast.success('Quiz deleted successfully!');
                                      await fetchSubjectDetails();
                                    } catch (error) {
                                      toast.error('Failed to delete quiz.');
                                    }
                                  }
                                }}
                              >
                                <FiTrash2 />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <FiEdit className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-xl font-semibold">Upload Notes First</h3>
                <p className="mt-1 text-sm text-gray-500">You need to upload notes to generate MCQ quizzes for this subject.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'examcreator' && (
        <div className="glass-card p-6 md:p-8 rounded-3xl">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">Exam Paper Creator</h2>
          {!checkFeatureAccess('examCreator') && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
              <p className="text-yellow-800 dark:text-yellow-200">{getUpgradeMessage('examCreator')}</p>
            </div>
          )}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Paper Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Total Marks</label>
                  <input type="number" defaultValue="70" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md" id="totalMarks" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Duration (hours)</label>
                  <input type="number" defaultValue="3" step="0.5" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md" id="duration" />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4">Question Distribution</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">1 Mark MCQ</label>
                  <input type="number" defaultValue="10" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md text-sm" id="mcq1" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">3 Mark</label>
                  <input type="number" defaultValue="6" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md text-sm" id="mark3" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">4 Mark</label>
                  <input type="number" defaultValue="4" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md text-sm" id="mark4" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">5 Mark</label>
                  <input type="number" defaultValue="4" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md text-sm" id="mark5" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-4">Bloom's Taxonomy Distribution</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Remember (%):</label>
                <input type="number" defaultValue="20" max="100" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md" id="remember" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Understand (%):</label>
                <input type="number" defaultValue="25" max="100" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md" id="understand" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Apply (%):</label>
                <input type="number" defaultValue="25" max="100" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md" id="apply" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Analyze (%):</label>
                <input type="number" defaultValue="15" max="100" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md" id="analyze" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Evaluate (%):</label>
                <input type="number" defaultValue="10" max="100" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md" id="evaluate" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Create (%):</label>
                <input type="number" defaultValue="5" max="100" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md" id="create" />
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <Button 
              onClick={async () => {
                if (!checkFeatureAccess('examCreator')) {
                  toast.error(getUpgradeMessage('examCreator'));
                  return;
                }
                setIsSubmitting(true);
                try {
                  const config = {
                    totalMarks: parseInt((document.getElementById('totalMarks') as HTMLInputElement).value),
                    duration: parseFloat((document.getElementById('duration') as HTMLInputElement).value),
                    distribution: {
                      mcq1: parseInt((document.getElementById('mcq1') as HTMLInputElement).value),
                      mark3: parseInt((document.getElementById('mark3') as HTMLInputElement).value),
                      mark4: parseInt((document.getElementById('mark4') as HTMLInputElement).value),
                      mark5: parseInt((document.getElementById('mark5') as HTMLInputElement).value)
                    },
                    bloomsTaxonomy: {
                      remember: parseInt((document.getElementById('remember') as HTMLInputElement).value),
                      understand: parseInt((document.getElementById('understand') as HTMLInputElement).value),
                      apply: parseInt((document.getElementById('apply') as HTMLInputElement).value),
                      analyze: parseInt((document.getElementById('analyze') as HTMLInputElement).value),
                      evaluate: parseInt((document.getElementById('evaluate') as HTMLInputElement).value),
                      create: parseInt((document.getElementById('create') as HTMLInputElement).value)
                    }
                  };
                  
                  const { data } = await api.post(`/ai/generate-exam/${subjectId}`, config);
                  
                  // Enhanced exam paper generation with question snapshots
                  const generateExamWithSnapshots = async (format: 'pdf' | 'word') => {
                    try {
                      // Import the exam generator utility
                      const { generateExamPaper } = await import('@/utils/examGenerator');
                      
                      // Parse the generated exam data to extract questions
                      const examConfig = {
                        title: `${subject?.name || 'Subject'} - Final Examination`,
                        subject: subject?.name || 'Subject',
                        duration: `${config.duration} Hours`,
                        totalMarks: config.totalMarks,
                        instructions: [
                          'Read all questions carefully before attempting.',
                          'Answer all questions.',
                          'Write clearly and legibly.',
                          'Manage your time effectively.',
                          'Show all working where applicable.',
                          'MCQ questions carry 1 mark each.',
                          'All questions are compulsory.'
                        ],
                        questions: data.questions || {
                          oneMarker: data.mcqQuestions || [],
                          threeMarker: data.shortQuestions || [],
                          fourMarker: data.mediumQuestions || [],
                          fiveMarker: data.longQuestions || []
                        }
                      };
                      
                      await generateExamPaper(examConfig, format);
                      toast.success(`Professional exam paper generated as ${format.toUpperCase()} with question snapshots!`);
                    } catch (error) {
                      console.error('Enhanced generation failed, falling back to basic:', error);
                      // Fallback to basic generation
                      const examContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${subject?.name || 'Exam'} Paper</title>
    <style>
        body { font-family: 'Times New Roman', serif; margin: 1in; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .exam-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .exam-info { display: flex; justify-content: space-between; margin: 15px 0; }
        .section { margin: 20px 0; }
        .question { margin: 15px 0; page-break-inside: avoid; }
        .mcq-option { margin-left: 20px; }
        h1, h2 { color: #333; }
        .instructions { border: 1px solid #ccc; padding: 15px; margin: 20px 0; background-color: #f9f9f9; }
        .code-block { background-color: #f5f5f5; border: 1px solid #ddd; padding: 10px; font-family: 'Courier New', monospace; }
    </style>
</head>
<body>
    <div class="header">
        <div class="exam-title">${subject?.name || 'SUBJECT'} - FINAL EXAMINATION</div>
        <div class="exam-info">
            <span><strong>Duration:</strong> ${config.duration} Hours</span>
            <span><strong>Total Marks:</strong> ${config.totalMarks}</span>
        </div>
    </div>
    <div class="instructions">
        <h3>Instructions:</h3>
        <ul>
            <li>Read all questions carefully before attempting.</li>
            <li>Answer all questions.</li>
            <li>Write clearly and legibly.</li>
            <li>Manage your time effectively.</li>
            <li>Show all working where applicable.</li>
        </ul>
    </div>
    ${sanitizeHTML(data.examPaper.replace(/\n/g, '<br>'))}
</body>
</html>`;
                      
                      const mimeType = format === 'word' ? 'application/msword' : 'text/html';
                      const extension = format === 'word' ? 'doc' : 'html';
                      
                      const blob = new Blob([examContent], { type: mimeType });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${subject?.name || 'Exam'}_Paper.${extension}`;
                      a.click();
                      window.URL.revokeObjectURL(url);
                      
                      toast.success(`Exam paper downloaded as ${format.toUpperCase()} file!`);
                    }
                  };
                  
                  // Show format selection dialog
                  const formatChoice = confirm('Choose download format:\n\nOK = PDF (Professional with snapshots)\nCancel = Word Document (Editable)');
                  await generateExamWithSnapshots(formatChoice ? 'pdf' : 'word');
                } catch (error: any) {
                  toast.error(error.response?.data?.message || 'Failed to generate exam paper.');
                } finally {
                  setIsSubmitting(false);
                }
              }}
              isLoading={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
              disabled={!checkFeatureAccess('examCreator')}
            >
              📄 Generate Exam Paper
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'pinned' && (
        <div className="glass-card rounded-3xl overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 p-3 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100">Pinned Questions</h3>
                <p className="text-sm text-slate-800 dark:text-slate-200 mt-1">Your saved questions for quick practice</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="glass-card px-3 py-1 rounded-full border text-sm text-slate-900 dark:text-slate-100 w-fit">
                  {pinnedQuestions.length} Pinned Questions
                </span>
                {pinnedQuestions.length > 0 && (
                  <Button 
                    onClick={async () => {
                      if (!confirm('Clear all pinned questions? This action cannot be undone.')) return;
                      
                      try {
                        // Unpin all questions
                        for (const pin of pinnedQuestions) {
                          await api.post('/pinned-questions/unpin', {
                            subjectId: pin.subjectId,
                            questionIndex: pin.questionIndex,
                            category: pin.category,
                            type: pin.type
                          });
                        }
                        setPinnedQuestions([]);
                        toast.success('All pinned questions cleared!');
                      } catch (error: any) {
                        toast.error('Failed to clear pinned questions.');
                      }
                    }}
                    variant="secondary"
                    size="sm"
                    className="text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50"
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="p-3 sm:p-6">
            {pinnedQuestions.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {pinnedQuestions.map((pin, index) => (
                  <div key={`${pin.subjectId}-${pin.questionIndex}-${pin.category}-${pin.type}`} className="border border-yellow-200 dark:border-yellow-700 rounded-lg overflow-hidden">
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 border-b border-yellow-200 dark:border-yellow-700">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">
                          📌 Pinned
                        </span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {pin.category.replace('Marker', ' Marker')} • {pin.type ? pin.type.charAt(0).toUpperCase() + pin.type.slice(1) : 'General'}
                        </span>
                      </div>
                    </div>
                    <div className="p-1">
                      <QBankQuestionCard 
                        question={pin.questionData}
                        index={pin.questionIndex}
                        subjectId={subjectId as string}
                        category={pin.category}
                        type={pin.type}
                        isPinned={true}
                        allQuestions={pinnedQuestions.map(p => p.questionData)}
                        currentIndex={index}
                        onPinToggle={(pinned) => {
                          if (!pinned) {
                            setPinnedQuestions(prev => prev.filter(
                              p => !(p.questionIndex === pin.questionIndex && 
                                     p.category === pin.category && 
                                     p.type === pin.type)
                            ));
                          }
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  📌
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">No Pinned Questions</h3>
                <p className="text-slate-800 dark:text-slate-200 mb-6 max-w-md mx-auto">
                  Pin important questions from the Q-Bank to create your personalized practice collection.
                </p>
                <Button 
                  onClick={() => setActiveTab('qbank')}
                  className="bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700"
                >
                  Go to Q-Bank
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
      
      <UploadNoteModal 
        key={isUploadModalOpen ? 'open' : 'closed'}
        isOpen={isUploadModalOpen} 
        onClose={() => setUploadModalOpen(false)} 
        onNoteUploaded={fetchSubjectDetails} 
        subjectId={subjectId as string}
        currentNoteCount={notes.length}
      />
      
      <DeleteConfirmationModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setDeleteModalOpen(false)} 
        onConfirm={confirmDelete} 
        isLoading={isSubmitting} 
        itemName={noteToManage ? `"${noteToManage.title}"` : `${selectedNotes.length} notes`} 
      />
      
      {noteToManage && (
        <EditModal 
          isOpen={isEditModalOpen} 
          onClose={() => setEditModalOpen(false)} 
          onSave={handleSaveChanges} 
          isLoading={isSubmitting} 
          itemType="Note" 
          initialName={noteToManage.title} 
        />
      )}
    </div>
  );
}