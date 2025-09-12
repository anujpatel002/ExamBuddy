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
import Accordion from '@/components/ui/Accordion';
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
  flashcards?: IFlashcard[];
  categorizedQuestions?: {
    oneMarker?: ICategorizedQuestion[];
    threeMarker?: ICategorizedQuestion[];
    fourMarker?: ICategorizedQuestion[];
    fiveMarker?: ICategorizedQuestion[];
  };
  mindMap?: any;
  embeddingStatus?: 'pending' | 'completed' | 'failed';
}
type ActiveTab = 'summary' | 'flashcards' | 'practice' | 'mcq' | 'mindmap' | 'chat';

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
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<IQuiz | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchNoteAndQuizzes = async () => {
    if (!noteId) return;
    try {
      const noteRes = await api.get(`/notes/${noteId}`);
      setNote(noteRes.data);
      const quizRes = await api.get('/quizzes/my');
      setQuizzes(quizRes.data.filter((quiz: IQuiz) => quiz.note?._id === noteId));
    } catch (error) {
      toast.error('Failed to fetch note details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNoteAndQuizzes();
  }, [noteId]);
  
  const handleGenerate = async (type: 'summary' | 'flashcards' | 'categorized' | 'mindmap', options?: any) => {
    const loadingState = type === 'categorized' && options?.category ? `${type}-${options.category}` : type;
    setGenerating(loadingState);
    
    let endpoint = '';
    let payload = {};

    switch(type) {
      case 'summary': endpoint = `/ai/summarize/${noteId}`; break;
      case 'flashcards': endpoint = `/ai/flashcards/${noteId}`; break;
      case 'mindmap': endpoint = `/ai/mindmap/${noteId}`; break;
      case 'categorized':
        if (options?.category) {
          endpoint = `/ai/more-categorized-questions/${noteId}`;
          payload = { category: options.category };
        } else {
          endpoint = `/ai/categorized-questions/${noteId}`;
        }
        break;
    }
    
    try {
      await api.post(endpoint, payload);
      toast.success(`Content generated successfully!`);
      await fetchNoteAndQuizzes();
      await refreshUser(); // Refresh user data to update credits
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to generate content.`);
    } finally {
      setGenerating('');
    }
  };

  const handleGenerateQuiz = async (quizName: string, questionCount: number) => {
    setGenerating('quiz');
    try {
      await api.post(`/ai/quiz/${noteId}`, { quizName, questionCount });
      toast.success(`Quiz "${quizName}" generated successfully!`);
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
  ].filter(cat => note.categorizedQuestions![cat.key as keyof typeof note.categorizedQuestions]?.length) : [];

  const renderContent = () => {
    switch (activeTab) {
      case 'summary':
        return (
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
            {note.summary ? (
              <div 
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeHTML(note.summary) }} 
              />
            ) : (
              <Button onClick={() => handleGenerate('summary')} isLoading={generating === 'summary'}>Generate Summary</Button>
            )}
          </div>
        );
      case 'flashcards':
        return (
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
            {note.flashcards && note.flashcards.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {note.flashcards.map((fc, index) => <Flashcard key={index} flashcard={fc} />)}
                </div>
                <div className="text-center mt-6">
                  <Button onClick={() => handleGenerate('flashcards')} isLoading={generating === 'flashcards'}>Get More Flashcards</Button>
                </div>
              </>
            ) : (
              <Button onClick={() => handleGenerate('flashcards')} isLoading={generating === 'flashcards'}>Generate Flashcards</Button>
            )}
          </div>
        );
      case 'practice':
        return (
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
            {note.categorizedQuestions && Object.values(note.categorizedQuestions).some(arr => arr && arr.length > 0) ? (
              <div>
                <nav className="-mb-px flex space-x-6 overflow-x-auto border-b border-gray-200 dark:border-gray-700" aria-label="Tabs">
                  {questionCategories.map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActivePracticeTab(tab.key)}
                      className={`${activePracticeTab === tab.key ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
                <div className="mt-4">
                  {note.categorizedQuestions[activePracticeTab as keyof typeof note.categorizedQuestions]?.map((q, index) => (
                    <Accordion key={index} title={q.question}>
                      <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHTML(q.answer) }} />
                    </Accordion>
                  ))}
                  <div className="text-center mt-6">
                    <Button 
                      onClick={() => handleGenerate('categorized', { category: activePracticeTab })}
                      isLoading={generating === `categorized-${activePracticeTab}`}
                    >
                      Get More {questionCategories.find(c => c.key === activePracticeTab)?.label} Questions
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Button onClick={() => handleGenerate('categorized')} isLoading={generating === 'categorized'}>Generate Practice Questions</Button>
            )}
          </div>
        );
      case 'mcq':
        return (
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
            <Button onClick={() => setIsQuizModalOpen(true)} isLoading={generating === 'quiz'}>
              Generate New MCQ Quiz
            </Button>
            <div className="mt-4 space-y-3">
              {quizzes.length > 0 ? (
                  quizzes.map(quiz => (
                      <div key={quiz._id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-gray-100 dark:bg-gray-700/50 rounded-md gap-3">
                          <div className="flex-grow">
                            <span className="font-medium break-words text-gray-800 dark:text-gray-200">{quiz.title}</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400 block">{quiz.questionCount} MCQs</span>
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
                  ))
              ) : (
                  <p className='text-sm text-gray-600 dark:text-gray-400 mt-4'>No MCQ quizzes generated for this note yet.</p>
              )}
            </div>
          </div>
        );
      case 'mindmap':
        return (
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Content Mind Map</h2>
            {note.mindMap ? (
              <MindMap data={note.mindMap} />
            ) : (
              <Button onClick={() => handleGenerate('mindmap')} isLoading={generating === 'mindmap'}>
                Generate Mind Map
              </Button>
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