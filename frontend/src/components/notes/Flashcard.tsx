'use client';
import { useState } from 'react';
import Button from '../ui/Button';

interface FlashcardProps {
  flashcard: { question: string; answer: string; };
}

const Flashcard = ({ flashcard }: FlashcardProps) => {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md p-5 flex flex-col min-h-60 max-h-96">
      <div className="flex-shrink-0 mb-4">
        <span className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 mb-2 block">QUESTION</span>
        <p className="text-base font-medium text-gray-800 dark:text-gray-200 break-words">{flashcard.question}</p>
      </div>
      <div className="flex-1 flex flex-col">
        {showAnswer ? (
          <div className="flex-1 flex flex-col">
            <span className="text-xs font-semibold text-green-600 dark:text-green-400 mb-2 block flex-shrink-0">ANSWER</span>
            <div className="flex-1 overflow-y-auto">
              <p className="text-base text-gray-900 dark:text-gray-100 break-words whitespace-pre-wrap">{flashcard.answer}</p>
            </div>
            <Button variant="secondary" onClick={() => setShowAnswer(false)} className="w-full mt-3 flex-shrink-0">
              Hide Answer
            </Button>
          </div>
        ) : (
          <div className="flex-1 flex items-end">
            <Button variant="secondary" onClick={() => setShowAnswer(true)} className="w-full">
              Show Answer
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
export default Flashcard;