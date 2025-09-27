import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service - ExamBuddy Usage Agreement & Guidelines',
  description: 'ExamBuddy Terms of Service: Understand your rights and responsibilities when using our AI-powered educational platform, including usage guidelines and service policies.',
  keywords: 'terms of service, usage agreement, educational platform terms, student guidelines, AI platform rules',
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://exambuddy.me/terms',
  }
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-6">Terms of Service</h1>
          <p className="text-gray-600 mb-8">
            <strong>Last Updated:</strong> January 2024
          </p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-600 leading-relaxed">
                Welcome to ExamBuddy! These Terms of Service (&quot;Terms&quot;) govern your use of our AI-powered 
                educational platform, including our website, mobile applications, and related services 
                (collectively, the &quot;Service&quot;). By accessing or using our Service, you agree to be 
                bound by these Terms and our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">2. Description of Service</h2>
              <p className="text-gray-600 mb-4">
                ExamBuddy provides an AI-powered educational platform that offers:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Personalized study plans and adaptive learning algorithms</li>
                <li>OCR technology for digitizing handwritten notes and textbooks</li>
                <li>AI-powered quiz generation and doubt resolution</li>
                <li>Multilingual support for Hindi, Gujarati, and English</li>
                <li>Performance analytics and progress tracking</li>
                <li>Study group collaboration and peer learning features</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">3. User Accounts and Registration</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">3.1 Account Creation</h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li>You must provide accurate, current, and complete information during registration</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                <li>You must be at least 13 years old to create an account (parental consent required for minors)</li>
                <li>One person may maintain only one active account</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">3.2 Account Security</h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>You are responsible for all activities under your account</li>
                <li>Notify us immediately of any unauthorized access or security breach</li>
                <li>Use strong passwords and enable two-factor authentication when available</li>
                <li>Do not share your account credentials with others</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">4. Acceptable Use Policy</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">4.1 Permitted Uses</h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li>Use the Service for legitimate educational purposes</li>
                <li>Upload your own study materials and notes</li>
                <li>Collaborate respectfully with other users</li>
                <li>Provide feedback to improve the platform</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">4.2 Prohibited Activities</h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Uploading copyrighted material without proper authorization</li>
                <li>Using the Service for cheating, academic dishonesty, or exam fraud</li>
                <li>Attempting to reverse engineer, modify, or hack the platform</li>
                <li>Creating fake accounts or impersonating others</li>
                <li>Sharing inappropriate, harmful, or offensive content</li>
                <li>Spamming, phishing, or engaging in malicious activities</li>
                <li>Commercial use without explicit written permission</li>
                <li>Violating any applicable laws or regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">5. Content and Intellectual Property</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">5.1 Your Content</h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li>You retain ownership of content you upload to the platform</li>
                <li>You grant ExamBuddy a license to use your content to provide and improve the Service</li>
                <li>You are responsible for ensuring you have rights to upload all content</li>
                <li>You may delete your content at any time through your account settings</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">5.2 ExamBuddy Content</h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>All ExamBuddy-generated content, features, and functionality are owned by ExamBuddy</li>
                <li>Our AI algorithms, software, and platform design are proprietary</li>
                <li>You may use our content solely for your personal educational purposes</li>
                <li>Commercial redistribution of our content is prohibited</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">6. Subscription and Payment Terms</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">6.1 Free and Premium Services</h3>
              <p className="text-gray-600 mb-4">
                ExamBuddy offers both free and premium subscription tiers with different feature sets and usage limits.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">6.2 Payment and Billing</h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li>Subscription fees are charged in advance on a monthly or annual basis</li>
                <li>All fees are in Indian Rupees (INR) unless otherwise specified</li>
                <li>Payment processing is handled by secure third-party providers</li>
                <li>Price changes will be communicated 30 days in advance</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">6.3 Cancellation and Refunds</h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>You may cancel your subscription at any time through your account</li>
                <li>Cancellation takes effect at the end of your current billing period</li>
                <li>No refunds for partial months, except as required by law</li>
                <li>Free trial cancellations do not result in charges</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">7. Privacy and Data Protection</h2>
              <p className="text-gray-600">
                Your privacy is important to us. Please review our comprehensive Privacy Policy, which 
                explains how we collect, use, and protect your personal information. By using our Service, 
                you consent to our data practices as described in the Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">8. AI and Machine Learning</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">8.1 AI-Generated Content</h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li>Our AI generates study materials, quizzes, and explanations based on your input</li>
                <li>AI-generated content should be used as a study aid, not as a definitive source</li>
                <li>Always verify AI-generated information with authoritative sources</li>
                <li>We continuously improve our AI systems but cannot guarantee 100% accuracy</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">8.2 Learning Analytics</h3>
              <p className="text-gray-600">
                Our AI analyzes your study patterns to provide personalized recommendations. This analysis 
                helps improve your learning experience but should complement, not replace, your educational judgment.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">9. Service Availability and Support</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">9.1 Service Availability</h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li>We strive for 99.9% uptime but cannot guarantee uninterrupted service</li>
                <li>Scheduled maintenance will be announced in advance when possible</li>
                <li>Some features may be temporarily unavailable during updates</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">9.2 Customer Support</h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Support is available via email and live chat during business hours</li>
                <li>Premium users receive priority support</li>
                <li>We aim to respond to support requests within 24-48 hours</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">10. Disclaimers and Limitations</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">10.1 Educational Disclaimer</h3>
              <p className="text-gray-600 mb-4">
                ExamBuddy is a study aid and learning tool. It does not replace formal education, 
                professional tutoring, or official academic resources. Always consult your teachers, 
                textbooks, and official course materials for authoritative information.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">10.2 Service Disclaimer</h3>
              <p className="text-gray-600 mb-4">
                The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind. 
                We do not guarantee that the Service will be error-free, secure, or continuously available.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">10.3 Limitation of Liability</h3>
              <p className="text-gray-600">
                To the maximum extent permitted by law, ExamBuddy shall not be liable for any indirect, 
                incidental, special, or consequential damages arising from your use of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">11. Termination</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">11.1 Termination by You</h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li>You may terminate your account at any time through account settings</li>
                <li>Upon termination, you lose access to premium features immediately</li>
                <li>Your content may be retained for a reasonable period as described in our Privacy Policy</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">11.2 Termination by ExamBuddy</h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>We may suspend or terminate accounts that violate these Terms</li>
                <li>We will provide notice when possible, except for serious violations</li>
                <li>Refunds may be provided at our discretion for prepaid amounts</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">12. Changes to Terms</h2>
              <p className="text-gray-600">
                We may modify these Terms periodically. Material changes will be communicated via email 
                or platform notification at least 30 days before taking effect. Continued use of the 
                Service after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">13. Governing Law and Disputes</h2>
              <p className="text-gray-600 mb-4">
                These Terms are governed by the laws of India. Any disputes will be resolved through:
              </p>
              <ol className="list-decimal pl-6 text-gray-600 space-y-2">
                <li>Good faith negotiation between the parties</li>
                <li>Mediation, if negotiation fails</li>
                <li>Arbitration under Indian Arbitration and Conciliation Act, 2015</li>
                <li>Courts in Mumbai, Maharashtra, India (as a last resort)</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">14. Contact Information</h2>
              <div className="bg-blue-50 rounded-lg p-6">
                <p className="text-gray-600 mb-4">
                  <strong>For questions about these Terms or our Service:</strong>
                </p>
                <ul className="text-gray-600 space-y-2">
                  <li><strong>Email:</strong> legal@exambuddy.me</li>
                  <li><strong>Support:</strong> support@exambuddy.me</li>
                  <li><strong>Address:</strong> ExamBuddy Legal Department, Mumbai, Maharashtra, India</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">15. Severability</h2>
              <p className="text-gray-600">
                If any provision of these Terms is found to be unenforceable, the remaining provisions 
                will continue in full force and effect. The unenforceable provision will be replaced 
                with an enforceable provision that most closely reflects the original intent.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">16. Entire Agreement</h2>
              <p className="text-gray-600">
                These Terms, together with our Privacy Policy and any additional terms you agree to, 
                constitute the entire agreement between you and ExamBuddy regarding the Service.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}