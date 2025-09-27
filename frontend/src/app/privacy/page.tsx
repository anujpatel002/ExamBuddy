import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - ExamBuddy Data Protection & Security',
  description: 'ExamBuddy Privacy Policy: Learn how we protect your data, what information we collect, and your privacy rights on our AI-powered educational platform.',
  keywords: 'privacy policy, data protection, security, student privacy, educational data, GDPR compliance',
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://exambuddy.me/privacy',
  }
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-6">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">
            <strong>Last Updated:</strong> January 2024
          </p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">1. Introduction</h2>
              <p className="text-gray-600 leading-relaxed">
                ExamBuddy (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy 
                explains how we collect, use, disclose, and safeguard your information when you use our 
                AI-powered educational platform, including our website, mobile applications, and related services 
                (collectively, the &quot;Service&quot;).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 Personal Information</h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li>Name, email address, and contact information</li>
                <li>Educational background and academic preferences</li>
                <li>Profile information and preferences</li>
                <li>Payment and billing information (processed securely by third-party providers)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.2 Academic Data</h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li>Study materials, notes, and uploaded documents</li>
                <li>Quiz results, performance analytics, and learning progress</li>
                <li>Questions asked and AI interaction history</li>
                <li>Study patterns and learning preferences</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.3 Technical Information</h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li>Device information, IP address, and browser type</li>
                <li>Usage data, session information, and app interactions</li>
                <li>Cookies and similar tracking technologies</li>
                <li>Location data (with your consent)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Educational Services:</strong> Provide personalized learning experiences, AI tutoring, and study recommendations</li>
                <li><strong>Platform Improvement:</strong> Analyze usage patterns to enhance our AI algorithms and user experience</li>
                <li><strong>Communication:</strong> Send important updates, educational content, and support responses</li>
                <li><strong>Security:</strong> Detect fraud, ensure platform security, and protect user accounts</li>
                <li><strong>Legal Compliance:</strong> Meet legal obligations and enforce our terms of service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">4. Information Sharing and Disclosure</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">We DO NOT sell your personal information.</h3>
              
              <p className="text-gray-600 mb-4">We may share your information only in these limited circumstances:</p>
              
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Service Providers:</strong> Third-party vendors who help operate our platform (with strict data protection agreements)</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or legal process</li>
                <li><strong>Safety Protection:</strong> To protect the rights, property, or safety of ExamBuddy, our users, or others</li>
                <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales (with user notification)</li>
                <li><strong>Consent:</strong> When you explicitly consent to sharing with specific third parties</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">5. Data Security</h2>
              <p className="text-gray-600 mb-4">
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>End-to-end encryption for sensitive data transmission</li>
                <li>Secure server infrastructure with regular security audits</li>
                <li>Access controls and employee privacy training</li>
                <li>Regular backup and disaster recovery procedures</li>
                <li>Compliance with international security standards</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">6. Your Privacy Rights</h2>
              <p className="text-gray-600 mb-4">You have the following rights regarding your personal information:</p>
              
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal information</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Portability:</strong> Request transfer of your data to another service</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Restriction:</strong> Limit how we process your information</li>
              </ul>
              
              <p className="text-gray-600 mt-4">
                To exercise these rights, contact us at <strong>privacy@exambuddy.me</strong>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">7. Children&apos;s Privacy</h2>
              <p className="text-gray-600">
                ExamBuddy is designed for students of all ages. For users under 18, we require parental 
                consent and implement additional privacy protections. We comply with applicable children&apos;s 
                privacy laws, including COPPA and GDPR provisions for minors. Parents can review, modify, 
                or delete their child&apos;s information by contacting our support team.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">8. Cookies and Tracking Technologies</h2>
              <p className="text-gray-600 mb-4">
                We use cookies and similar technologies to enhance your experience:
              </p>
              
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Essential Cookies:</strong> Required for basic platform functionality</li>
                <li><strong>Analytics Cookies:</strong> Help us understand usage patterns and improve our service</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and personalization choices</li>
                <li><strong>Marketing Cookies:</strong> Deliver relevant content and advertisements (with consent)</li>
              </ul>
              
              <p className="text-gray-600 mt-4">
                You can manage cookie preferences through your browser settings or our cookie consent banner.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">9. International Data Transfers</h2>
              <p className="text-gray-600">
                Your information may be processed and stored in countries outside your residence, including 
                India and other jurisdictions where our service providers operate. We ensure appropriate 
                safeguards are in place for international transfers, including standard contractual clauses 
                and adequacy decisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">10. Data Retention</h2>
              <p className="text-gray-600">
                We retain your information for as long as necessary to provide our services and comply with 
                legal obligations. Academic data is typically retained for the duration of your account plus 
                a reasonable period thereafter. You can request earlier deletion by contacting us.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">11. Third-Party Services</h2>
              <p className="text-gray-600">
                Our platform may integrate with third-party services (payment processors, analytics providers, 
                etc.). These services have their own privacy policies, and we recommend reviewing them. 
                We are not responsible for third-party privacy practices.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">12. Updates to This Policy</h2>
              <p className="text-gray-600">
                We may update this Privacy Policy periodically to reflect changes in our practices or 
                applicable laws. We will notify you of material changes via email or prominent notice 
                on our platform. Continued use of our service after updates constitutes acceptance 
                of the revised policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">13. Contact Information</h2>
              <div className="bg-blue-50 rounded-lg p-6">
                <p className="text-gray-600 mb-4">
                  <strong>For privacy-related questions or concerns, contact us:</strong>
                </p>
                <ul className="text-gray-600 space-y-2">
                  <li><strong>Email:</strong> privacy@exambuddy.me</li>
                  <li><strong>Support:</strong> support@exambuddy.me</li>
                  <li><strong>Address:</strong> ExamBuddy Privacy Officer, Mumbai, Maharashtra, India</li>
                </ul>
                
                <p className="text-gray-600 mt-4">
                  <strong>Response Time:</strong> We will respond to privacy requests within 30 days.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">14. Complaints and Disputes</h2>
              <p className="text-gray-600">
                If you have concerns about our privacy practices, please contact us first. You also have 
                the right to file a complaint with your local data protection authority if you believe 
                we have not adequately addressed your concerns.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}