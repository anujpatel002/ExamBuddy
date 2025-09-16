'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiEye, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { formatCodeContent, containsCode, containsSteps, getCodeStyles } from '@/utils/codeFormatter';

interface FlashcardProps {
  flashcard: { question: string; answer: string; };
  allFlashcards?: { question: string; answer: string; }[];
  currentIndex?: number;
  sectionType?: 'theory' | 'practical';
}

const Flashcard = ({ flashcard, allFlashcards = [], currentIndex = 0, sectionType }: FlashcardProps) => {
  const [showViewer, setShowViewer] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(currentIndex);
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Keyboard navigation and body scroll lock
  useEffect(() => {
    if (showViewer) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setShowViewer(false);
        } else if (e.key === 'ArrowRight' && allFlashcards && viewerIndex < allFlashcards.length - 1) {
          nextCard();
        } else if (e.key === 'ArrowLeft' && viewerIndex > 0) {
          prevCard();
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [showViewer, viewerIndex, allFlashcards]);

  const nextCard = () => {
    if (allFlashcards && viewerIndex < allFlashcards.length - 1) {
      setViewerIndex(viewerIndex + 1);
    }
  };

  const prevCard = () => {
    if (viewerIndex > 0) {
      setViewerIndex(viewerIndex - 1);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    (e.currentTarget as any).startX = touch.clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const startX = (e.currentTarget as any).startX;
    const diffX = startX - touch.clientX;
    
    // Limit drag to prevent going beyond bounds
    const maxDrag = window.innerWidth * 0.3;
    const limitedDiffX = Math.max(-maxDrag, Math.min(maxDrag, -diffX));
    setTranslateX(limitedDiffX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const touch = e.changedTouches[0];
    const startX = (e.currentTarget as any).startX;
    const diffX = startX - touch.clientX;
    
    setIsDragging(false);
    setTranslateX(0);
    
    if (Math.abs(diffX) > 80 && allFlashcards) {
      if (diffX > 0 && viewerIndex < allFlashcards.length - 1) {
        nextCard();
      } else if (diffX < 0 && viewerIndex > 0) {
        prevCard();
      }
    }
  };







  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: getCodeStyles() }} />
      <div className="w-full glass-card rounded-3xl relative overflow-hidden group hover:scale-105 transition-all duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-xl float"></div>
        
        <div className="relative z-10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
            <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-wide">QUESTION</span>
          </div>
          <div className={`font-semibold text-gray-800 dark:text-gray-100 leading-relaxed break-words mb-6 max-h-32 overflow-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent ${
            flashcard.question.length > 150 ? 'text-sm' : 
            flashcard.question.length > 100 ? 'text-base' : 
            flashcard.question.length > 50 ? 'text-lg' : 'text-xl'
          }`}>
            <p>{flashcard.question}</p>
          </div>
          
          <div className="center-content">
            <button
              onClick={() => {
                setShowViewer(true);
                setTimeout(() => {
                  const contentDiv = document.querySelector('.flashcard-content');
                  if (contentDiv) contentDiv.scrollTop = 0;
                }, 300);
              }}
              className="center-content gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-2xl font-medium transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <FiEye className="w-4 h-4" />
              <span>View Answer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Flashcard Viewer */}
      {showViewer && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-gray-800 flex flex-col overflow-hidden flashcard-popup" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999, width: '100vw', height: '100dvh', minHeight: '100dvh' }}>
            {/* Header - Always Show */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-indigo-600">
              <div className="flex justify-between items-center p-4">
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium text-white">
                    {allFlashcards && allFlashcards.length > 0 ? `${viewerIndex + 1} of ${allFlashcards.length}` : '1 of 1'}
                  </span>
                  <div className="flex gap-2 md:hidden">
                    <button
                      onClick={prevCard}
                      disabled={!allFlashcards || allFlashcards.length <= 1 || viewerIndex === 0}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <FiChevronLeft className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={nextCard}
                      disabled={!allFlashcards || allFlashcards.length <= 1 || viewerIndex === allFlashcards.length - 1}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <FiChevronRight className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setShowViewer(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <FiX className="w-6 h-6 text-white" />
                </button>
              </div>
              <div className="px-4 pb-3">
                <span className="text-sm font-medium text-white/80">Q & A</span>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 bg-gray-800 overflow-y-auto flashcard-content" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
              <div className="max-w-none space-y-8 p-6 pt-12">
                {/* Question */}
                <div className="p-6 bg-blue-900/20 rounded-xl border-l-4 border-blue-500">
                  <h3 className="text-lg font-bold text-blue-400 mb-4">QUESTION</h3>
                  <div className="text-gray-200 leading-relaxed text-base overflow-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <p className="text-base leading-7">{allFlashcards?.[viewerIndex]?.question || flashcard.question}</p>
                  </div>
                </div>
                
                {/* Answer */}
                <div className="p-6 bg-green-900/20 rounded-xl border-l-4 border-green-500">
                  <h3 className="text-lg font-bold text-green-400 mb-4">ANSWER</h3>
                  <div className="prose prose-invert prose-base max-w-none text-gray-200 overflow-auto whitespace-pre-wrap break-words" style={{ WebkitOverflowScrolling: 'touch', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    <div className="text-base leading-7" dangerouslySetInnerHTML={{ __html: allFlashcards?.[viewerIndex]?.answer || flashcard.answer }} />
                  </div>
                </div>
              </div>
              
              {/* Desktop Navigation - Always Show */}
              <div className="hidden md:flex justify-center gap-4 p-6 mt-8 border-t border-gray-700">
                <button
                  onClick={prevCard}
                  disabled={!allFlashcards || allFlashcards.length <= 1 || viewerIndex === 0}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base font-medium text-white"
                >
                  Previous
                </button>
                <button
                  onClick={nextCard}
                  disabled={!allFlashcards || allFlashcards.length <= 1 || viewerIndex === allFlashcards.length - 1}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base font-medium text-white"
                >
                  Next
                </button>
              </div>
            </div>
        </div>,
        document.body
      )}
    </>
  );
};
export default Flashcard;