'use client';
import { useState, useEffect } from 'react';
import { FiUpload, FiMessageSquare, FiBookOpen, FiMic, FiDownload, FiPlus } from 'react-icons/fi';
import SourcePanel from './SourcePanel';
import ChatInterface from './ChatInterface';
import StudyMaterialsPanel from './StudyMaterialsPanel';
import AudioGenerator from './AudioGenerator';
import NotebookErrorBoundary from './NotebookErrorBoundary';
import { useNotebookData } from '@/hooks/useNotebookData';
import { sanitizeForLogging } from '@/utils/sanitization';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Source {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'txt' | 'url';
  content: string;
  uploadedAt: Date;
  pageCount?: number;
}

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  sources?: { sourceId: string; page?: number; excerpt: string }[];
  timestamp: Date;
}

export default function NotebookWorkspace({ subjectId }: { subjectId: string }) {
  const { sources, isLoading, error, addNewSources, removeSource } = useNotebookData(subjectId);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activePanel, setActivePanel] = useState<'sources' | 'chat' | 'materials' | 'audio'>('sources');
  const [isProcessing, setIsProcessing] = useState(false);

  // Show error state if data loading failed
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Failed to Load Notebook</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || sources.length === 0) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message,
      isUser: true,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      console.log('Sending request to:', '/ai/notebook/analyze');
      console.log('Request data:', {
        sources: sources.map(s => ({ id: s.id, name: sanitizeForLogging(s.name), content: sanitizeForLogging(s.content.substring(0, 100)) + '...' })),
        query: sanitizeForLogging(message)
      });
      
      const response = await api.post('/ai/notebook/analyze', {
        sources: sources.map(s => ({ id: s.id, name: s.name, content: s.content })),
        query: message
      });

      console.log('Response received:', response.data);

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response.data.response,
        isUser: false,
        sources: response.data.sources?.map((s: any) => ({
          sourceId: s.id,
          excerpt: s.name
        })),
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      console.error('API Error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(`Failed to get AI response: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddSources = (newSources: Source[]) => {
    console.log('Adding sources:', newSources.map(s => ({ id: s.id, name: sanitizeForLogging(s.name) })));
    addNewSources(newSources);
  };

  // Auto-switch to chat when sources are added
  useEffect(() => {
    if (sources.length > 0 && activePanel === 'sources') {
      setActivePanel('chat');
    }
  }, [sources.length, activePanel]);

  const [showSidebar, setShowSidebar] = useState(false);

  return (
    <NotebookErrorBoundary>
      <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Mobile Sidebar Overlay */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Left Sidebar - Sources */}
      <div className={`${showSidebar ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative z-50 w-80 lg:w-80 h-full border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-transform duration-300 ease-in-out`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Sources</h2>
          <button 
            onClick={() => setShowSidebar(false)}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400"
          >
            ✕
          </button>
        </div>
        <SourcePanel 
          sources={sources} 
          onSourceSelect={(sourceId) => {}}
          onSourceDelete={removeSource}
          onSourcesAdd={handleAddSources}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation */}
        <div className="h-14 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center px-2 sm:px-4">
          <button 
            onClick={() => setShowSidebar(true)}
            className="lg:hidden p-2 mr-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400"
          >
            ☰
          </button>
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
            {[
              { key: 'chat', label: 'Chat', icon: FiMessageSquare, shortLabel: 'Chat' },
              { key: 'materials', label: 'Study Materials', icon: FiBookOpen, shortLabel: 'Materials' },
              { key: 'audio', label: 'Audio Overview', icon: FiMic, shortLabel: 'Audio' }
            ].map(({ key, label, shortLabel, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActivePanel(key as any)}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  activePanel === key
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4 inline mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{shortLabel}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Panels */}
        <div className="flex-1 overflow-hidden">
          {activePanel === 'chat' && (
            <ChatInterface 
              messages={chatMessages}
              sources={sources}
              onSendMessage={handleSendMessage}
              isProcessing={isProcessing}
            />
          )}
          {activePanel === 'materials' && (
            <StudyMaterialsPanel 
              sources={sources}
              subjectId={subjectId}
            />
          )}
          {activePanel === 'audio' && (
            <AudioGenerator 
              sources={sources}
              onGenerateAudio={async (format) => {
                try {
                  const response = await api.post('/ai/notebook/audio-overview', {
                    sources: sources.map(s => ({ id: s.id, name: s.name, content: s.content })),
                    format
                  });
                  return response.data;
                } catch (error) {
                  toast.error('Failed to generate audio overview');
                  throw error;
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
    </NotebookErrorBoundary>
  );
}