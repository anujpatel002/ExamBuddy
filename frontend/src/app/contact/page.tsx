import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Contact ExamBuddy - Get Support & Connect with Our Team',
  description: 'Get in touch with ExamBuddy support team. Contact us for technical help, partnerships, media inquiries, or feedback about our AI-powered study platform.',
  keywords: 'ExamBuddy contact, customer support, technical help, partnership inquiry, media contact, student support',
  openGraph: {
    title: 'Contact ExamBuddy - Support & Partnerships',
    description: 'Reach out to ExamBuddy for support, partnerships, or any questions about our AI-powered educational platform.',
    type: 'website',
    locale: 'en_IN',
  },
  alternates: {
    canonical: 'https://exambuddy.me/contact',
  }
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            Get in Touch with ExamBuddy
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            We&apos;re here to help you succeed. Reach out for support, partnerships, 
            or any questions about our AI-powered educational platform.
          </p>
        </div>

        {/* Contact Options */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          
          {/* Student Support */}
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center hover:shadow-2xl transition-shadow">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">🎓</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Student Support</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Need help with features, account issues, or technical problems? 
              Our student success team is here to assist you.
            </p>
            <div className="space-y-3 text-left mb-6">
              <div className="flex items-center">
                <span className="text-blue-500 mr-3">📧</span>
                <span className="text-gray-700">support@exambuddy.me</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-500 mr-3">💬</span>
                <span className="text-gray-700">Live Chat (9 AM - 9 PM IST)</span>
              </div>
              <div className="flex items-center">
                <span className="text-purple-500 mr-3">⏰</span>
                <span className="text-gray-700">Response within 2 hours</span>
              </div>
            </div>
            <Link 
              href="mailto:support@exambuddy.me" 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-block"
            >
              Contact Support
            </Link>
          </div>

          {/* Business & Partnerships */}
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center hover:shadow-2xl transition-shadow">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">🤝</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Business & Partnerships</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Interested in partnerships, integrations, or institutional licensing? 
              Let&apos;s explore collaboration opportunities.
            </p>
            <div className="space-y-3 text-left mb-6">
              <div className="flex items-center">
                <span className="text-green-500 mr-3">📧</span>
                <span className="text-gray-700">partnerships@exambuddy.me</span>
              </div>
              <div className="flex items-center">
                <span className="text-blue-500 mr-3">🏢</span>
                <span className="text-gray-700">Institutional Sales</span>
              </div>
              <div className="flex items-center">
                <span className="text-purple-500 mr-3">🔗</span>
                <span className="text-gray-700">API Integrations</span>
              </div>
            </div>
            <Link 
              href="mailto:partnerships@exambuddy.me" 
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors inline-block"
            >
              Discuss Partnership
            </Link>
          </div>

          {/* Media & Press */}
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center hover:shadow-2xl transition-shadow">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">📰</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Media & Press</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Journalists, bloggers, and content creators welcome! 
              Get press kits, interviews, and latest company updates.
            </p>
            <div className="space-y-3 text-left mb-6">
              <div className="flex items-center">
                <span className="text-purple-500 mr-3">📧</span>
                <span className="text-gray-700">press@exambuddy.me</span>
              </div>
              <div className="flex items-center">
                <span className="text-red-500 mr-3">📱</span>
                <span className="text-gray-700">Press Kit & Resources</span>
              </div>
              <div className="flex items-center">
                <span className="text-blue-500 mr-3">🎤</span>
                <span className="text-gray-700">Interview Requests</span>
              </div>
            </div>
            <Link 
              href="mailto:press@exambuddy.me" 
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors inline-block"
            >
              Media Inquiry
            </Link>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Send Us a Message</h2>
          <form className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="name" className="block text-gray-700 font-semibold mb-2">
                  Full Name *
                </label>
                <input 
                  type="text" 
                  id="name" 
                  name="name"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-gray-700 font-semibold mb-2">
                  Email Address *
                </label>
                <input 
                  type="email" 
                  id="email" 
                  name="email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your.email@example.com"
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="subject" className="block text-gray-700 font-semibold mb-2">
                  Subject *
                </label>
                <select 
                  id="subject" 
                  name="subject"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a subject</option>
                  <option value="technical-support">Technical Support</option>
                  <option value="account-help">Account Help</option>
                  <option value="feature-request">Feature Request</option>
                  <option value="partnership">Partnership Inquiry</option>
                  <option value="media">Media & Press</option>
                  <option value="feedback">General Feedback</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="phone" className="block text-gray-700 font-semibold mb-2">
                  Phone Number
                </label>
                <input 
                  type="tel" 
                  id="phone" 
                  name="phone"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="message" className="block text-gray-700 font-semibold mb-2">
                Message *
              </label>
              <textarea 
                id="message" 
                name="message"
                required
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                placeholder="Tell us how we can help you..."
              ></textarea>
            </div>

            <div className="text-center">
              <button 
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-colors"
              >
                Send Message
              </button>
            </div>
          </form>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="max-w-4xl mx-auto space-y-6">
            
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                How quickly do you respond to support requests?
              </h3>
              <p className="text-gray-600">
                We typically respond to all support emails within 2 hours during business hours (9 AM - 9 PM IST). 
                For urgent issues, use our live chat for immediate assistance.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Do you offer phone support?
              </h3>
              <p className="text-gray-600">
                Currently, we provide support through email and live chat. Phone support is available for 
                enterprise customers and partnership discussions.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Can I schedule a demo or product walkthrough?
              </h3>
              <p className="text-gray-600">
                Yes! Contact our partnerships team to schedule a personalized demo, especially for 
                educational institutions or bulk licensing inquiries.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                How can I report a bug or suggest a feature?
              </h3>
              <p className="text-gray-600">
                Use the contact form above with &quot;Feature Request&quot; or contact our support team. 
                We love hearing from our users and prioritize feedback-driven improvements.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Do you have a physical office I can visit?
              </h3>
              <p className="text-gray-600">
                ExamBuddy operates as a digital-first company. For in-person meetings, please contact 
                our partnerships team to arrange a meeting at our offices in major Indian cities.
              </p>
            </div>
          </div>
        </div>

        {/* Office Information */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-6">Our Presence</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">🏢 Headquarters</h3>
                <p className="opacity-90">Mumbai, Maharashtra, India</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">🌐 Global Reach</h3>
                <p className="opacity-90">Serving students across India</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">⏰ Business Hours</h3>
                <p className="opacity-90">Monday - Friday: 9:00 AM - 6:00 PM IST</p>
                <p className="opacity-90">Support: 9:00 AM - 9:00 PM IST</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Connect on Social Media</h2>
            <div className="space-y-4">
              <Link 
                href="#" 
                className="flex items-center p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <span className="text-blue-600 text-xl mr-3">📘</span>
                <span className="text-gray-700 font-semibold">Follow us on Facebook</span>
              </Link>
              <Link 
                href="#" 
                className="flex items-center p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <span className="text-blue-400 text-xl mr-3">🐦</span>
                <span className="text-gray-700 font-semibold">Follow us on Twitter</span>
              </Link>
              <Link 
                href="#" 
                className="flex items-center p-3 rounded-lg bg-pink-50 hover:bg-pink-100 transition-colors"
              >
                <span className="text-pink-600 text-xl mr-3">📷</span>
                <span className="text-gray-700 font-semibold">Follow us on Instagram</span>
              </Link>
              <Link 
                href="#" 
                className="flex items-center p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <span className="text-blue-700 text-xl mr-3">💼</span>
                <span className="text-gray-700 font-semibold">Connect on LinkedIn</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Still Have Questions?</h2>
          <p className="text-xl text-gray-600 mb-8">
            We&apos;re here to help you succeed with ExamBuddy
          </p>
          <Link 
            href="mailto:support@exambuddy.me" 
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-colors inline-block"
          >
            Email Us Directly
          </Link>
        </div>
      </div>
    </div>
  )
}