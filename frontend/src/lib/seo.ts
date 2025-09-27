import { Metadata } from 'next';

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
  noIndex?: boolean;
  canonical?: string;
}

const DEFAULT_SEO: SEOConfig = {
  title: 'ExamBuddy - AI-Powered Smart Exam Preparation Platform',
  description: 'Master your exams with AI-powered study tools, personalized quizzes, smart notes, and comprehensive test preparation. Join thousands of students achieving academic success with ExamBuddy.',
  keywords: [
    'exam preparation',
    'AI study tools',
    'online learning',
    'quiz maker',
    'study notes',
    'test preparation',
    'academic success',
    'smart learning',
    'personalized quizzes',
    'exam practice',
    'education technology',
    'study platform'
  ],
  image: 'https://exambuddy.me/og-image.png',
  url: 'https://exambuddy.me',
  type: 'website'
};

export function generateSEOMetadata(config: Partial<SEOConfig> = {}): Metadata {
  const seo = { ...DEFAULT_SEO, ...config };
  
  const metadata: Metadata = {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords?.join(', '),
    
    // Open Graph
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: seo.url,
      siteName: 'ExamBuddy',
      images: [
        {
          url: seo.image!,
          width: 1200,
          height: 630,
          alt: seo.title,
        }
      ],
      locale: 'en_US',
      type: seo.type,
      ...(seo.publishedTime && { publishedTime: seo.publishedTime }),
      ...(seo.modifiedTime && { modifiedTime: seo.modifiedTime }),
      ...(seo.author && { authors: [seo.author] }),
      ...(seo.section && { section: seo.section }),
      ...(seo.tags && { tags: seo.tags }),
    },
    
    // Twitter
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
      images: [seo.image!],
      creator: '@ExamBuddy',
      site: '@ExamBuddy',
    },
    
    // Additional SEO
    robots: {
      index: !seo.noIndex,
      follow: !seo.noIndex,
      googleBot: {
        index: !seo.noIndex,
        follow: !seo.noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    
    // Canonical URL
    alternates: {
      canonical: seo.canonical || seo.url,
    },
    
    // Additional metadata
    category: 'Education',
    classification: 'Educational Technology',
    
    // Verification tags (you'll need to get these from search consoles)
    verification: {
      google: 'your-google-site-verification',
      yandex: 'your-yandex-verification',
      yahoo: 'your-yahoo-verification',
      other: {
        'msvalidate.01': 'your-bing-verification',
      },
    },
  };
  
  return metadata;
}

// Predefined SEO configs for different pages
export const SEO_CONFIGS = {
  home: {
    title: 'ExamBuddy - AI-Powered Smart Exam Preparation Platform',
    description: 'Master your exams with AI-powered study tools, personalized quizzes, smart notes, and comprehensive test preparation. Join thousands of students achieving academic success.',
    url: 'https://exambuddy.me',
  },
  
  dashboard: {
    title: 'Dashboard - ExamBuddy',
    description: 'Access your personalized study dashboard with AI-powered insights, progress tracking, and smart recommendations for exam success.',
    url: 'https://exambuddy.me/dashboard',
  },
  
  quiz: {
    title: 'AI-Powered Quizzes - ExamBuddy',
    description: 'Create and practice with intelligent quizzes tailored to your learning needs. AI-generated questions for effective exam preparation.',
    url: 'https://exambuddy.me/quiz',
    keywords: ['AI quizzes', 'practice tests', 'exam questions', 'quiz maker', 'test preparation'],
  },
  
  notes: {
    title: 'Smart Study Notes - ExamBuddy',
    description: 'Organize and enhance your study notes with AI-powered insights, summaries, and intelligent connections between topics.',
    url: 'https://exambuddy.me/notes',
    keywords: ['study notes', 'note taking', 'AI summaries', 'smart notes', 'study organization'],
  },
  
  studyRoom: {
    title: 'Virtual Study Rooms - ExamBuddy',
    description: 'Join collaborative study sessions, share knowledge, and learn together in AI-moderated virtual study environments.',
    url: 'https://exambuddy.me/study-room',
    keywords: ['study groups', 'collaborative learning', 'virtual study', 'peer learning', 'group study'],
  },
  
  subjects: {
    title: 'Subject Library - ExamBuddy',
    description: 'Explore comprehensive study materials across various subjects with AI-curated content and personalized learning paths.',
    url: 'https://exambuddy.me/subjects',
    keywords: ['subjects', 'study materials', 'academic subjects', 'learning resources', 'curriculum'],
  },
  
  pricing: {
    title: 'Pricing Plans - ExamBuddy',
    description: 'Choose the perfect plan for your exam preparation needs. Affordable pricing with powerful AI-driven study tools and features.',
    url: 'https://exambuddy.me/pricing',
    keywords: ['pricing', 'subscription plans', 'exam preparation cost', 'study tools pricing', 'educational plans'],
  },
  
  profile: {
    title: 'Profile Settings - ExamBuddy',
    description: 'Manage your ExamBuddy profile, preferences, and study settings. Customize your AI-powered learning experience.',
    url: 'https://exambuddy.me/profile',
    noIndex: true, // Private pages shouldn't be indexed
  },
  
  auth: {
    title: 'Sign In - ExamBuddy',
    description: 'Access your ExamBuddy account to continue your AI-powered exam preparation journey.',
    url: 'https://exambuddy.me/auth',
    noIndex: true, // Auth pages shouldn't be indexed
  },
};

export default generateSEOMetadata;