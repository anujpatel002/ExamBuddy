'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { FiUpload, FiX, FiExternalLink } from 'react-icons/fi';
import { usePlanLimits } from '@/hooks/usePlanLimits';

interface UploadNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNoteUploaded: () => void;
  subjectId: string;
  currentNoteCount?: number;
}

export default function UploadNoteModal(props: UploadNoteModalProps) {
  const { isOpen, onClose, onNoteUploaded, subjectId, currentNoteCount = 0 } = props;
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showPdfConverter, setShowPdfConverter] = useState(false);
  const { limits } = usePlanLimits();
  
  const canUpload = limits.notesPerSubject === -1 || currentNoteCount < limits.notesPerSubject;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUpload) {
      toast.error(`Note limit reached for this subject. Upgrade your plan to add more than ${limits.notesPerSubject} notes per subject.`);
      return;
    }
    if (!file || !title.trim()) {
      toast.error('Please provide both title and file');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('document', file);
    formData.append('subjectId', subjectId);

    try {
      await api.post('/notes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Note uploaded successfully!');
      setTitle('');
      setFile(null);
      onNoteUploaded();
      onClose();
    } catch (error: any) {
      if (error.response?.data?.isImageBasedPdf) {
        setShowPdfConverter(true);
      } else {
        toast.error(error.response?.data?.message || 'Upload failed');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Note">
      {!canUpload && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            Note limit reached ({currentNoteCount}/{limits.notesPerSubject}). Upgrade your plan to add more notes.
          </p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Note Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md"
            placeholder="Enter note title"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">File</label>
          <p className="text-sm text-red-600 dark:text-red-400 mb-2 font-medium">
            Only PDF and Word documents are supported. If you have PowerPoint files, please convert them to PDF first.
          </p>
          {showPdfConverter && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-3">
              <p className="text-blue-800 dark:text-blue-200 text-sm mb-3">
                This PDF contains images and cannot be processed directly.
              </p>
              <p className="text-green-600 dark:text-green-400 text-sm mb-3">
                <strong>Mobile users:</strong> Save your content as RTF format instead - it works better with Gujarati text on mobile.
              </p>
              <p className="text-blue-800 dark:text-blue-200 text-sm mb-3">
                Or use PDF converter (downloads as TXT or RTF):
              </p>
              <Button
                type="button"
                variant="secondary"
                onClick={() => window.open('https://pdf-to-text-ten.vercel.app/', '_blank')}
                className="text-sm"
              >
                <FiExternalLink className="mr-2" />
                Convert PDF to Text
              </Button>
            </div>
          )}
          <input
            type="file"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              setShowPdfConverter(false);
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md"
            accept=".pdf,.doc,.docx,.txt"
            required
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="submit" isLoading={isUploading} className="flex-1" disabled={!canUpload}>
            <FiUpload className="mr-2" />
            Upload Note
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            <FiX className="mr-2" />
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}