'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { FiBook, FiEdit, FiTrash2, FiPlusCircle, FiX, FiCheckSquare, FiEye } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';
import EditModal from '@/components/ui/EditModal';

interface Subject {
  _id: string;
  name: string;
}

export default function SubjectsPage() {
  const { user } = useAuth();
  const { limits, userPlan } = usePlanLimits();
  const router = useRouter();
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
      toast.error('Failed to load subjects.');
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
    
    // Check plan limits
    if (limits.subjects !== -1 && subjects.length >= limits.subjects) {
      toast.error(`Subject limit reached. Upgrade your plan to create more than ${limits.subjects} subjects.`);
      return;
    }
    
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
    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
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
    return <div className="flex justify-center py-8">Loading subjects...</div>;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">My Subjects</h1>
          {limits.subjects !== -1 && (
            <p className="text-sm text-gray-500 mt-1">{subjects.length}/{limits.subjects} subjects used</p>
          )}
        </div>
        {subjects.length > 0 && (
          <Button onClick={toggleSelectionMode} variant="secondary" size="sm">
            {isSelectionMode ? <FiX className="mr-1 md:mr-2" /> : <FiCheckSquare className="mr-1 md:mr-2" />}
            <span className="hidden sm:inline">{isSelectionMode ? 'Cancel' : 'Select'}</span>
            <span className="sm:hidden">{isSelectionMode ? 'Cancel' : 'Select'}</span>
          </Button>
        )}
      </div>

      {/* Create Subject Form */}
      <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow">
        <form onSubmit={handleCreateSubject} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            placeholder="Enter new subject name"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md text-sm md:text-base"
          />
          <Button 
            type="submit" 
            isLoading={isSubmitting} 
            className="w-full sm:w-auto"
            disabled={limits.subjects !== -1 && subjects.length >= limits.subjects}
          >
            <FiPlusCircle className="mr-2" />
            Create
          </Button>
        </form>
      </div>

      {/* Selection Bar */}
      {isSelectionMode && selectedSubjects.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-indigo-50 dark:bg-indigo-900/50 p-4 rounded-lg">
          <span className="font-semibold text-sm md:text-base">{selectedSubjects.length} selected</span>
          <Button onClick={() => setDeleteModalOpen(true)} className="bg-red-600 hover:bg-red-700 w-full sm:w-auto" size="sm">
            <FiTrash2 className="mr-2" /> Delete
          </Button>
        </div>
      )}

      {/* Subjects Grid */}
      {subjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {subjects.map((subject) => (
            <div
              key={subject._id}
              className={`relative bg-white dark:bg-gray-800 rounded-lg shadow transition-all select-none ${
                isSelectionMode ? 'cursor-pointer' : 'hover:shadow-lg'
              } ${selectedSubjects.includes(subject._id) ? 'ring-2 ring-indigo-500' : ''}`}
              onClick={() => isSelectionMode ? handleSelectSubject(subject._id) : router.push(`/subjects/${subject._id}`)}
            >
              <div className="p-3 md:p-4">
                {isSelectionMode && (
                  <div className="absolute top-2 right-2 md:top-3 md:right-3">
                    <input
                      type="checkbox"
                      checked={selectedSubjects.includes(subject._id)}
                      readOnly
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </div>
                )}
                <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                  <FiBook className="text-indigo-500 text-lg md:text-xl flex-shrink-0" />
                  <h3 className="font-semibold text-base md:text-lg truncate">{subject.name}</h3>
                </div>
                {!isSelectionMode && (
                  <div className="flex gap-2 pt-2 border-t dark:border-gray-700">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/subjects/${subject._id}`);
                      }}
                      variant="secondary"
                      size="sm"
                      className="flex-1 justify-center sm:hidden"
                    >
                      <FiEye className="h-4 w-4" />
                      <span className="ml-1">View</span>
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(subject);
                      }}
                      variant="secondary"
                      size="sm"
                      className="flex-1 justify-center"
                    >
                      <FiEdit className="h-4 w-4" />
                      <span className="ml-1 hidden sm:inline">Edit</span>
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(subject);
                      }}
                      variant="secondary"
                      size="sm"
                      className="flex-1 justify-center text-red-600 hover:bg-red-100 dark:text-red-400"
                    >
                      <FiTrash2 className="h-4 w-4" />
                      <span className="ml-1 hidden sm:inline">Delete</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 md:py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          <FiPlusCircle className="mx-auto h-10 md:h-12 w-10 md:w-12 text-gray-400" />
          <h3 className="mt-2 text-lg md:text-xl font-semibold">No subjects yet</h3>
          <p className="text-sm md:text-base text-gray-500 px-4">Create your first subject to get started.</p>
        </div>
      )}

      {/* Modals */}
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