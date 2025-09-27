// Google Analytics 4 configuration for ExamBuddy
// This file handles GA4 tracking, events, and conversions for SEO optimization

// Environment variables for GA4
export const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || 'G-XXXXXXXXXX'
export const GA4_ENABLED = process.env.NODE_ENV === 'production' && GA4_MEASUREMENT_ID !== 'G-XXXXXXXXXX'

// GA4 script for Next.js
export const GA4_SCRIPT_SRC = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`

// Initialize GA4
export function initializeGA4() {
  if (typeof window !== 'undefined' && GA4_ENABLED) {
    window.dataLayer = window.dataLayer || []
    function gtag(...args: unknown[]) {
      window.dataLayer.push(args)
    }
    
    window.gtag = gtag
    
    gtag('js', new Date())
    gtag('config', GA4_MEASUREMENT_ID, {
      page_title: document.title,
      page_location: window.location.href,
    })
  }
}

// Track page views
export function trackPageView(url: string, title?: string) {
  if (GA4_ENABLED && typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA4_MEASUREMENT_ID, {
      page_path: url,
      page_title: title || document.title,
    })
  }
}

// Track custom events for SEO insights
export function trackEvent(eventName: string, parameters?: Record<string, unknown>) {
  if (GA4_ENABLED && typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters)
  }
}

// Education-specific event tracking
export const EducationEvents = {
  // Study session events
  studySessionStart: (subject: string, duration?: number) => {
    trackEvent('study_session_start', {
      event_category: 'Education',
      subject: subject,
      estimated_duration: duration,
    })
  },
  
  studySessionEnd: (subject: string, actualDuration: number) => {
    trackEvent('study_session_end', {
      event_category: 'Education',
      subject: subject,
      session_duration: actualDuration,
    })
  },

  // Quiz and assessment events
  quizStart: (quizId: string, subject: string) => {
    trackEvent('quiz_start', {
      event_category: 'Assessment',
      quiz_id: quizId,
      subject: subject,
    })
  },

  quizComplete: (quizId: string, score: number, totalQuestions: number) => {
    trackEvent('quiz_complete', {
      event_category: 'Assessment',
      quiz_id: quizId,
      score: score,
      total_questions: totalQuestions,
      percentage: Math.round((score / totalQuestions) * 100),
    })
  },

  // OCR and content events
  ocrScan: (documentType: string, success: boolean) => {
    trackEvent('ocr_scan', {
      event_category: 'Content',
      document_type: documentType,
      success: success,
    })
  },

  notesCreate: (subject: string, method: 'manual' | 'ocr' | 'ai') => {
    trackEvent('notes_create', {
      event_category: 'Content',
      subject: subject,
      creation_method: method,
    })
  },

  // AI interaction events
  doubtSolverUse: (subject: string, questionType: string) => {
    trackEvent('doubt_solver_use', {
      event_category: 'AI_Interaction',
      subject: subject,
      question_type: questionType,
    })
  },

  aiTutorInteraction: (subject: string, interactionType: string) => {
    trackEvent('ai_tutor_interaction', {
      event_category: 'AI_Interaction',
      subject: subject,
      interaction_type: interactionType,
    })
  },

  // User engagement events
  featureUsage: (featureName: string, timeSpent?: number) => {
    trackEvent('feature_usage', {
      event_category: 'Engagement',
      feature_name: featureName,
      time_spent: timeSpent,
    })
  },

  searchQuery: (query: string, resultsCount: number) => {
    trackEvent('search', {
      search_term: query,
      results_count: resultsCount,
    })
  },

  // Conversion events for business metrics
  subscriptionUpgrade: (plan: string, value?: number) => {
    trackEvent('purchase', {
      event_category: 'Conversion',
      transaction_id: Date.now().toString(),
      value: value,
      currency: 'INR',
      items: [{
        item_id: plan,
        item_name: `ExamBuddy ${plan} Plan`,
        item_category: 'Subscription',
        quantity: 1,
        price: value,
      }],
    })
  },

  trialStart: (plan: string) => {
    trackEvent('begin_trial', {
      event_category: 'Conversion',
      trial_plan: plan,
    })
  },

  userRegistration: (method: string) => {
    trackEvent('sign_up', {
      method: method,
    })
  },

  // Content engagement
  pageTime: (pageName: string, timeSpent: number) => {
    trackEvent('page_engagement', {
      event_category: 'Engagement',
      page_name: pageName,
      engagement_time_msec: timeSpent * 1000,
    })
  },
}

// SEO-specific tracking for content performance
export const SEOTracking = {
  // Track internal link clicks for UX optimization
  internalLinkClick: (from: string, to: string, linkText: string) => {
    trackEvent('internal_link_click', {
      event_category: 'Navigation',
      link_url: to,
      link_text: linkText,
      source_page: from,
    })
  },

  // Track external link clicks
  externalLinkClick: (url: string, linkText: string) => {
    trackEvent('external_link_click', {
      event_category: 'Navigation',
      link_url: url,
      link_text: linkText,
      outbound: true,
    })
  },

  // Track file downloads
  fileDownload: (fileName: string, fileType: string, fileSize?: number) => {
    trackEvent('file_download', {
      event_category: 'Content',
      file_name: fileName,
      file_extension: fileType,
      file_size: fileSize,
    })
  },

  // Track 404 errors for SEO health
  pageNotFound: (requestedUrl: string, referrer?: string) => {
    trackEvent('page_not_found', {
      event_category: 'Error',
      page_location: requestedUrl,
      page_referrer: referrer,
    })
  },

  // Track Core Web Vitals for SEO ranking factors
  coreWebVitals: (metric: string, value: number, rating: 'good' | 'needs-improvement' | 'poor') => {
    trackEvent('web_vitals', {
      event_category: 'Performance',
      metric_name: metric,
      metric_value: value,
      metric_rating: rating,
    })
  },
}

// Enhanced ecommerce tracking for subscription business
export const EcommerceTracking = {
  // View pricing page
  viewPricingPage: () => {
    trackEvent('view_item_list', {
      event_category: 'Ecommerce',
      item_list_name: 'Pricing Plans',
    })
  },

  // View specific plan details
  viewPlan: (planId: string, planName: string, price: number) => {
    trackEvent('view_item', {
      event_category: 'Ecommerce',
      currency: 'INR',
      value: price,
      items: [{
        item_id: planId,
        item_name: planName,
        item_category: 'Subscription',
        price: price,
      }],
    })
  },

  // Add to cart (subscription selection)
  selectPlan: (planId: string, planName: string, price: number) => {
    trackEvent('add_to_cart', {
      event_category: 'Ecommerce',
      currency: 'INR',
      value: price,
      items: [{
        item_id: planId,
        item_name: planName,
        item_category: 'Subscription',
        quantity: 1,
        price: price,
      }],
    })
  },

  // Begin checkout
  beginCheckout: (planId: string, planName: string, price: number) => {
    trackEvent('begin_checkout', {
      event_category: 'Ecommerce',
      currency: 'INR',
      value: price,
      items: [{
        item_id: planId,
        item_name: planName,
        item_category: 'Subscription',
        quantity: 1,
        price: price,
      }],
    })
  },
}

// User journey tracking for funnel optimization
export const UserJourney = {
  // Landing page events
  landingPageView: (source: string, medium: string, campaign?: string) => {
    trackEvent('landing_page_view', {
      event_category: 'User_Journey',
      traffic_source: source,
      traffic_medium: medium,
      campaign_name: campaign,
    })
  },

  // Feature discovery
  featureDiscovery: (featureName: string, discoveryMethod: string) => {
    trackEvent('feature_discovery', {
      event_category: 'User_Journey',
      feature_name: featureName,
      discovery_method: discoveryMethod,
    })
  },

  // Onboarding completion
  onboardingComplete: (step: string, totalSteps: number) => {
    trackEvent('onboarding_complete', {
      event_category: 'User_Journey',
      onboarding_step: step,
      total_steps: totalSteps,
    })
  },

  // Help content usage
  helpContentView: (helpTopic: string, timeSpent?: number) => {
    trackEvent('help_content_view', {
      event_category: 'User_Journey',
      help_topic: helpTopic,
      time_spent: timeSpent,
    })
  },
}

// Type definitions for global gtag
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js',
      targetId: string | Date,
      config?: Record<string, unknown>
    ) => void
    dataLayer: unknown[]
  }
}

export { trackPageView as default }