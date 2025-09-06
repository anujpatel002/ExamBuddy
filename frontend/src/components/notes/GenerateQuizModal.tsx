'use client';
import { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface GenerateQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (quizName: string, questionCount: number) => void;
  isLoading: boolean;
}

const GenerateQuizModal = ({ isOpen, onClose, onGenerate, isLoading }: GenerateQuizModalProps) => {
  const [name, setName] = useState('');
  const [count, setCount] = useState(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
        // You can add a toast notification here if you like
        return;
    }
    onGenerate(name, count);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generate MCQ Quiz">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="quiz-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Quiz Name:
          </label>
          <Input
            id="quiz-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Chapter 1 Review"
            required
          />
        </div>
        <div>
          <label htmlFor="question-count" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Number of Questions:
          </label>
          <Input
            id="question-count"
            type="number"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            min="1"
            max="20"
            required
          />
        </div>
        <div className="flex justify-end space-x-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={isLoading}>Generate</Button>
        </div>
      </form>
    </Modal>
  );
};

export default GenerateQuizModal;