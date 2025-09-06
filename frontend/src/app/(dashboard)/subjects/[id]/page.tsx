'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import NoteCard from '@/components/notes/NoteCard';
import UploadNoteModal from '@/components/notes/UploadNoteModal';
import Button from '@/components/ui/Button';
import { FiArrowLeft, FiEdit, FiTrash2, FiCheckSquare, FiX } from 'react-icons/fi';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';
import EditModal from '@/components/ui/EditModal';
import Link from 'next/link';
import SkeletonCard from '@/components/ui/SkeletonCard';

interface Note { _id: string; title: string; createdAt: string; status: 'approved' | 'pending'; }
interface Subject { _id: string; name: string; }

export default function SubjectDetailPage() {
  const { id: subjectId } = useParams();
  const router = useRouter();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
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

  const CardWrapper = ({ children, note }: { children: React.ReactNode; note: Note }) => {
    if (isSelectionMode) {
      return <div className="p-4 flex-grow">{children}</div>;
    }
    return <Link href={`/notes/${note._id}`} className="p-4 flex-grow block">{children}</Link>;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()} 
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Go back"
          >
            <FiArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl md:text-3xl font-bold">Subject: {subject?.name}</h1>
        </div>
        <div className="flex gap-2">
          {notes.length > 0 && (
            <Button onClick={toggleSelectionMode} variant="secondary">
              {isSelectionMode ? <FiX className="mr-2"/> : <FiCheckSquare className="mr-2"/>}
              {isSelectionMode ? 'Cancel' : 'Select'}
            </Button>
          )}
          <Button onClick={() => setUploadModalOpen(true)}>Upload Note</Button>
        </div>
      </div>

      {isSelectionMode && selectedNotes.length > 0 && (
        <div className="mb-6 flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/50 p-4 rounded-lg">
          <span className="font-semibold">{selectedNotes.length} note(s) selected</span>
          <Button 
            onClick={() => handleDeleteClick()}
            className="bg-red-600 hover:bg-red-700"
          >
            <FiTrash2 className="mr-2"/> Delete Selected
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
            <SkeletonCard />
            <SkeletonCard />
        </div>
      ) : notes.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
            {notes.map(note => (
            <div 
                key={note._id} 
                className={`bg-white dark:bg-gray-800 rounded-lg shadow flex flex-col transition-all ${isSelectionMode ? 'cursor-pointer' : ''} ${selectedNotes.includes(note._id) ? 'ring-2 ring-indigo-500' : ''}`}
                onClick={() => isSelectionMode && handleSelectNote(note._id)}
            >
              <CardWrapper note={note}>
                {isSelectionMode && (
                  <div className="absolute top-4 right-4 h-5 w-5">
                    <input type="checkbox" checked={selectedNotes.includes(note._id)} readOnly className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"/>
                  </div>
                )}
                <NoteCard note={note} />
              </CardWrapper>
              
              {!isSelectionMode && (
                <div className="flex items-center gap-2 p-4 pt-0 border-t dark:border-gray-700">
                  <div className="ml-auto flex gap-2">
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        className="px-3"
                        onClick={() => handleEditClick(note)}
                    >
                        <FiEdit />
                    </Button>
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        className="px-3 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50"
                        onClick={() => handleDeleteClick(note)}
                    >
                        <FiTrash2 />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="col-span-full text-center text-gray-500 dark:text-gray-400 mt-8">
            <p>No notes uploaded for this subject yet.</p>
        </div>
      )}

      <UploadNoteModal 
        isOpen={isUploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onNoteUploaded={fetchSubjectDetails}
        subjectId={subjectId as string}
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