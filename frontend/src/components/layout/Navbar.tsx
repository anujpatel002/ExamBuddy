'use client';
import { FiMenu } from 'react-icons/fi';
import ThemeToggleButton from '../ui/ThemeToggleButton';

interface NavbarProps {
  toggleSidebar: () => void;
}

const Navbar = ({ toggleSidebar }: NavbarProps) => {
  return (
    <header className="md:hidden bg-white dark:bg-gray-900 shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
      <button onClick={toggleSidebar} aria-label="Open sidebar" className="p-2 text-gray-800 dark:text-gray-200">
        <FiMenu className="w-6 h-6" />
      </button>
      <span className="text-xl font-bold text-indigo-600">ExamBuddy</span>
      <div></div>
    </header>
  );
};

export default Navbar;