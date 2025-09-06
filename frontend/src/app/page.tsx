'use client';
import Link from 'next/link';
import { FiZap, FiBookOpen, FiUsers, FiArrowRight } from 'react-icons/fi';
import ThemeToggleButton from '@/components/ui/ThemeToggleButton';
import { useAuth } from '@/hooks/useAuth';
import Spinner from '@/components/ui/Spinner';

export default function HomePage() {
  const { user, loading } = useAuth();

  const AuthButtons = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-12 w-48">
          <Spinner />
        </div>
      );
    }

    if (user) {
      // If user is logged in, show a link to their dashboard
      return (
        <Link
          href="/dashboard"
          className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-300 flex items-center gap-2"
        >
          Go to Dashboard <FiArrowRight />
        </Link>
      );
    }

    // If user is not logged in, show the original buttons
    return (
      <div className="flex justify-center space-x-4">
        <Link
          href="/register"
          className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-300"
        >
          Get Started
        </Link>
        <Link
          href="/login"
          className="px-8 py-3 bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-300 font-semibold rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
        >
          Login
        </Link>
      </div>
    );
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-300">
      <div className="absolute top-4 right-4">
        <ThemeToggleButton />
      </div>
      <div className="text-center max-w-4xl">
        <header className="mb-8">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white">
            Welcome to <span className="text-indigo-600 dark:text-indigo-400">ExamBuddy</span>
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Your all-in-one platform for smart, efficient, and collaborative exam preparation.
          </p>
        </header>

        <section className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <FiZap className="w-10 h-10 text-indigo-500 dark:text-indigo-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">AI-Powered Revision</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Automatically generate flashcards and concise summaries from your notes.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <FiBookOpen className="w-10 h-10 text-indigo-500 dark:text-indigo-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Smart Practice</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Practice with AI-generated MCQs and descriptive questions.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <FiUsers className="w-10 h-10 text-indigo-500 dark:text-indigo-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Group Study Rooms</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Take timed quizzes with friends and compete in real-time.
            </p>
          </div>
        </section>

        <section className="mt-12">
          <AuthButtons />
        </section>
      </div>
    </main>
  );
}