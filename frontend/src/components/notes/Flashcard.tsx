'use client';
import { useState } from 'react';
import { FiRotateCw, FiEye, FiEyeOff } from 'react-icons/fi';

interface FlashcardProps {
  flashcard: { question: string; answer: string; };
}

const Flashcard = ({ flashcard }: FlashcardProps) => {
  const [showAnswer, setShowAnswer] = useState(false);
  console.log('Flashcard component rendering:', flashcard.question.substring(0, 50));

  const toggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  return (
    <div className={`relative w-full ${showAnswer ? 'h-auto' : 'h-64'} transition-all duration-700 ease-in-out overflow-hidden`} style={{perspective: '1000px'}}>
      <div className={`relative w-full h-full transition-transform duration-700`} style={{transformStyle: 'preserve-3d', transform: showAnswer ? 'rotateY(180deg)' : 'rotateY(0deg)'}}>
        {/* Front Side - Question */}
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300" style={{backfaceVisibility: 'hidden'}}>
          <div className="p-6 h-64 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-bold text-blue-700 dark:text-blue-300 tracking-wide">QUESTION</span>
              </div>
              <button
                onClick={toggleAnswer}
                className="p-2 bg-blue-100 dark:bg-blue-800 hover:bg-blue-200 dark:hover:bg-blue-700 rounded-full transition-colors duration-200"
              >
                <FiRotateCw className="w-4 h-4 text-blue-600 dark:text-blue-300" />
              </button>
            </div>
            
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              <div className="text-center w-full px-2">
                <p className={`font-semibold text-gray-800 dark:text-gray-200 leading-relaxed break-words ${
                  flashcard.question.length > 150 ? 'text-sm' : 
                  flashcard.question.length > 100 ? 'text-base' : 
                  flashcard.question.length > 50 ? 'text-lg' : 'text-xl'
                }`}>
                  {flashcard.question}
                </p>
              </div>
            </div>
            
            <div className="flex justify-center mt-4">
              <button
                onClick={toggleAnswer}
                className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-md"
              >
                <FiEye className="w-4 h-4" />
                Show Answer
              </button>
            </div>
          </div>
        </div>

        {/* Back Side - Answer */}
        <div className={`${showAnswer ? 'relative' : 'absolute inset-0'} w-full ${showAnswer ? 'h-auto' : 'h-64'} min-h-64 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-700 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-700 ease-in-out ${showAnswer ? 'z-10' : ''}`} style={{backfaceVisibility: 'hidden', transform: 'rotateY(180deg)'}}>
          <div className="p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-bold text-green-700 dark:text-green-300 tracking-wide">ANSWER</span>
              </div>
              <button
                onClick={toggleAnswer}
                className="p-2 bg-green-100 dark:bg-green-800 hover:bg-green-200 dark:hover:bg-green-700 rounded-full transition-colors duration-200"
              >
                <FiRotateCw className="w-4 h-4 text-green-600 dark:text-green-300" />
              </button>
            </div>
            
            <div className="mb-4 flex-1 overflow-y-auto">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere">
                  {flashcard.answer.replace(/<[^>]*>/g, '')}
                </p>
              </div>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={toggleAnswer}
                className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-md"
              >
                <FiEyeOff className="w-4 h-4" />
                Hide Answer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Flashcard;

// Add these styles to your global CSS file
/*
.perspective-1000 {
  perspective: 1000px;
}

.transform-style-preserve-3d {
  transform-style: preserve-3d;
}

.backface-hidden {
  backface-visibility: hidden;
}

.rotate-y-180 {
  transform: rotateY(180deg);
}
*/