'use client';
import { useState } from 'react';
import Button from '../ui/Button';

interface FlashcardProps {
  flashcard: { question: string; answer: string; };
}

const Flashcard = ({ flashcard }: FlashcardProps) => {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md p-5 flex flex-col justify-between h-60">
      <div>
        <span className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 mb-2 block">QUESTION</span>
        <p className="text-base font-medium text-gray-800 dark:text-gray-200">{flashcard.question}</p>
      </div>
      <div>
        {showAnswer ? (
          <div>
            <span className="text-xs font-semibold text-green-600 dark:text-green-400 mb-2 block">ANSWER</span>
            <p className="text-base text-gray-900 dark:text-gray-100">{flashcard.answer}</p>
          </div>
        ) : (
          <Button variant="secondary" onClick={() => setShowAnswer(true)} className="w-full">
            Show Answer
          </Button>
        )}
      </div>
    </div>
  );
};
export default Flashcard;