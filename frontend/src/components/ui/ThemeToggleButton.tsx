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
    // Return a placeholder to avoid layout shift on server render
    return <div className="w-9 h-9" />;
  }

  return (
    <button
      // The logic now uses 'resolvedTheme' to decide what to switch to
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      aria-label="Toggle theme"
    >
      {/* The icon also uses 'resolvedTheme' to be accurate */}
      {resolvedTheme === 'dark' ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
    </button>
  );
};

export default ThemeToggleButton;