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
import { FiArrowLeft, FiEdit, FiTrash2, FiCheckSquare, FiX, FiBook, FiTarget, FiCalendar, FiColumns } from 'react-icons/fi';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';
import EditModal from '@/components/ui/EditModal';
import Link from 'next/link';
import SkeletonCard from '@/components/ui/SkeletonCard';

interface Note { _id: string; title: string; createdAt: string; status: 'approved' | 'pending'; }
interface Subject { _id: string; name: string; questionBank: any[]; studyPlan?: any }

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

  const fetchSubjectDetails = async () => {
    if (!subjectId) return;
    setIsLoading(true);
    try {
      const { data } = await api.get(`/subjects/${subjectId}`);
      setSubject(data.subject);
      setNotes(data.notes);
      setStudyPlan(data.subject.studyPlan || null);
    } catch (error) {
      toast.error('Failed to fetch subject details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjectDetails();
  }, [subjectId]);

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
          <button onClick={() => setActiveTab('examcreator')} className={`flex items-center gap-2 whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm transition-colors flex-shrink-0 ${activeTab === 'examcreator' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            🎯 Exam
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
                <div key={note._id} className={`relative bg-white dark:bg-gray-800 rounded-lg shadow flex flex-col transition-all ${isSelectionMode ? 'cursor-pointer' : ''} ${selectedNotes.includes(note._id) ? 'ring-2 ring-indigo-500' : ''}`} onClick={() => isSelectionMode ? handleSelectNote(note._id) : router.push(`/notes/${note._id}`)}>
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
                        <Button variant="secondary" size="sm" className="px-3" onClick={() => handleEditClick(note)}><FiEdit /></Button>
                        <Button variant="secondary" size="sm" className="px-3 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50" onClick={() => handleDeleteClick(note)}><FiTrash2 /></Button>
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
        <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 md:p-6 rounded-lg shadow">
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-3 sm:mb-4">AI-Curated Question Bank</h2>
          {subject?.questionBank && subject.questionBank.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {subject.questionBank.sort((a, b) => a.importance - b.importance).map((topicItem: any) => (
                <div key={topicItem.topic} className="border dark:border-gray-700 rounded-lg p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-3">
                    <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-0">{topicItem.topic}</h3>
                    <span className="text-xs sm:text-sm bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded-full self-start">
                      Priority: {topicItem.importance}
                    </span>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    {topicItem.questions.map((q: any, i: number) => (
                      <div key={i} className="border-l-4 border-indigo-500 pl-3 sm:pl-4 bg-gray-50 dark:bg-gray-700/50 rounded-r-lg py-2 sm:py-3">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2 mb-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 self-start">
                            {q.marks} Mark{q.marks > 1 ? 's' : ''}
                          </span>
                          <h4 className="font-medium text-sm sm:text-base flex-1">{q.question}</h4>
                        </div>
                        <div className="prose dark:prose-invert prose-sm sm:prose-base max-w-none mt-2 text-sm sm:text-base overflow-x-auto" dangerouslySetInnerHTML={{ __html: q.answer }} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <FiTarget className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
              <h3 className="mt-2 text-lg sm:text-xl font-semibold">Generate Your Question Bank</h3>
              <p className="mt-1 text-sm text-gray-500 mb-4 px-4">Analyze all notes in this subject to generate a prioritized question bank.</p>
              <Button 
                onClick={async () => {
                  setIsSubmitting(true);
                  try {
                    await api.post(`/question-bank/${subjectId}`);
                    toast.success('Question Bank generated successfully!');
                    fetchSubjectDetails();
                  } catch (error: any) {
                    toast.error(error.response?.data?.message || 'Failed to generate Question Bank.');
                  } finally {
                    setIsSubmitting(false);
                  }
                }} 
                isLoading={isSubmitting}
                className="w-full sm:w-auto"
              >
                Generate Question Bank
              </Button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'studyplan' && (
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">AI Study Plan</h2>
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
                  
                  toast.success('Exam paper generated and downloaded as Word document!');
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
      
      <UploadNoteModal 
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