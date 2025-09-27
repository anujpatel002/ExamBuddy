import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About ExamBuddy - AI-Powered Study Platform for Indian Students',
  description: 'Learn about ExamBuddy, the leading AI-powered educational platform helping over 100,000 students across India ace their exams with personalized study plans, OCR notes scanning, and multilingual support.',
  keywords: 'ExamBuddy, AI education, study platform, Indian students, exam preparation, AI tutor, educational technology',
  openGraph: {
    title: 'About ExamBuddy - AI-Powered Study Platform for Indian Students',
    description: 'Discover how ExamBuddy revolutionizes education with AI-powered learning, multilingual support, and innovative study tools for students across India.',
    type: 'website',
    locale: 'en_IN',
  },
  alternates: {
    canonical: 'https://exambuddy.me/about',
    languages: {
      'hi': 'https://exambuddy.me/hi/about',
      'gu': 'https://exambuddy.me/gu/about',
    }
  }
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            Revolutionizing Education with AI
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            ExamBuddy is India&apos;s most advanced AI-powered educational platform, empowering over 
            <strong className="text-blue-600"> 100,000+ students</strong> to achieve academic excellence 
            through personalized learning and cutting-edge technology.
          </p>
        </div>

        {/* Mission Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Our Mission</h2>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                At ExamBuddy, we believe every student deserves access to world-class education. 
                Our AI-powered platform breaks down barriers in traditional learning by providing:
              </p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-500 font-bold mr-2">✓</span>
                  Personalized study plans adapted to individual learning styles
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 font-bold mr-2">✓</span>
                  Multilingual support for Hindi, Gujarati, and English
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 font-bold mr-2">✓</span>
                  Advanced OCR technology for instant notes digitization
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 font-bold mr-2">✓</span>
                  Real-time doubt resolution with AI tutoring
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 p-6 rounded-xl">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Key Statistics</h3>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">100,000+</div>
                  <div className="text-gray-600">Active Students</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">50+</div>
                  <div className="text-gray-600">Subjects Covered</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">95%</div>
                  <div className="text-gray-600">Exam Success Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Why Choose ExamBuddy?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-xl font-bold mb-3">AI-Powered Learning</h3>
              <p className="text-gray-600">
                Advanced artificial intelligence analyzes your learning patterns and creates 
                personalized study plans for maximum efficiency.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="text-xl font-bold mb-3">OCR Technology</h3>
              <p className="text-gray-600">
                Scan handwritten notes and textbooks instantly with our advanced OCR system 
                supporting multiple Indian languages.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌍</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Multilingual Support</h3>
              <p className="text-gray-600">
                Study in your preferred language with support for Hindi, Gujarati, and English 
                across all features and content.
              </p>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Our Vision</h2>
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              Founded in 2023, ExamBuddy emerged from a simple yet powerful vision: to democratize 
              quality education across India using artificial intelligence. Our team of educators, 
              technologists, and AI researchers work tirelessly to create innovative solutions that 
              make learning more accessible, engaging, and effective.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              From small towns to metropolitan cities, ExamBuddy serves students preparing for 
              board exams, competitive tests, and professional certifications. We&apos;re not just 
              building an app – we&apos;re creating the future of education in India.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Studies?</h2>
          <p className="text-xl mb-6 opacity-90">
            Join over 100,000 students who trust ExamBuddy for their academic success
          </p>
          <div className="space-x-4">
            <Link 
              href="/signup" 
              className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Get Started Free
            </Link>
            <Link 
              href="/features" 
              className="inline-block border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              Explore Features
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}