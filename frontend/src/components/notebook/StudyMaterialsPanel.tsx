'use client';
import { useState } from 'react';
import { FiFileText, FiList, FiMap, FiClock, FiDownload, FiRefreshCw, FiVideo } from 'react-icons/fi';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import MindMapViewer from './MindMapViewer';
import NotebookMindMap from './NotebookMindMap';
import { FormattedSummary } from '@/utils/markdownFormatter';
import { sanitizeForLogging } from '@/utils/sanitization';
import { getExportFunction, validateMaterialForExport } from '@/utils/exportUtility';

interface Source {
  id: string;
  name: string;
  content: string;
}

interface StudyMaterial {
  id: string;
  type: 'summary' | 'outline' | 'timeline' | 'flashcards' | 'quiz' | 'mindmap' | 'video';
  title: string;
  content: string;
  sources: string[];
  createdAt: Date;
}

interface StudyMaterialsPanelProps {
  sources: Source[];
  subjectId: string;
}

export default function StudyMaterialsPanel({ sources, subjectId }: StudyMaterialsPanelProps) {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [activeType, setActiveType] = useState<StudyMaterial['type']>('summary');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const materialTypes = [
    { key: 'summary', label: 'Summary', icon: FiFileText, description: 'Comprehensive overview of all sources' },
    { key: 'outline', label: 'Study Guide', icon: FiList, description: 'Structured outline for studying' },
    { key: 'timeline', label: 'Timeline', icon: FiClock, description: 'Chronological events and concepts' },
    { key: 'flashcards', label: 'Flashcards', icon: FiMap, description: 'Key terms and definitions' },
    { key: 'quiz', label: 'Practice Quiz', icon: FiRefreshCw, description: 'Test your knowledge' },
    { key: 'mindmap', label: 'Mind Map', icon: FiMap, description: 'Visual concept mapping' },
    { key: 'video', label: 'Video Script', icon: FiVideo, description: 'Educational video script' }
  ];

  const generateMaterial = async (type: StudyMaterial['type']) => {
    if (sources.length === 0) {
      toast.error('Add sources first to generate study materials');
      return;
    }

    setIsGenerating(true);
    try {
      console.log('Generating material:', sanitizeForLogging(type));
      console.log('Sources count:', sources.length);
      
      // Enhanced prompt for mind map to ensure proper scanning
      const enhancedSources = sources.map(s => ({
        id: s.id,
        name: s.name,
        content: s.content,
        ...(type === 'mindmap' && {
          instruction: 'Analyze this content thoroughly and extract key concepts, relationships, and hierarchical structure for mind mapping'
        })
      }));
      
      const response = await api.post('/ai/notebook/study-material', {
        type,
        sources: enhancedSources,
        ...(type === 'mindmap' && {
          additionalPrompt: 'Please carefully scan and analyze all provided sources. Extract main topics, subtopics, and their relationships. Create a comprehensive mind map structure with proper hierarchy and connections between concepts.'
        })
      });

      console.log('Response received, content length:', response.data?.content?.length || 0);

      const newMaterial: StudyMaterial = {
        id: Date.now().toString(),
        type,
        title: `${materialTypes.find(t => t.key === type)?.label} - ${new Date().toLocaleDateString()}`,
        content: typeof response.data.content === 'string' ? response.data.content : JSON.stringify(response.data.content, null, 2),
        sources: sources.map(s => s.id),
        createdAt: new Date()
      };

      setMaterials(prev => [newMaterial, ...prev.filter(m => m.type !== type)]);
      setCurrentPage(1); // Reset to first page when new content is generated
      toast.success(`${materialTypes.find(t => t.key === type)?.label} generated successfully`);
    } catch (error: any) {
      console.error('Study material generation error:', sanitizeForLogging(error.message));
      console.error('Error response:', sanitizeForLogging(error.response?.data?.message || 'Unknown error'));
      toast.error(`Failed to generate study material: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const exportMaterial = async (material: StudyMaterial) => {
    try {
      if (!validateMaterialForExport(material)) {
        toast.error('Invalid material format for export');
        return;
      }
      
      const exportFunction = getExportFunction(material.type);
      exportFunction(material);
      toast.success('Material exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export material: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const activeMaterial = materials.find(m => m.type === activeType);

  const [showSidebar, setShowSidebar] = useState(false);

  return (
    <div className="flex h-full bg-white dark:bg-gray-900">
      {/* Mobile Sidebar Overlay */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Material Types Sidebar */}
      <div className={`${showSidebar ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative z-50 w-64 lg:w-64 h-full border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 transition-transform duration-300 ease-in-out`}>
        <div className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Study Materials</h3>
            <button 
              onClick={() => setShowSidebar(false)}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2">
            {materialTypes.map(({ key, label, icon: Icon, description }) => (
              <button
                key={key}
                onClick={() => {
                  setActiveType(key as StudyMaterial['type']);
                  setShowSidebar(false);
                }}
                className={`w-full text-left p-2 sm:p-3 rounded-lg transition-colors ${
                  activeType === key
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 !text-slate-900 dark:!text-slate-100'
                }`}
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <Icon className={`w-4 sm:w-5 h-4 sm:h-5 mt-0.5 flex-shrink-0 ${activeType === key ? '' : '!text-slate-900 dark:!text-slate-100'}`} />
                  <div>
                    <div className={`font-medium text-sm sm:text-base ${activeType === key ? '' : '!text-slate-900 dark:!text-slate-100'}`}>{label}</div>
                    <div className={`text-xs opacity-75 mt-1 hidden sm:block ${activeType === key ? '' : '!text-slate-700 dark:!text-slate-300'}`}>{description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <button 
                onClick={() => setShowSidebar(true)}
                className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex-shrink-0 text-gray-600 dark:text-gray-400"
              >
                ☰
              </button>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">
                {materialTypes.find(t => t.key === activeType)?.label}
              </h2>
            </div>
            <div className="flex gap-1 sm:gap-2 flex-shrink-0">
              {activeMaterial && (
                <button
                  onClick={() => exportMaterial(activeMaterial)}
                  className="px-2 sm:px-3 py-2 text-xs sm:text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <FiDownload className="w-4 h-4 inline mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Export</span>
                </button>
              )}
              <button
                onClick={() => generateMaterial(activeType)}
                disabled={isGenerating || sources.length === 0}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiRefreshCw className={`w-4 h-4 inline mr-1 sm:mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isGenerating ? 'Generating...' : 'Generate'}</span>
                <span className="sm:hidden">{isGenerating ? '...' : 'Gen'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-white dark:bg-gray-900">
          {!activeMaterial ? (
            <div className="text-center py-8 sm:py-12">
              <div className="max-w-md mx-auto">
                {materialTypes.find(t => t.key === activeType)?.icon && (
                  <div className="mb-4">
                    {(() => {
                      const Icon = materialTypes.find(t => t.key === activeType)!.icon;
                      return <Icon className="mx-auto h-10 sm:h-12 w-10 sm:w-12 text-gray-400" />;
                    })()}
                  </div>
                )}
                <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No {materialTypes.find(t => t.key === activeType)?.label} Generated
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base mb-6">
                  {sources.length === 0 
                    ? 'Add sources first, then generate study materials from your uploaded documents.'
                    : `Generate a ${materialTypes.find(t => t.key === activeType)?.label.toLowerCase()} from your uploaded sources.`
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <div className="mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {activeMaterial.title}
                </h1>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Generated from {activeMaterial.sources.length} source(s) • {new Date(activeMaterial.createdAt).toLocaleDateString()}
                </div>
              </div>
              
              <div className="prose dark:prose-invert prose-sm sm:prose-lg max-w-none">
                <style jsx>{`
                  .formatted-summary p {
                    margin-bottom: 1rem;
                    line-height: 1.8;
                  }
                  .formatted-summary strong {
                    font-weight: 700;
                    color: #1f2937;
                  }
                  .dark .formatted-summary strong {
                    color: #f9fafb;
                  }
                  .formatted-summary ul {
                    margin: 1rem 0;
                  }
                  .formatted-summary li {
                    margin-bottom: 0.5rem;
                    line-height: 1.6;
                  }
                `}</style>
                {activeType === 'flashcards' ? (
                  <div className="space-y-4">
                    {(() => {
                      try {
                        const flashcards = typeof activeMaterial.content === 'string' 
                          ? JSON.parse(activeMaterial.content) 
                          : activeMaterial.content;
                        const cards = flashcards.flashcards || flashcards;
                        
                        if (!Array.isArray(cards)) return <p className="text-red-500">Invalid flashcard format</p>;
                        
                        const totalPages = Math.ceil(cards.length / itemsPerPage);
                        const startIndex = (currentPage - 1) * itemsPerPage;
                        const paginatedCards = cards.slice(startIndex, startIndex + itemsPerPage);
                        
                        return (
                          <>
                            <div className="space-y-4">
                              {paginatedCards.map((card: any, index: number) => (
                                <div key={startIndex + index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                                  <div className="mb-3">
                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Question {startIndex + index + 1}</h4>
                                    <p className="text-gray-800 dark:text-gray-200">{card.question}</p>
                                  </div>
                                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                                    <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Answer</h5>
                                    <p className="text-gray-600 dark:text-gray-400">{card.answer}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {totalPages > 1 && (
                              <div className="flex justify-center items-center gap-2 mt-6">
                                <button
                                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                  disabled={currentPage === 1}
                                  className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Previous
                                </button>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  Page {currentPage} of {totalPages} ({cards.length} flashcards)
                                </span>
                                <button
                                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                  disabled={currentPage === totalPages}
                                  className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Next
                                </button>
                              </div>
                            )}
                          </>
                        );
                      } catch (e) {
                        return <p className="text-red-500">Error parsing flashcards</p>;
                      }
                    })()}
                  </div>
                ) : activeType === 'quiz' ? (
                  <div className="space-y-6">
                    {(() => {
                      try {
                        const quiz = typeof activeMaterial.content === 'string' 
                          ? JSON.parse(activeMaterial.content) 
                          : activeMaterial.content;
                        const questions = quiz.questions || quiz.mcqs || quiz;
                        
                        if (!Array.isArray(questions)) return <p className="text-red-500">Invalid quiz format</p>;
                        
                        const totalPages = Math.ceil(questions.length / itemsPerPage);
                        const startIndex = (currentPage - 1) * itemsPerPage;
                        const paginatedQuestions = questions.slice(startIndex, startIndex + itemsPerPage);
                        
                        return (
                          <>
                            <div className="space-y-6">
                              {paginatedQuestions.map((q: any, index: number) => (
                                <div key={startIndex + index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                                  <div className="mb-4">
                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Question {startIndex + index + 1}</h4>
                                    <p className="text-gray-800 dark:text-gray-200 mb-4">{q.question}</p>
                                    
                                    {q.options && (
                                      <div className="space-y-2">
                                        {q.options.map((option: string, optIndex: number) => (
                                          <div key={optIndex} className={`p-3 rounded-lg border ${
                                            q.correctAnswer === option || q.correct === optIndex
                                              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-800 dark:text-green-200'
                                              : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                                          }`}>
                                            <span className="font-medium">{String.fromCharCode(65 + optIndex)}.</span> {option}
                                            {(q.correctAnswer === option || q.correct === optIndex) && (
                                              <span className="ml-2 text-green-600 dark:text-green-400 font-medium">✓ Correct</span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    
                                    {q.answer && !q.options && (
                                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                                        <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Answer</h5>
                                        <p className="text-blue-700 dark:text-blue-300">{q.answer}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                            {totalPages > 1 && (
                              <div className="flex justify-center items-center gap-2 mt-6">
                                <button
                                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                  disabled={currentPage === 1}
                                  className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Previous
                                </button>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  Page {currentPage} of {totalPages} ({questions.length} questions)
                                </span>
                                <button
                                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                  disabled={currentPage === totalPages}
                                  className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Next
                                </button>
                              </div>
                            )}
                          </>
                        );
                      } catch (e) {
                        return <p className="text-red-500">Error parsing quiz</p>;
                      }
                    })()}
                  </div>
                ) : activeType === 'mindmap' ? (
                  <div className="space-y-4 sm:space-y-6">
                    {activeMaterial.content.includes('```') ? (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg mb-4">
                        <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                          ⚠️ Mind map generation incomplete. Please regenerate for better results.
                        </p>
                      </div>
                    ) : null}
                    <NotebookMindMap content={activeMaterial.content} />
                    <details className="mt-4 sm:mt-6">
                      <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                        View Raw Text Structure
                      </summary>
                      <div className="mt-3 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <pre className="whitespace-pre-wrap font-mono text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          {activeMaterial.content}
                        </pre>
                      </div>
                    </details>
                  </div>
                ) : activeType === 'video' ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 text-sm sm:text-base">📹 Video Script Generated</h4>
                      <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                        Use this script with video creation tools like Loom, OBS, or AI video generators
                      </p>
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base text-gray-900 dark:text-gray-100">{activeMaterial.content}</div>
                  </div>
                ) : activeType === 'summary' ? (
                  <div className="prose prose-lg max-w-none text-gray-900 dark:text-gray-100">
                    <FormattedSummary content={activeMaterial.content} />
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base text-gray-900 dark:text-gray-100">{activeMaterial.content}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}