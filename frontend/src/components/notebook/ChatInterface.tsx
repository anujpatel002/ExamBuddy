'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { FiSend, FiBookOpen, FiExternalLink } from 'react-icons/fi';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { FormattedText } from '@/utils/markdownFormatter';

interface Source {
  id: string;
  name: string;
  type: string;
  content: string;
}

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  sources?: { sourceId: string; page?: number; excerpt: string }[];
  timestamp: Date;
}

interface ChatInterfaceProps {
  messages: ChatMessage[];
  sources: Source[];
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
}

export default function ChatInterface({ messages, sources, onSendMessage, isProcessing }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();
    setInput('');
    onSendMessage(userMessage);
  };

  const suggestedQuestions = sources.length > 0 ? [
    `Summarize the key concepts from ${sources.map(s => s.name).join(', ')}`,
    "What are the main themes across these documents?",
    "Create a comprehensive study guide from all materials",
    "Generate practice questions based on the content",
    "Explain the most important topics for exam preparation"
  ] : [
    "Summarize the key concepts from all sources",
    "What are the main themes across these documents?",
    "Create a study guide from the uploaded materials",
    "Compare and contrast the different viewpoints presented"
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <FiBookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Start a conversation with your sources
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {sources.length > 0 
                  ? `Ask questions about your ${sources.length} uploaded document${sources.length > 1 ? 's' : ''} and get AI-powered answers with source citations.`
                  : 'Ask questions about your uploaded documents and get AI-powered answers with source citations.'
                }
              </p>
              
              {sources.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Try asking:</p>
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => setInput(question)}
                      className="block w-full text-left p-3 text-sm bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-gray-900 dark:text-gray-100"
                    >
                      "{question}"
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-3xl w-full sm:max-w-3xl ${message.isUser ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'} rounded-lg p-3 sm:p-4 shadow-sm`}>
                <div className="prose dark:prose-invert prose-sm max-w-none">
                  <FormattedText 
                    content={message.content}
                    className="whitespace-pre-wrap leading-relaxed"
                  />
                </div>
                
                {/* Source Citations */}
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Sources:</p>
                    <div className="space-y-1">
                      {message.sources.map((source, index) => {
                        const sourceDoc = sources.find(s => s.id === source.sourceId);
                        return (
                          <div key={index} className="flex items-start gap-2 text-xs">
                            <FiExternalLink className="w-3 h-3 mt-0.5 text-gray-400 flex-shrink-0" />
                            <div>
                              <span className="font-medium">{sourceDoc?.name}</span>
                              {source.page && <span className="text-gray-500"> (Page {source.page})</span>}
                              {source.excerpt && (
                                <p className="text-gray-600 dark:text-gray-400 mt-1 italic">
                                  "{source.excerpt}"
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <div className="mt-2 text-xs text-gray-500">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
        
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Analyzing sources...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={sources.length === 0 ? "Add sources first..." : "Ask about your sources..."}
            disabled={sources.length === 0 || isProcessing}
            className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            type="submit"
            disabled={!input.trim() || sources.length === 0 || isProcessing}
            className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FiSend className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}