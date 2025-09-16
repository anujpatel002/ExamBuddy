'use client';
import Link from 'next/link';
import { FiZap, FiBookOpen, FiUsers, FiArrowRight, FiStar, FiTrendingUp, FiPlay } from 'react-icons/fi';
import ThemeToggleButton from '@/components/ui/ThemeToggleButton';
import { useAuth } from '@/hooks/useAuth';
import Spinner from '@/components/ui/Spinner';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [counters, setCounters] = useState({ students: 0, questions: 0, success: 0 });

  useEffect(() => {
    setIsVisible(true);
    
    // Animated counters
    const animateCounters = () => {
      const duration = 2000;
      const steps = 60;
      const stepDuration = duration / steps;
      
      let step = 0;
      const timer = setInterval(() => {
        step++;
        const progress = step / steps;
        
        setCounters({
          students: Math.floor(50000 * progress),
          questions: Math.floor(2000000 * progress),
          success: Math.floor(95 * progress)
        });
        
        if (step >= steps) clearInterval(timer);
      }, stepDuration);
    };
    
    const timer = setTimeout(animateCounters, 1000);
    
    // Auto-rotate features
    const featureTimer = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 3);
    }, 3000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(featureTimer);
    };
  }, []);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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
          className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-purple-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <span className="relative z-10">Go to Dashboard</span>
          <FiArrowRight className="relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
        </Link>
      );
    }

    // If user is not logged in, show the original buttons
    return (
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Link
          href="/register"
          className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-purple-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <span className="relative z-10">Get Started</span>
        </Link>
        <Link
          href="/login"
          className="group relative px-8 py-4 bg-gray-800/30 backdrop-blur-md text-white font-semibold rounded-xl border border-gray-700/50 hover:bg-gray-700/40 hover:border-gray-600/60 transform hover:scale-105 transition-all duration-300"
        >
          <span className="relative z-10">Login</span>
        </Link>
      </div>
    );
  };

  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden">
      {/* Interactive Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20"></div>
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float transition-transform duration-1000 ease-out"
          style={{
            left: `${20 + mousePosition.x * 0.02}%`,
            top: `${25 + mousePosition.y * 0.01}%`,
          }}
        ></div>
        <div 
          className="absolute w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-float-delayed transition-transform duration-1000 ease-out"
          style={{
            right: `${20 + mousePosition.x * 0.015}%`,
            top: `${75 - mousePosition.y * 0.01}%`,
          }}
        ></div>
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
        
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => {
          const left = 10 + (i * 4.5) % 90;
          const top = 15 + (i * 3.7) % 80;
          const delay = (i * 0.3) % 3;
          const duration = 3 + (i % 4);
          
          return (
            <div
              key={i}
              className="absolute w-2 h-2 bg-blue-500/20 rounded-full animate-float"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`
              }}
            ></div>
          );
        })}
      </div>



      {/* Main Content */}
      <div className="relative z-10 text-center max-w-6xl mx-auto px-6">
        {/* Interactive Hero Section */}
        <header className={`mb-16 transition-all duration-1000 ${isVisible ? 'animate-fade-in-up' : 'opacity-0 translate-y-10'}`}>
          <div className="mb-6">
            <div className="group inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm border border-blue-700/30 rounded-full text-sm font-medium text-blue-300 mb-8 hover:scale-105 transition-all duration-300 cursor-pointer">
              <FiStar className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
              <span>AI-Powered Learning Platform</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </div>
          
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 group cursor-default">
            <span className="bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent hover:scale-105 transition-transform duration-300 inline-block">
              Welcome to
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent animate-gradient hover:scale-110 transition-transform duration-300 inline-block">
              ExamBuddy
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed hover:text-gray-100 transition-colors duration-300">
            Transform your study experience with AI-powered tools, collaborative learning, and intelligent practice sessions.
          </p>
          
          {/* Interactive Demo Button */}
          <div className="mt-8">
            <button className="group relative inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm border border-blue-700/40 rounded-xl text-blue-300 font-medium hover:scale-105 transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <FiPlay className="w-5 h-5 group-hover:scale-110 transition-transform duration-300 relative z-10" />
              <span className="relative z-10">Watch Demo</span>
            </button>
          </div>
        </header>

        {/* Interactive Statistics Section */}
        <section className={`mb-16 transition-all duration-1000 ${isVisible ? 'animate-fade-in-up animation-delay-200' : 'opacity-0 translate-y-10'}`}>
          <div className="glass-card p-8 rounded-3xl mb-12 hover:scale-105 transition-all duration-500 group">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              <div className="text-center group/stat hover:scale-110 transition-all duration-300 cursor-pointer">
                <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 group-hover/stat:animate-pulse drop-shadow-lg">
                  {counters.students.toLocaleString()}+
                </div>
                <div className="text-xs sm:text-sm text-gray-200 font-medium group-hover/stat:text-blue-400 transition-colors duration-300">Active Students</div>
              </div>
              <div className="text-center group/stat hover:scale-110 transition-all duration-300 cursor-pointer">
                <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 group-hover/stat:animate-pulse drop-shadow-lg">
                  {Math.floor(counters.questions / 1000)}M+
                </div>
                <div className="text-xs sm:text-sm text-gray-200 font-medium group-hover/stat:text-purple-400 transition-colors duration-300">Questions Generated</div>
              </div>
              <div className="text-center group/stat hover:scale-110 transition-all duration-300 cursor-pointer">
                <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 group-hover/stat:animate-pulse drop-shadow-lg">
                  {counters.success}%
                </div>
                <div className="text-xs sm:text-sm text-gray-200 font-medium group-hover/stat:text-indigo-400 transition-colors duration-300">Success Rate</div>
              </div>
              <div className="text-center group/stat hover:scale-110 transition-all duration-300 cursor-pointer">
                <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 group-hover/stat:animate-pulse drop-shadow-lg">
                  24/7
                </div>
                <div className="text-xs sm:text-sm text-gray-200 font-medium group-hover/stat:text-blue-400 transition-colors duration-300">AI Availability</div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Features Grid */}
        <section className={`mb-16 transition-all duration-1000 ${isVisible ? 'animate-fade-in-up animation-delay-300' : 'opacity-0 translate-y-10'}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div 
              className={`group glass-card p-8 rounded-2xl hover:scale-105 transition-all duration-500 cursor-pointer ${
                activeFeature === 0 ? 'ring-2 ring-blue-500/50 shadow-2xl shadow-blue-500/20' : ''
              }`}
              onClick={() => setActiveFeature(0)}
            >
              <div className="glass-icon-container w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                <FiZap className="w-8 h-8 text-blue-400 group-hover:animate-pulse" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                AI-Powered Revision
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4 group-hover:text-gray-800 dark:group-hover:text-gray-100 transition-colors duration-300">
                Automatically generate flashcards, summaries, and mind maps from your notes using advanced AI technology.
              </p>
              <div className="text-sm text-blue-600 dark:text-blue-400 font-semibold group-hover:animate-bounce">
                ⚡ 10x faster than manual creation
              </div>
              {activeFeature === 0 && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200/30 dark:border-blue-700/30 animate-fade-in">
                  <div className="text-xs text-blue-700 dark:text-blue-300">✨ Active Feature</div>
                </div>
              )}
            </div>

            {/* Feature 2 */}
            <div 
              className={`group glass-card p-8 rounded-2xl hover:scale-105 transition-all duration-500 cursor-pointer ${
                activeFeature === 1 ? 'ring-2 ring-purple-500/50 shadow-2xl shadow-purple-500/20' : ''
              }`}
              onClick={() => setActiveFeature(1)}
            >
              <div className="glass-icon-container w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                <FiTrendingUp className="w-8 h-8 text-purple-400 group-hover:animate-pulse" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
                Smart Practice
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4 group-hover:text-gray-800 dark:group-hover:text-gray-100 transition-colors duration-300">
                Practice with AI-generated questions, track your progress, and identify areas for improvement.
              </p>
              <div className="text-sm text-purple-600 dark:text-purple-400 font-semibold group-hover:animate-bounce">
                📈 85% improvement in test scores
              </div>
              {activeFeature === 1 && (
                <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200/30 dark:border-purple-700/30 animate-fade-in">
                  <div className="text-xs text-purple-700 dark:text-purple-300">✨ Active Feature</div>
                </div>
              )}
            </div>

            {/* Feature 3 */}
            <div 
              className={`group glass-card p-8 rounded-2xl hover:scale-105 transition-all duration-500 cursor-pointer ${
                activeFeature === 2 ? 'ring-2 ring-indigo-500/50 shadow-2xl shadow-indigo-500/20' : ''
              }`}
              onClick={() => setActiveFeature(2)}
            >
              <div className="glass-icon-container w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-indigo-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                <FiUsers className="w-8 h-8 text-indigo-400 group-hover:animate-pulse" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
                Collaborative Learning
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4 group-hover:text-gray-800 dark:group-hover:text-gray-100 transition-colors duration-300">
                Join study rooms, compete with friends, and learn together in real-time collaborative sessions.
              </p>
              <div className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold group-hover:animate-bounce">
                👥 Join 15K+ active study groups
              </div>
              {activeFeature === 2 && (
                <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200/30 dark:border-indigo-700/30 animate-fade-in">
                  <div className="text-xs text-indigo-700 dark:text-indigo-300">✨ Active Feature</div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Performance Metrics */}
        <section className="mb-16 animate-fade-in-up animation-delay-700">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Proven Results That Matter
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Our AI-powered platform delivers measurable improvements in learning outcomes
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-card p-8 rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Study Efficiency</h3>
                <div className="text-3xl font-bold text-green-400">+300%</div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Time Saved per Session</span>
                  <span className="font-semibold text-blue-400">2.5 hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Retention Rate</span>
                  <span className="font-semibold text-purple-400">92%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Concept Mastery</span>
                  <span className="font-semibold text-indigo-400">88%</span>
                </div>
              </div>
            </div>
            
            <div className="glass-card p-8 rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">AI Performance</h3>
                <div className="text-3xl font-bold text-blue-400">99.9%</div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Response Accuracy</span>
                  <span className="font-semibold text-green-400">97.8%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Processing Speed</span>
                  <span className="font-semibold text-purple-400">&lt;0.5s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Uptime</span>
                  <span className="font-semibold text-blue-400">99.9%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive CTA Section */}
        <section className={`transition-all duration-1000 ${isVisible ? 'animate-fade-in-up animation-delay-800' : 'opacity-0 translate-y-10'}`}>
          <div className="glass-card p-8 rounded-3xl mb-8 hover:scale-105 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-white mb-4 group-hover:scale-105 transition-transform duration-300">
                Ready to revolutionize your learning?
              </h2>
              <p className="text-gray-300 mb-8 text-lg group-hover:text-gray-100 transition-colors duration-300">
                Join <span className="font-bold text-blue-400 animate-pulse">50,000+</span> students who are already studying smarter with ExamBuddy.
              </p>
              <div className="transform group-hover:scale-105 transition-transform duration-300">
                <AuthButtons />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}