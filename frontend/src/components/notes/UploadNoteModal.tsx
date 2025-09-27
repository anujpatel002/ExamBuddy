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
    <Modal isOpen={isOpen} onClose={onClose} title="🤖 AI Note Processor">
      <div className="glass-card p-4 rounded-xl mb-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm">🧠</span>
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">AI Document Processor</h3>
            <p className="text-xs text-blue-300">Upload for intelligent analysis</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="glass-card p-2 rounded-lg">
            <div className="text-sm mb-1">📄</div>
            <div className="text-xs text-gray-300">Extract</div>
          </div>
          <div className="glass-card p-2 rounded-lg">
            <div className="text-sm mb-1">🎯</div>
            <div className="text-xs text-gray-300">Q&A</div>
          </div>
          <div className="glass-card p-2 rounded-lg">
            <div className="text-sm mb-1">💡</div>
            <div className="text-xs text-gray-300">Summary</div>
          </div>
        </div>
      </div>
      
      {!canUpload && (
        <div className="glass-card p-3 mb-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 text-sm">⚠️</span>
            <p className="text-yellow-200 text-xs">
              Note limit reached ({currentNoteCount}/{limits.notesPerSubject}). Upgrade to add more.
            </p>
          </div>
        </div>
      )}
      {files.length > 1 && (
        <div className="glass-card p-3 mb-3 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/30">
          <div className="flex items-center gap-2">
            <span className="text-blue-400 text-sm">📁</span>
            <p className="text-blue-200 text-xs">
              <strong>Batch Processing:</strong> Each file processed separately.
            </p>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-2 text-white flex items-center gap-2">
            <span className="text-blue-400">✏️</span> Note Title
          </label>
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
              className="h-3 w-3 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              disabled={files.length > 1}
            />
            <label htmlFor="useFileName" className={`text-xs ${files.length > 1 ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400'}`}>
              Use filename {files.length > 1 ? '(disabled for multiple)' : ''}
            </label>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md text-sm"
            placeholder={files.length > 1 ? 'File names will be used as titles' : 'Enter note title'}
            required={files.length === 1}
            disabled={files.length > 1}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2 text-white flex items-center gap-2">
            <span className="text-purple-400">📎</span> Upload Documents
          </label>
          <div className="space-y-2 mb-3">
            <p className="text-xs text-red-600 dark:text-red-400 font-medium">
              📄 Only PDF and Word documents supported. Convert PowerPoint to PDF first.
            </p>
            <div className="space-y-2">
              <div className="glass-card p-3 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔄</span>
                  <div className="flex-1">
                    <p className="text-amber-200 text-xs mb-1 font-medium">
                      Image-based PDF? Use AI converter!
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => window.open('https://pdf-to-text-ten.vercel.app/', '_blank')}
                      className="text-xs bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/50 py-1 px-2"
                    >
                      <FiExternalLink className="mr-1 w-3 h-3" />
                      AI Converter
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {showPdfConverter && (
            <div className="glass-card p-3 mb-2 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 animate-pulse">
              <div className="flex items-center gap-2">
                <span className="text-lg">🤖</span>
                <div className="flex-1">
                  <p className="text-green-200 text-xs mb-1 font-medium">
                    AI detected image-based PDF! Use converter for text extraction.
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => window.open('https://pdf-to-text-ten.vercel.app/', '_blank')}
                    className="text-xs bg-gradient-to-r from-green-500/30 to-blue-500/30 hover:from-green-500/40 hover:to-blue-500/40 border-green-500/50 py-1 px-2"
                  >
                    <FiExternalLink className="mr-1 w-3 h-3" />
                    Launch Converter
                  </Button>
                </div>
              </div>
            </div>
          )}
          <input
            type="file"
            onChange={(e) => handleFileChange(e.target.files)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md text-sm"
            accept=".pdf,.doc,.docx,.txt,.html"
            multiple
            required
          />
          {files.length > 0 && (
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              {files.length === 1 ? (
                <p>Selected: {files[0].name}</p>
              ) : (
                <div>
                  <p className="font-medium">{files.length} files selected:</p>
                  <ul className="list-disc list-inside mt-1 max-h-16 overflow-y-auto text-xs">
                    {files.map((file, index) => (
                      <li key={index} className="truncate">{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-3">
          <Button type="submit" isLoading={isUploading} className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-sm py-2" disabled={files.length === 1 ? !canUpload : !canUploadMultiple(files.length)}>
            <FiUpload className="mr-2" />
            {isUploading && uploadProgress.total > 1 
              ? `Processing ${uploadProgress.current}/${uploadProgress.total}...` 
              : files.length > 1 
                ? `Process ${files.length} Documents` 
                : 'Start AI Processing'
            }
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} className="text-sm py-2">
            <FiX className="mr-2" />
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}