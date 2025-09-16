'use client';
import { FiMenu } from 'react-icons/fi';
import ThemeToggleButton from '../ui/ThemeToggleButton';
import { useScrollSticky } from '@/hooks/useScrollSticky';

interface NavbarProps {
  toggleSidebar: () => void;
}

const Navbar = ({ toggleSidebar }: NavbarProps) => {
  const isScrolled = useScrollSticky(50);
  
  return (
    <header className={`md:hidden navbar glass-card backdrop-blur-xl shadow-lg p-4 flex justify-between items-center ${isScrolled ? 'scrolled' : ''}`}>
      <button onClick={toggleSidebar} aria-label="Open sidebar" className="p-2 theme-text-primary hover:theme-bg-secondary rounded-xl transition-all duration-300">
        <FiMenu className="w-6 h-6" />
      </button>
      <div className="text-center">
        <span className="text-xl font-bold theme-text-primary">ExamBuddy</span>
        <p className="text-xs theme-text-muted">AI Learning</p>
      </div>
      <div className="w-10"></div>
    </header>
  );
};

export default Navbar;