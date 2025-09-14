'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { sanitizeHTML } from '@/utils/sanitizer';
import NoteCard from '@/components/notes/NoteCard';
import UploadNoteModal from '@/components/notes/UploadNoteModal';
import Button from '@/components/ui/Button';
import { FiArrowLeft, FiEdit, FiTrash2, FiCheckSquare, FiX, FiBook, FiTarget, FiCalendar, FiColumns, FiEye, FiBookmark } from 'react-icons/fi';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';
import EditModal from '@/components/ui/EditModal';
import Link from 'next/link';
import SkeletonCard from '@/components/ui/SkeletonCard';

interface Note { _id: string; title: string; createdAt: string; status: 'approved' | 'pending'; }
interface Subject { _id: string; name: string; questionBank: any[]; studyPlan?: any }

// Q-Bank Question Card Component
const QBankQuestionCard = ({ question, index, subjectId, category, type, isPinned, onPinToggle }: { 
  question: any; 
  index: number; 
  subjectId: string; 
  category: string; 
  type?: string; 
  isPinned?: boolean;
  onPinToggle?: (pinned: boolean) => void;
}) => {
  const [showAnswer, setShowAnswer] = useState(false);
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
  
  return (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-md transition-all duration-300 ${showAnswer ? 'shadow-lg' : ''}`}>
      <div className="bg-gray-50 dark:bg-gray-800/50 p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 whitespace-nowrap">
                Q{index + 1}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 whitespace-nowrap">
                {question.marks}M
              </span>
              {question.source && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                  question.type === 'combination' 
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300'
                }`}>
                  {question.source}
                </span>
              )}
            </div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 leading-relaxed mb-3 break-words overflow-wrap-anywhere word-break-break-word hyphens-auto">{question.question}</h4>
            
            {showAnswer && (
              <div className="mt-4 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-700">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                  <span className="text-sm font-semibold text-green-700 dark:text-green-300">ANSWER</span>
                </div>
                <div className="max-h-96 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                  <div 
                    className="prose dark:prose-invert prose-sm max-w-none text-sm leading-6 sm:leading-7 space-y-2 break-words overflow-wrap-anywhere word-break-break-word hyphens-auto"
                    style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                    dangerouslySetInnerHTML={{ 
                      __html: sanitizeHTML(question.answer)
                        .replace(/\n\n/g, '</p><p class="mt-3">')
                        .replace(/\n/g, '<br>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-gray-100 bg-yellow-100 dark:bg-yellow-900/30 px-1 rounded">$1</strong>')
                        .replace(/^(\d+\.|•|-)\s/gm, '<span class="font-medium text-indigo-600 dark:text-indigo-400">$&</span>')
                    }} 
                  />
                </div>
              </div>
            )}
            
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setShowAnswer(!showAnswer)}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex-1 sm:flex-none ${
                  showAnswer 
                    ? 'bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/50 dark:hover:bg-green-900/70 dark:text-green-300'
                    : 'bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/50 dark:hover:bg-blue-900/70 dark:text-blue-300'
                }`}
              >
                {showAnswer ? '👁️ Hide' : '👀 Show'}
              </button>
              {onPinToggle && (
                <button
                  onClick={handlePinToggle}
                  disabled={isToggling}
                  className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex-1 sm:flex-none ${
                    isPinned
                      ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700 dark:bg-yellow-900/50 dark:hover:bg-yellow-900/70 dark:text-yellow-300'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
                  } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isToggling ? '⏳' : isPinned ? '📌 Pinned' : '📌 Pin'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
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
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-4">
        <div className="flex items-center gap-2 md:gap-4">
          <button onClick={() => router.push('/dashboard')} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <FiArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <h1 className="text-lg md:text-2xl lg:text-3xl font-bold truncate">{subject?.name}</h1>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {activeTab === 'notes' && notes.length > 0 && (
            <Button onClick={toggleSelectionMode} variant="secondary" size="sm" className="flex-1 sm:flex-none">
              {isSelectionMode ? <FiX className="mr-1 md:mr-2"/> : <FiCheckSquare className="mr-1 md:mr-2"/>}
              <span className="hidden sm:inline">{isSelectionMode ? 'Cancel' : 'Select'}</span>
              <span className="sm:hidden">{isSelectionMode ? 'Cancel' : 'Select'}</span>
            </Button>
          )}
          {activeTab === 'notes' && (
            <Button onClick={() => setUploadModalOpen(true)} size="sm" className="flex-1 sm:flex-none">
              <span className="hidden sm:inline">Upload Note</span>
              <span className="sm:hidden">Upload</span>
            </Button>
          )}
        </div>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-2 sm:space-x-4 overflow-x-auto scrollbar-hide pb-2">
          <button onClick={() => setActiveTab('notes')} className={`flex items-center gap-2 whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm transition-colors flex-shrink-0 ${activeTab === 'notes' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <FiBook className="w-4 h-4" /> Notes
          </button>
          <button onClick={() => setActiveTab('qbank')} className={`flex items-center gap-2 whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm transition-colors flex-shrink-0 ${activeTab === 'qbank' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <FiTarget className="w-4 h-4" /> Q-Bank
          </button>
          <button onClick={() => setActiveTab('studyplan')} className={`flex items-center gap-2 whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm transition-colors flex-shrink-0 ${activeTab === 'studyplan' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <FiCalendar className="w-4 h-4" /> Plan
          </button>
          <button onClick={() => setActiveTab('compare')} className={`flex items-center gap-2 whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm transition-colors flex-shrink-0 ${activeTab === 'compare' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <FiColumns className="w-4 h-4" /> Compare
          </button>
          <button onClick={() => setActiveTab('mcq')} className={`flex items-center gap-2 whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm transition-colors flex-shrink-0 ${activeTab === 'mcq' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <FiEdit className="w-4 h-4" /> MCQ
          </button>
          <button onClick={() => setActiveTab('examcreator')} className={`flex items-center gap-2 whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm transition-colors flex-shrink-0 ${activeTab === 'examcreator' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            🎯 Exam
          </button>
          <button onClick={() => setActiveTab('pinned')} className={`flex items-center gap-2 whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm transition-colors flex-shrink-0 ${activeTab === 'pinned' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            📌 Pinned
            {pinnedQuestions.length > 0 && (
              <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 text-xs px-2 py-0.5 rounded-full">
                {pinnedQuestions.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {activeTab === 'notes' && (
        <>
          {isSelectionMode && selectedNotes.length > 0 && (
            <div className="mb-4 md:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-indigo-50 dark:bg-indigo-900/50 p-3 md:p-4 rounded-lg">
              <span className="font-semibold text-sm md:text-base">{selectedNotes.length} note(s) selected</span>
              <Button onClick={() => handleDeleteClick()} className="bg-red-600 hover:bg-red-700 w-full sm:w-auto" size="sm">
                <FiTrash2 className="mr-2"/> Delete Selected
              </Button>
            </div>
          )}
          
          {notes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {notes.map(note => (
                <div key={note._id} className={`relative bg-white dark:bg-gray-800 rounded-lg shadow flex flex-col transition-all select-none ${isSelectionMode ? 'cursor-pointer' : ''} ${selectedNotes.includes(note._id) ? 'ring-2 ring-indigo-500' : ''}`} onClick={() => isSelectionMode ? handleSelectNote(note._id) : router.push(`/notes/${note._id}`)}>
                  {isSelectionMode ? (
                    <div className="p-4 flex-grow">
                      <input type="checkbox" checked={selectedNotes.includes(note._id)} readOnly className="absolute top-4 right-4 h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                      <NoteCard note={note} />
                    </div>
                  ) : (
                    <Link href={`/notes/${note._id}`} className="p-4 flex-grow block">
                      <NoteCard note={note} />
                    </Link>
                  )}
                  
                  {!isSelectionMode && (
                    <div className="flex items-center gap-2 p-4 pt-0 border-t dark:border-gray-700">
                      <div className="ml-auto flex gap-2">
                        <Button variant="secondary" size="sm" className="px-3 sm:hidden" onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/notes/${note._id}`); }}><FiEye /></Button>
                        <Button variant="secondary" size="sm" className="px-3" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditClick(note); }}><FiEdit /></Button>
                        <Button variant="secondary" size="sm" className="px-3 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteClick(note); }}><FiTrash2 /></Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
              <p>No notes uploaded for this subject yet.</p>
            </div>
          )}
        </>
      )}

      {activeTab === 'qbank' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          {subject?.questionBank && (
            (subject.questionBank.oneMarker?.length > 0 || subject.questionBank.threeMarker?.length > 0 || subject.questionBank.fourMarker?.length > 0 || subject.questionBank.fiveMarker?.length > 0) ||
            (subject.questionBank.theory || subject.questionBank.practical)
          ) ? (
            <div>
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-3 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">AI-Curated Question Bank</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Comprehensive questions from all uploaded notes</p>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <span className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full border text-sm text-gray-500 dark:text-gray-400 w-fit">
                      {subject.questionBank ? (
                        (subject.questionBank.theory || subject.questionBank.practical) ? 
                          Object.values(subject.questionBank.theory || {}).reduce((total: number, arr: any) => total + (arr?.length || 0), 0) +
                          Object.values(subject.questionBank.practical || {}).reduce((total: number, arr: any) => total + (arr?.length || 0), 0)
                        : Object.values(subject.questionBank).reduce((total: number, arr: any) => total + (arr?.length || 0), 0)
                      ) : 0} Questions
                    </span>
                    <div className="flex flex-wrap gap-2">
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
                            
                            // Update state directly without refresh
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
                        variant="secondary"
                        size="sm"
                        isLoading={isGeneratingMore}
                        className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                      >
                        {isGeneratingMore ? `Loading...` : `+ More`}
                      </Button>
                      <Button 
                        onClick={async () => {
                          if (!confirm(`Reset all ${activeQBankTab.replace('Marker', ' Marker')} questions? This will clear existing questions and generate fresh ones.`)) return;
                          
                          setIsResetting(true);
                          try {
                            const { data } = await api.post(`/question-bank/${subjectId}/generate-more`, { 
                              category: activeQBankTab,
                              type: (subject?.questionBank?.theory || subject?.questionBank?.practical) ? activeQBankType : undefined,
                              reset: true
                            });
                            
                            toast.success(`Reset and generated ${data.questions.length} fresh ${activeQBankTab} questions!`);
                            
                            // Update state directly without refresh
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
                            toast.error(error.response?.data?.message || 'Failed to reset questions.');
                          } finally {
                            setIsResetting(false);
                          }
                        }}
                        variant="secondary"
                        size="sm"
                        className="text-orange-600 hover:bg-orange-100 dark:text-orange-400 dark:hover:bg-orange-900/50 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                        isLoading={isResetting}
                      >
                        {isResetting ? 'Resetting...' : '🔄'}
                      </Button>
                      <Button 
                        onClick={async () => {
                          if (!confirm('Regenerate entire Question Bank? This will replace all existing questions.')) return;
                          
                          setIsSubmitting(true);
                          setQbankProgress({ message: 'Starting...', progress: 0 });
                          try {
                            await api.post(`/question-bank/${subjectId}`);
                            toast.success('Question Bank regenerated successfully!');
                            await fetchSubjectDetails();
                          } catch (error: any) {
                            toast.error(error.response?.data?.message || 'Failed to regenerate Question Bank.');
                          } finally {
                            setIsSubmitting(false);
                            setQbankProgress({ message: '', progress: 0 });
                          }
                        }}
                        variant="secondary"
                        size="sm"
                        isLoading={isSubmitting}
                        className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                      >
                        {isSubmitting ? `${qbankProgress.message.split(' ')[0]}...` : '🔄 All'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Type Tabs (Theory/Practical) */}
              {(subject.questionBank.theory || subject.questionBank.practical) && (
                <div className="bg-gray-100 dark:bg-gray-700/50 px-4 sm:px-6">
                  <nav className="-mb-px flex space-x-1" aria-label="Type Tabs">
                    {[
                      { key: 'theory', label: 'Theory', icon: '📚' },
                      { key: 'practical', label: 'Practical', icon: '⚡' }
                    ].filter(tab => subject.questionBank[tab.key]).map(tab => {
                      const count = Object.values(subject.questionBank[tab.key] || {}).reduce((total: number, arr: any) => total + (arr?.length || 0), 0);
                      return (
                        <button
                          key={tab.key}
                          onClick={() => setActiveQBankType(tab.key)}
                          className={`${activeQBankType === tab.key 
                            ? 'border-purple-500 text-purple-600 bg-white dark:bg-gray-800' 
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                          } whitespace-nowrap py-2 px-4 border-b-2 font-medium text-sm transition-all duration-200 flex items-center gap-2`}
                        >
                          <span>{tab.icon}</span>
                          {tab.label}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            activeQBankType === tab.key 
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
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActiveQBankTab(tab.key)}
                        className={`${activeQBankTab === tab.key 
                          ? 'border-indigo-500 text-indigo-600 bg-white dark:bg-gray-800' 
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-800/50'
                        } whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm transition-all duration-200 rounded-t-lg flex items-center gap-2`}
                      >
                        <span className={`w-2 h-2 rounded-full ${
                          activeQBankTab === tab.key ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}></span>
                        {tab.label}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          activeQBankTab === tab.key 
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
              <div className="p-3 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
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
          ) : (
            <div className="p-8 text-center">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/30 rounded-2xl p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiTarget className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Generate Your Question Bank</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
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
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg px-8 py-3"
                >
                  {isSubmitting ? `${qbankProgress.message} (${qbankProgress.progress}%)` : '🚀 Generate Question Bank'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'studyplan' && (
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow">
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
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow">
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
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
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow">
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
                  
                  // Create Word document
                  // Show download options
                  const downloadPDF = () => {
                    const examContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Exam Paper</title>
    <style>
        body { font-family: 'Times New Roman', serif; margin: 1in; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin: 20px 0; }
        .question { margin: 15px 0; }
        .mcq-option { margin-left: 20px; }
        h1, h2 { color: #333; }
        .instructions { border: 1px solid #ccc; padding: 15px; margin: 20px 0; background-color: #f9f9f9; }
    </style>
</head>
<body>
    ${sanitizeHTML(data.examPaper.replace(/\n/g, '<br>'))}
</body>
</html>`;
                    
                    const blob = new Blob([examContent], { type: 'text/html' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${subject?.name || 'Exam'}_Paper.html`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                  };
                  
                  const downloadWord = () => {
                    const examContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Exam Paper</title>
    <style>
        body { font-family: 'Times New Roman', serif; margin: 1in; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin: 20px 0; }
        .question { margin: 15px 0; }
        .mcq-option { margin-left: 20px; }
        h1, h2 { color: #333; }
        .instructions { border: 1px solid #ccc; padding: 15px; margin: 20px 0; background-color: #f9f9f9; }
    </style>
</head>
<body>
    ${sanitizeHTML(data.examPaper.replace(/\n/g, '<br>'))}
</body>
</html>`;
                    
                    const blob = new Blob([examContent], { type: 'application/msword' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${subject?.name || 'Exam'}_Paper.doc`;
                    a.click();
                  };
                  
                  // Show options dialog
                  const choice = confirm('Choose download format:\nOK = PDF\nCancel = Word Document');
                  if (choice) {
                    downloadPDF();
                    toast.success('Exam paper downloaded as HTML file!');
                  } else {
                    downloadWord();
                    toast.success('Exam paper downloaded as Word document!');
                  }
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
              🎯 Generate Exam Paper
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'pinned' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 p-3 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">Pinned Questions</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Your saved questions for quick practice</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full border text-sm text-gray-500 dark:text-gray-400 w-fit">
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
                        <span className="text-gray-600 dark:text-gray-400">
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
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No Pinned Questions</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
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