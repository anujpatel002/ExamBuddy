'use client';
import { useState } from 'react';
import { FiFile, FiTrash2, FiExternalLink, FiUpload } from 'react-icons/fi';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { sanitizeForLogging, sanitizeFileContent } from '@/utils/sanitization';

interface Source {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'txt' | 'url';
  content: string;
  uploadedAt: Date;
  pageCount?: number;
}

interface SourcePanelProps {
  sources: Source[];
  onSourceSelect: (sourceId: string) => void;
  onSourceDelete: (sourceId: string) => void;
  onSourcesAdd: (sources: Source[]) => void;
}

export default function SourcePanel({ sources, onSourceSelect, onSourceDelete, onSourcesAdd }: SourcePanelProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [textTitle, setTextTitle] = useState('');

  const handleFileUpload = async (files: FileList) => {
    setIsUploading(true);
    try {
      const newSources: Source[] = [];
      
      for (const file of Array.from(files)) {
        let content = '';
        
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          // Upload PDF to backend for text extraction
          const formData = new FormData();
          formData.append('file', file);
          
          try {
            const response = await api.post('/api/upload/extract-text', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
            const extractedText = response.data.text || '';
            
            // Validate that we got actual text content, not metadata
            if (extractedText.includes('%PDF') || extractedText.includes('obj') || extractedText.length < 100) {
              content = 'PDF text extraction failed. Please try uploading a text-based PDF or convert to DOCX/TXT format.';
            } else {
              content = extractedText;
            }
            
            // Log extraction results (sanitized for security)
            console.log('Extracted text length:', content.length);
            console.log('First 200 chars:', sanitizeForLogging(content.substring(0, 200)));
          } catch (error) {
            console.error('PDF extraction failed:', error);
            content = `PDF processing failed: ${error.response?.data?.message || error.message}. Please try a different PDF or convert to DOCX/TXT format.`;
          }
        } else {
          // Read text files directly
          content = await readFileContent(file);
        }
        
        const source: Source = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
          name: file.name,
          type: getFileType(file.name),
          content: sanitizeFileContent(content),
          uploadedAt: new Date(),
          pageCount: file.type === 'application/pdf' ? Math.ceil(content.length / 2000) : undefined
        };
        
        newSources.push(source);
      }
      
      onSourcesAdd(newSources);
      toast.success(`${files.length} source(s) uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload sources');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTextSubmit = () => {
    if (!textContent.trim() || !textTitle.trim()) {
      toast.error('Please provide both title and content');
      return;
    }

    const source: Source = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
      name: textTitle,
      type: 'txt',
      content: sanitizeFileContent(textContent),
      uploadedAt: new Date()
    };

    onSourcesAdd([source]);
    setTextContent('');
    setTextTitle('');
    setShowTextInput(false);
    toast.success('Text content added successfully');
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || '');
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const getFileType = (filename: string): 'pdf' | 'doc' | 'txt' | 'url' => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'pdf';
      case 'doc':
      case 'docx': return 'doc';
      default: return 'txt';
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Upload Area */}
      <div
        className={`m-3 sm:m-4 p-4 sm:p-6 border-2 border-dashed rounded-lg transition-colors ${
          dragActive 
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <FiUpload className="mx-auto h-6 sm:h-8 w-6 sm:w-8 text-gray-400" />
          <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Drop files or{' '}
            <label className="text-blue-600 hover:text-blue-500 cursor-pointer">
              browse
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              />
            </label>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 hidden sm:block">PDF, DOC, TXT files • Or use "Add Text Content" below</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 sm:hidden">PDF, DOC, TXT files</p>
          {isUploading && (
            <div className="mt-2 flex items-center justify-center gap-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-xs sm:text-sm">Processing...</span>
            </div>
          )}
        </div>
      </div>

      {/* Text Input Option */}
      <div className="mx-3 sm:mx-4 mb-4">
        <button
          onClick={() => setShowTextInput(!showTextInput)}
          className="w-full p-2 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showTextInput ? 'Hide Text Input' : 'Add Text Content'}
        </button>
        
        {showTextInput && (
          <div className="mt-4 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
            <input
              type="text"
              placeholder="Document title..."
              value={textTitle}
              onChange={(e) => setTextTitle(e.target.value)}
              className="w-full p-2 mb-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <textarea
              placeholder="Paste your document content here..."
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              rows={8}
              className="w-full p-2 mb-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-vertical"
            />
            <div className="flex gap-2">
              <button
                onClick={handleTextSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Add Content
              </button>
              <button
                onClick={() => setShowTextInput(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sources List */}
      <div className="px-3 sm:px-4 pb-4">
        {sources.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FiFile className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No sources added yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sources.map((source) => (
              <div
                key={source.id}
                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer group"
                onClick={() => onSourceSelect(source.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <FiFile className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {source.name}
                      </h3>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                      <span className="uppercase">{source.type}</span>
                      {source.pageCount && <span>• {source.pageCount} pages</span>}
                      <span>• {new Date(source.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSourceDelete(source.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700 transition-opacity"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}