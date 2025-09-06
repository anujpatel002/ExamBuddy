'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { FiBook, FiEdit, FiTrash2, FiPlusCircle, FiX, FiCheckSquare } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import SkeletonCard from '@/components/ui/SkeletonCard';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';
import EditModal from '@/components/ui/EditModal';

interface Subject {
  _id: string;
  name: string;
}

export default function DashboardPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [subjectToEdit, setSubjectToEdit] = useState<Subject | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fetchSubjects = async () => {
    setLoading(true);
    try {
        const { data } = await api.get('/subjects');
        setSubjects(data);
    } catch (error) {
        toast.error("Failed to load subjects.");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    setIsSubmitting(true);
    try {
      await api.post('/subjects', { name: newSubjectName });
      toast.success('Subject created!');
      setNewSubjectName('');
      fetchSubjects();
    } catch (error) {
      toast.error('Failed to create subject.');
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleSelectSubject = (subjectId: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleDeleteSelected = async () => {
    setIsSubmitting(true);
    try {
      await api.delete('/subjects', { data: { ids: selectedSubjects } });
      toast.success(`${selectedSubjects.length} subjects deleted.`);
      fetchSubjects();
    } catch (error) {
      toast.error('Failed to delete subjects.');
    } finally {
      setIsSubmitting(false);
      setIsSelectionMode(false);
      setSelectedSubjects([]);
      setDeleteModalOpen(false);
    }
  };
  
  const handleEditClick = (subject: Subject) => {
    setSubjectToEdit(subject);
    setEditModalOpen(true);
  };
  
  const handleDeleteClick = (subject: Subject) => {
    setSelectedSubjects([subject._id]);
    setSubjectToEdit(subject);
    setDeleteModalOpen(true);
  };

  const handleSaveChanges = async (newName: string) => {
    if (!subjectToEdit) return;
    setIsSubmitting(true);
    try {
      await api.put(`/subjects/${subjectToEdit._id}`, { name: newName });
      toast.success('Subject updated successfully!');
      fetchSubjects();
    } catch (error) {
      toast.error('Failed to update subject.');
    } finally {
      setIsSubmitting(false);
      setEditModalOpen(false);
      setSubjectToEdit(null);
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedSubjects([]);
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-6">My Subjects</h1>
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow mb-8">
            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">My Subjects</h1>
        {subjects.length > 0 && (
          <Button onClick={toggleSelectionMode} variant="secondary">
            {isSelectionMode ? <FiX className="mr-2"/> : <FiCheckSquare className="mr-2"/>}
            {isSelectionMode ? 'Cancel' : 'Select'}
          </Button>
        )}
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow mb-8">
         <form onSubmit={handleCreateSubject} className="flex flex-col sm:flex-row gap-4">
            <input
                type="text"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                placeholder="Enter new subject name"
                className="flex-grow w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md"
            />
            <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto flex-shrink-0">Create Subject</Button>
        </form>
      </div>

      {isSelectionMode && selectedSubjects.length > 0 && (
        <div className="mb-6 flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/50 p-4 rounded-lg">
          <span className="font-semibold">{selectedSubjects.length} subject(s) selected</span>
          <Button 
            onClick={() => setDeleteModalOpen(true)}
            className="bg-red-600 hover:bg-red-700"
          >
            <FiTrash2 className="mr-2"/> Delete Selected
          </Button>
        </div>
      )}

      {subjects.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {subjects.map(subject => (
            <div 
                key={subject._id} 
                className={`bg-white dark:bg-gray-800 rounded-lg shadow flex flex-col justify-between transition-all ${isSelectionMode ? 'cursor-pointer' : ''} ${selectedSubjects.includes(subject._id) ? 'ring-2 ring-indigo-500' : 'ring-0'}`}
            >
              <div 
                className="p-4 sm:p-6 flex-grow"
                onClick={() => {
                  if (isSelectionMode) {
                    handleSelectSubject(subject._id);
                  }
                }}
              >
                {isSelectionMode && (
                  <div className="absolute top-4 right-4 h-5 w-5">
                    <input type="checkbox" checked={selectedSubjects.includes(subject._id)} readOnly className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"/>
                  </div>
                )}
                <Link href={`/subjects/${subject._id}`} className={`flex items-center gap-3 ${isSelectionMode ? 'pointer-events-none' : ''}`}>
                    <FiBook className="text-indigo-500 text-2xl sm:text-3xl flex-shrink-0" />
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200 break-words">{subject.name}</h3>
                </Link>
              </div>
              
              {!isSelectionMode && (
                <div className="flex items-center gap-2 p-4 pt-0 mt-4 border-t dark:border-gray-700">
                  <div className="ml-auto flex gap-2">
                    <Button onClick={() => handleEditClick(subject)} variant="secondary" size="sm" className="px-3">
                      <FiEdit />
                    </Button>
                     <Button onClick={() => handleDeleteClick(subject)} variant="secondary" size="sm" className="px-3 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50">
                      <FiTrash2 />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg mt-8">
          <FiPlusCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-xl font-semibold text-gray-900 dark:text-gray-200">No subjects yet</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating your first subject above.</p>
        </div>
      )}
      
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteSelected}
        isLoading={isSubmitting}
        itemName={subjectToEdit ? `"${subjectToEdit.name}"` : `${selectedSubjects.length} subjects`}
      />

      {subjectToEdit && (
        <EditModal
          isOpen={isEditModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSave={handleSaveChanges}
          isLoading={isSubmitting}
          itemType="Subject"
          initialName={subjectToEdit.name}
        />
      )}
    </div>
  );
}