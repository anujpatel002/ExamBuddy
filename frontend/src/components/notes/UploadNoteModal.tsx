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
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [showPdfConverter, setShowPdfConverter] = useState(false);
  const [useFileName, setUseFileName] = useState(true);
  const { limits } = usePlanLimits();
  
  const canUpload = limits.notesPerSubject === -1 || currentNoteCount < limits.notesPerSubject;
  const canUploadMultiple = (fileCount: number) => {
    return limits.notesPerSubject === -1 || (currentNoteCount + fileCount) <= limits.notesPerSubject;
  };

  const handleFileChange = (selectedFiles: FileList | null) => {
    if (selectedFiles) {
      const fileArray = Array.from(selectedFiles);
      setFiles(fileArray);
      setShowPdfConverter(false);
      if (fileArray.length === 1 && useFileName) {
        const fileName = fileArray[0].name.replace(/\.[^/.]+$/, "");
        setTitle(fileName);
      } else if (fileArray.length > 1) {
        setTitle(''); // Clear title for multiple files
      }
    } else {
      setFiles([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 1 && !canUpload) {
      toast.error(`Note limit reached for this subject. Upgrade your plan to add more than ${limits.notesPerSubject} notes per subject.`);
      return;
    }
    
    if (files.length > 1 && !canUploadMultiple(files.length)) {
      const remaining = limits.notesPerSubject - currentNoteCount;
      toast.error(`Cannot upload ${files.length} files. You can only add ${remaining} more notes to this subject with your current plan.`);
      return;
    }
    if (files.length === 0) {
      toast.error('Please select at least one file');
      return;
    }
    
    if (files.length === 1 && !title.trim()) {
      toast.error('Please provide a title for the note');
      return;
    }

    setIsUploading(true);
    
    try {
      if (files.length === 1) {
        // Single file upload
        const formData = new FormData();
        formData.append('title', title);
        formData.append('document', files[0]);
        formData.append('subjectId', subjectId);

        await api.post('/notes/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Note uploaded successfully!');
      } else {
        // Multiple files upload
        setUploadProgress({ current: 0, total: files.length });
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const formData = new FormData();
          const fileName = file.name.replace(/\.[^/.]+$/, "");
          formData.append('title', fileName);
          formData.append('document', file);
          formData.append('subjectId', subjectId);

          await api.post('/notes/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          
          setUploadProgress({ current: i + 1, total: files.length });
        }
        
        toast.success(`${files.length} notes uploaded successfully!`);
      }
      
      setTitle('');
      setFiles([]);
      setUploadProgress({ current: 0, total: 0 });
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
      setUploadProgress({ current: 0, total: 0 });
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
      {files.length > 1 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
          <p className="text-blue-800 dark:text-blue-200 text-sm">
            <strong>Multiple Files Selected:</strong> Each file will be created as a separate note using the file name as the title.
          </p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Note Title</label>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="useFileName"
              checked={useFileName}
              onChange={(e) => {
                setUseFileName(e.target.checked);
                if (e.target.checked && files.length === 1) {
                  const fileName = files[0].name.replace(/\.[^/.]+$/, "");
                  setTitle(fileName);
                } else {
                  setTitle('');
                }
              }}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              disabled={files.length > 1}
            />
            <label htmlFor="useFileName" className={`text-sm ${files.length > 1 ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400'}`}>
              Use file name as title {files.length > 1 ? '(disabled for multiple files)' : ''}
            </label>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md"
            placeholder={files.length > 1 ? 'File names will be used as titles' : 'Enter note title'}
            required={files.length === 1}
            disabled={files.length > 1}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">File</label>
          <div className="space-y-2 mb-3">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">
              Only PDF and Word documents are supported. If you have PowerPoint files, please convert them to PDF first.
            </p>
            <div className="space-y-2">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <p className="text-amber-800 dark:text-amber-200 text-sm mb-2">
                  <strong>📄 Non-English PDF with Images?</strong> Convert to HTML first for better text extraction.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => window.open('https://pdf-to-text-ten.vercel.app/', '_blank')}
                  className="text-xs"
                >
                  <FiExternalLink className="mr-1 w-3 h-3" />
                  Convert PDF to HTML
                </Button>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-blue-800 dark:text-blue-200 text-sm mb-2">
                  <strong>📊 Have PowerPoint (PPT) files?</strong> For best results with diagrams and images, convert to PDF first, then use the converter above.
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300">
                  PPT → PDF → HTML converter → Upload HTML file
                </p>
              </div>
            </div>
          </div>
          {showPdfConverter && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-3">
              <p className="text-blue-800 dark:text-blue-200 text-sm mb-3">
                This PDF contains images and cannot be processed directly.
              </p>
              <p className="text-green-600 dark:text-green-400 text-sm mb-3">
                <strong>Solution:</strong> Convert to HTML using the converter below, then upload the HTML file here.
              </p>
              <p className="text-blue-800 dark:text-blue-200 text-sm mb-3">
                Use PDF converter (downloads as HTML):
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
            onChange={(e) => handleFileChange(e.target.files)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md"
            accept=".pdf,.doc,.docx,.txt,.html"
            multiple
            required
          />
          {files.length > 0 && (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {files.length === 1 ? (
                <p>Selected: {files[0].name}</p>
              ) : (
                <div>
                  <p className="font-medium">{files.length} files selected:</p>
                  <ul className="list-disc list-inside mt-1 max-h-20 overflow-y-auto">
                    {files.map((file, index) => (
                      <li key={index} className="truncate">{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="submit" isLoading={isUploading} className="flex-1" disabled={files.length === 1 ? !canUpload : !canUploadMultiple(files.length)}>
            <FiUpload className="mr-2" />
            {isUploading && uploadProgress.total > 1 
              ? `Uploading ${uploadProgress.current}/${uploadProgress.total}...` 
              : files.length > 1 
                ? `Upload ${files.length} Notes` 
                : 'Upload Note'
            }
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