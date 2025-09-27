import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'ExamBuddy Features - AI Study Tools, OCR Notes Scanner & Quiz Generator',
  description: 'Explore ExamBuddy\'s powerful features: AI-powered study plans, OCR notes scanning, quiz generation, doubt solver, multilingual support, and adaptive learning for exam success.',
  keywords: 'AI study tools, OCR scanner, quiz generator, doubt solver, adaptive learning, multilingual education, exam preparation features',
  openGraph: {
    title: 'ExamBuddy Features - Complete AI Study Platform',
    description: 'Discover all features of ExamBuddy: AI tutoring, OCR notes scanning, personalized quizzes, doubt resolution, and multilingual support for Indian students.',
    type: 'website',
    locale: 'en_IN',
  },
  alternates: {
    canonical: 'https://exambuddy.me/features',
  }
}

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            Powerful Features for Academic Success
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Discover how ExamBuddy&apos;s AI-powered features revolutionize your study experience 
            with personalized learning, smart tools, and multilingual support.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          
          {/* AI-Powered Study Plans */}
          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">🧠</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">AI-Powered Study Plans</h2>
            </div>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Our advanced AI analyzes your learning patterns, strengths, and weaknesses to create 
              personalized study schedules that adapt in real-time to maximize your exam performance.
            </p>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Adaptive learning algorithms that adjust to your progress
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Smart scheduling based on exam dates and difficulty levels
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Performance tracking with detailed analytics
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Personalized recommendations for improvement
              </li>
            </ul>
          </div>

          {/* OCR Notes Scanner */}
          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">📸</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Advanced OCR Notes Scanner</h2>
            </div>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Transform handwritten notes and textbooks into searchable digital content with our 
              industry-leading OCR technology supporting multiple Indian languages including Hindi and Gujarati.
            </p>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                99%+ accuracy for printed and handwritten text
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Support for Hindi, Gujarati, and English scripts
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Instant digitization of complex mathematical equations
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Smart text organization and categorization
              </li>
            </ul>
          </div>

          {/* Intelligent Quiz Generator */}
          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">📝</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Intelligent Quiz Generator</h2>
            </div>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Create unlimited practice quizzes from your study materials using AI. Our system generates 
              questions that match exam patterns and difficulty levels for comprehensive preparation.
            </p>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Auto-generate quizzes from any study material
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Multiple question types: MCQ, short answer, essay
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Difficulty-based question selection
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Instant feedback with detailed explanations
              </li>
            </ul>
          </div>

          {/* AI Doubt Solver */}
          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">24/7 AI Doubt Solver</h2>
            </div>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Get instant solutions to your academic questions with our advanced AI tutor. Simply ask 
              questions in text or upload images of problems for step-by-step explanations.
            </p>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Instant doubt resolution across 50+ subjects
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Step-by-step solution explanations
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Image-based question recognition
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Available 24/7 with multilingual support
              </li>
            </ul>
          </div>

          {/* Multilingual Learning */}
          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">🌍</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Multilingual Learning Platform</h2>
            </div>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Study in your preferred language with full support for Hindi, Gujarati, and English. 
              All features work seamlessly across languages with intelligent translation capabilities.
            </p>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Complete interface in Hindi, Gujarati, and English
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Smart language switching without losing context
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Native script support for regional languages
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Cultural context-aware content recommendations
              </li>
            </ul>
          </div>

          {/* Adaptive Learning Engine */}
          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Adaptive Learning Engine</h2>
            </div>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Our machine learning algorithms continuously adapt to your learning style, pace, and 
              preferences to optimize your study experience and maximize retention rates.
            </p>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Real-time difficulty adjustment based on performance
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Learning style identification and optimization
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Spaced repetition algorithms for better retention
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Progress prediction and early intervention alerts
              </li>
            </ul>
          </div>
        </div>

        {/* Additional Features */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">More Powerful Tools</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Performance Analytics</h3>
              <p className="text-gray-600">
                Detailed insights into your study patterns, strengths, weaknesses, and progress 
                tracking with beautiful visualizations.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Study Groups</h3>
              <p className="text-gray-600">
                Collaborate with peers, share notes, create group quizzes, and participate 
                in study rooms for collaborative learning.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏆</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Gamification</h3>
              <p className="text-gray-600">
                Earn points, badges, and achievements as you study. Compete with friends 
                and climb leaderboards to stay motivated.
              </p>
            </div>
          </div>
        </div>

        {/* Integration Features */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white mb-12">
          <h2 className="text-3xl font-bold mb-6 text-center">Seamless Integration</h2>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-4">Works Everywhere</h3>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <span className="text-yellow-300 mr-2">•</span>
                  Cross-platform: Web, Android, iOS apps
                </li>
                <li className="flex items-center">
                  <span className="text-yellow-300 mr-2">•</span>
                  Offline mode for studying without internet
                </li>
                <li className="flex items-center">
                  <span className="text-yellow-300 mr-2">•</span>
                  Cloud sync across all your devices
                </li>
                <li className="flex items-center">
                  <span className="text-yellow-300 mr-2">•</span>
                  Export notes to PDF, Word, and Google Docs
                </li>
                <li className="flex items-center">
                  <span className="text-yellow-300 mr-2">•</span>
                  Integration with popular study tools and calendars
                </li>
              </ul>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4">Trusted by Students Nationwide</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-3xl font-bold">100,000+</div>
                  <div className="opacity-90">Active Users</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">50+</div>
                  <div className="opacity-90">Subjects</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">95%</div>
                  <div className="opacity-90">Success Rate</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">4.9/5</div>
                  <div className="opacity-90">User Rating</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Ready to Experience These Features?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of successful students who use ExamBuddy for exam preparation
          </p>
          <div className="space-x-4">
            <Link 
              href="/signup" 
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Start Free Trial
            </Link>
            <Link 
              href="/demo" 
              className="inline-block border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition-colors"
            >
              Watch Demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}