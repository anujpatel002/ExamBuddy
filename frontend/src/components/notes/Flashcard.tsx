'use client';
import { useState } from 'react';
import { FiEye, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface FlashcardProps {
  flashcard: { question: string; answer: string; };
  allFlashcards?: { question: string; answer: string; }[];
  currentIndex?: number;
}

const Flashcard = ({ flashcard, allFlashcards = [], currentIndex = 0 }: FlashcardProps) => {
  const [showViewer, setShowViewer] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(currentIndex);
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const nextCard = () => {
    if (viewerIndex < allFlashcards.length - 1 && !isTransitioning) {
      setIsTransitioning(true);
      setViewerIndex(viewerIndex + 1);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  const prevCard = () => {
    if (viewerIndex > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setViewerIndex(viewerIndex - 1);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isTransitioning) return;
    const touch = e.touches[0];
    (e.currentTarget as any).startX = touch.clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || isTransitioning) return;
    const touch = e.touches[0];
    const startX = (e.currentTarget as any).startX;
    const diffX = startX - touch.clientX;
    
    // Limit drag to prevent going beyond bounds
    const maxDrag = window.innerWidth * 0.3;
    const limitedDiffX = Math.max(-maxDrag, Math.min(maxDrag, -diffX));
    setTranslateX(limitedDiffX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging || isTransitioning) return;
    
    const touch = e.changedTouches[0];
    const startX = (e.currentTarget as any).startX;
    const diffX = startX - touch.clientX;
    
    setIsDragging(false);
    setTranslateX(0);
    
    if (Math.abs(diffX) > 80) {
      if (diffX > 0 && viewerIndex < allFlashcards.length - 1) {
        nextCard();
      } else if (diffX < 0 && viewerIndex > 0) {
        prevCard();
      }
    }
  };



  return (
    <>
      <div className="w-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-bold text-blue-700 dark:text-blue-300 tracking-wide">QUESTION</span>
          </div>
          <p className={`font-semibold text-gray-800 dark:text-gray-200 leading-relaxed break-words mb-6 ${
            flashcard.question.length > 150 ? 'text-sm' : 
            flashcard.question.length > 100 ? 'text-base' : 
            flashcard.question.length > 50 ? 'text-lg' : 'text-xl'
          }`}>
            {flashcard.question}
          </p>
          
          <div className="flex justify-center">
            <button
              onClick={() => setShowViewer(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-md"
            >
              <FiEye className="w-4 h-4" /> View Answer
            </button>
          </div>
        </div>
      </div>

      {/* Flashcard Viewer */}
      {showViewer && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Navigation Arrows */}
            {allFlashcards.length > 1 && (
              <>
                <button
                  onClick={prevCard}
                  disabled={viewerIndex === 0}
                  className="absolute left-4 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
                >
                  <FiChevronLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                </button>
                <button
                  onClick={nextCard}
                  disabled={viewerIndex === allFlashcards.length - 1}
                  className="absolute right-4 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
                >
                  <FiChevronRight className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                </button>
              </>
            )}

            {/* Close Button */}
            <button
              onClick={() => setShowViewer(false)}
              className="absolute top-4 right-4 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
            >
              <FiX className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>

            {/* Card Container */}
            <div className="relative w-full max-w-4xl h-[90vh] overflow-hidden">
              <div 
                className="flex h-full transition-transform duration-300 ease-out"
                style={{ 
                  transform: `translateX(-${viewerIndex * 100}%)`,
                }}
              >
                {allFlashcards.map((card, index) => (
                  <div 
                    key={index} 
                    className="w-full flex-shrink-0 px-4 h-full"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full h-full overflow-y-auto">
                      <div className="p-8">
                        {/* Counter */}
                        {allFlashcards.length > 1 && (
                          <div className="text-center mb-6">
                            <span className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm text-gray-600 dark:text-gray-400">
                              {index + 1} of {allFlashcards.length}
                            </span>
                          </div>
                        )}
                        
                        {/* Question */}
                        <div className="mb-6 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className="text-sm font-bold text-blue-700 dark:text-blue-300 tracking-wide">QUESTION</span>
                          </div>
                          <p className="text-lg text-gray-800 dark:text-gray-200 leading-relaxed">
                            {card.question}
                          </p>
                        </div>
                        
                        {/* Answer */}
                        <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-bold text-green-700 dark:text-green-300 tracking-wide">ANSWER</span>
                          </div>
                          <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap break-words">
                            {card.answer.replace(/<[^>]*>/g, '')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export default Flashcard;