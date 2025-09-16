'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { FiBook, FiEdit, FiTrash2, FiPlusCircle, FiX, FiCheckSquare, FiEye, FiBookOpen } from 'react-icons/fi';
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
    <div className="px-4 sm:px-6 lg:px-8 space-y-8 page-transition">
      <div className="glass-card p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-xl float"></div>
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-2">My Subjects</h1>
            {limits.subjects !== -1 && (
              <div className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                {subjects.length}/{limits.subjects} subjects used
              </div>
            )}
          </div>
          {subjects.length > 0 && (
            <button onClick={toggleSelectionMode} className="btn-modern px-6 py-3">
              {isSelectionMode ? <FiX className="mr-2" /> : <FiCheckSquare className="mr-2" />}
              {isSelectionMode ? 'Cancel' : 'Select'}
            </button>
          )}
        </div>
      </div>

      {/* Create Subject Form */}
      <div className="glass-card p-8 rounded-2xl">
        <h2 className="text-xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Create New Subject</h2>
        <form onSubmit={handleCreateSubject} className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            placeholder="Enter subject name..."
            className="flex-1 h-16 md:h-12 px-4 border border-gray-200/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 rounded-xl text-base backdrop-blur-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 text-center flex items-center justify-center"
          />
          <button 
            type="submit" 
            disabled={isSubmitting || (limits.subjects !== -1 && subjects.length >= limits.subjects)}
            className="btn-modern px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiPlusCircle className="mr-2" />
            {isSubmitting ? 'Creating...' : 'Create Subject'}
          </button>
        </form>
      </div>

      {/* Selection Bar */}
      {isSelectionMode && selectedSubjects.length > 0 && (
        <div className="glass-card p-6 rounded-2xl bg-gradient-to-r from-red-50/50 to-pink-50/50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200/50 dark:border-red-700/50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <span className="font-bold text-lg text-red-700 dark:text-red-300">{selectedSubjects.length} selected</span>
            <button onClick={() => setDeleteModalOpen(true)} className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
              <FiTrash2 className="mr-2" /> Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Subjects Grid */}
      {subjects.length > 0 ? (
        <div className="card-grid">
          {subjects.map((subject, index) => (
            <div
              key={subject._id}
              className={`stagger-item relative glass-card rounded-2xl transition-all duration-500 select-none group ${
                isSelectionMode ? 'cursor-pointer' : 'hover:scale-105 cursor-pointer'
              } ${selectedSubjects.includes(subject._id) ? 'ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
              style={{animationDelay: `${index * 0.1}s`}}
              onClick={() => isSelectionMode ? handleSelectSubject(subject._id) : router.push(`/subjects/${subject._id}`)}
            >
              <div className="p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                {isSelectionMode && (
                  <div className="absolute top-4 right-4 z-20">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 shadow-lg ${
                      selectedSubjects.includes(subject._id) 
                        ? 'bg-blue-500 border-blue-500 shadow-blue-200 dark:shadow-blue-900' 
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-gray-200 dark:shadow-gray-800'
                    }`}>
                      {selectedSubjects.includes(subject._id) ? (
                        <FiCheckSquare className="w-5 h-5 text-white" />
                      ) : (
                        <div className="w-3 h-3 rounded-full border border-gray-400 dark:border-gray-500"></div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Subject Header */}
                <div className="relative z-10 flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <FiBook className="text-white text-2xl" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100 truncate mb-2">
                      {subject.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Click to explore notes
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                {!isSelectionMode && (
                  <div className="flex flex-row gap-3 relative z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(subject);
                      }}
                      className="flex-1 h-12 px-4 bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-600/50 rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-medium"
                    >
                      <FiEdit className="h-4 w-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(subject);
                      }}
                      className="flex-1 h-12 px-4 bg-red-50/50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-700/50 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-300 flex items-center justify-center gap-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium"
                    >
                      <FiTrash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 rounded-3xl text-center">
          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-xl opacity-20 animate-pulse"></div>
            <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-2xl">
              <FiPlusCircle className="h-10 w-10 text-white" />
            </div>
          </div>
          <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">No subjects yet</h3>
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-8 max-w-md mx-auto">Create your first subject to start organizing your notes and study materials with AI-powered learning.</p>
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