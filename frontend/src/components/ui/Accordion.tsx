'use client';
import { useState, ReactNode } from 'react';
import { FiChevronDown } from 'react-icons/fi';

interface AccordionProps {
  title: string;
  children: ReactNode;
}

const Accordion = ({ title, children }: AccordionProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center py-4 text-left gap-4"
      >
        <span className="font-semibold text-gray-900 dark:text-gray-100">{title}</span>
        <FiChevronDown className={`transform transition-transform duration-300 text-gray-500 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-screen pb-4' : 'max-h-0'}`}>
        {/* The answer text will use the default prose colors */}
        {children}
      </div>
    </div>
  );
};

export default Accordion;