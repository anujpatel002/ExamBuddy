'use client';
import { useTheme } from 'next-themes';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useState, useEffect } from 'react';

const ThemeToggleButton = () => {
  const [mounted, setMounted] = useState(false);
  // Get the 'resolvedTheme' which is the actual theme being displayed
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <button
      // The logic now uses 'resolvedTheme' to decide what to switch to
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-xl glass-card backdrop-blur-sm theme-text-secondary hover:theme-bg-secondary hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl"
      aria-label="Toggle theme"
    >
      {/* The icon also uses 'resolvedTheme' to be accurate */}
      {resolvedTheme === 'dark' ? 
        <FiSun className="w-5 h-5 text-yellow-500 hover:rotate-180 transition-transform duration-500" /> : 
        <FiMoon className="w-5 h-5 text-indigo-600 hover:rotate-12 transition-transform duration-300" />
      }
    </button>
  );
};

export default ThemeToggleButton;