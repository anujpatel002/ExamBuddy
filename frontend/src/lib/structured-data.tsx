export interface StructuredData {
  '@context': string;
  '@type': string;
  [key: string]: unknown;
}

export class StructuredDataGenerator {
  static website(): StructuredData {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'ExamBuddy',
      alternateName: 'ExamBuddy - AI Study Platform',
      url: 'https://exambuddy.me',
      description: 'AI-Powered Smart Exam Preparation Platform for students to master their exams with personalized study tools.',
      inLanguage: 'en-US',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://exambuddy.me/search?q={search_term_string}'
        },
        'query-input': 'required name=search_term_string'
      },
      publisher: {
        '@type': 'Organization',
        name: 'ExamBuddy',
        url: 'https://exambuddy.me',
        logo: {
          '@type': 'ImageObject',
          url: 'https://exambuddy.me/logo.png',
          width: 512,
          height: 512
        },
        sameAs: [
          'https://twitter.com/exambuddy',
          'https://facebook.com/exambuddy',
          'https://linkedin.com/company/exambuddy'
        ]
      }
    };
  }

  static organization(): StructuredData {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'ExamBuddy',
      url: 'https://exambuddy.me',
      logo: 'https://exambuddy.me/logo.png',
      description: 'Leading AI-powered exam preparation platform helping students achieve academic success through smart study tools.',
      foundingDate: '2024',
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+1-555-EXAMBUDDY',
        contactType: 'customer service',
        availableLanguage: ['English']
      },
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'US'
      },
      sameAs: [
        'https://twitter.com/exambuddy',
        'https://facebook.com/exambuddy',
        'https://linkedin.com/company/exambuddy'
      ]
    };
  }

  static educationalOrganization(): StructuredData {
    return {
      '@context': 'https://schema.org',
      '@type': 'EducationalOrganization',
      name: 'ExamBuddy',
      url: 'https://exambuddy.me',
      description: 'AI-powered educational technology platform providing personalized exam preparation tools and study resources.',
      hasCredential: 'Educational Technology Provider',
      department: {
        '@type': 'Organization',
        name: 'AI Learning Division'
      }
    };
  }

  static softwareApplication(): StructuredData {
    return {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'ExamBuddy',
      operatingSystem: 'Web Browser',
      applicationCategory: 'EducationalApplication',
      description: 'AI-powered exam preparation platform with personalized quizzes, smart notes, and comprehensive study tools.',
      url: 'https://exambuddy.me',
      screenshot: 'https://exambuddy.me/screenshot.png',
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '1250',
        bestRating: '5',
        worstRating: '1'
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock'
      },
      featureList: [
        'AI-powered quiz generation',
        'Smart note-taking',
        'Progress tracking',
        'Collaborative study rooms',
        'Personalized learning paths',
        'Performance analytics'
      ]
    };
  }

  static course(): StructuredData {
    return {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: 'Comprehensive Exam Preparation',
      description: 'Complete exam preparation course with AI-powered tools, personalized quizzes, and smart study materials.',
      provider: {
        '@type': 'Organization',
        name: 'ExamBuddy',
        url: 'https://exambuddy.me'
      },
      educationalCredentialAwarded: 'Certificate of Completion',
      courseMode: 'online',
      inLanguage: 'en',
      availableLanguage: 'en',
      url: 'https://exambuddy.me/dashboard',
      image: 'https://exambuddy.me/course-image.png'
    };
  }

  static faq(faqs: Array<{ question: string; answer: string }>): StructuredData {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    };
  }

  static breadcrumb(items: Array<{ name: string; url: string }>): StructuredData {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url
      }))
    };
  }

  static article(article: {
    title: string;
    description: string;
    author: string;
    datePublished: string;
    dateModified?: string;
    url: string;
    image?: string;
    wordCount?: number;
  }): StructuredData {
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      description: article.description,
      author: {
        '@type': 'Person',
        name: article.author
      },
      publisher: {
        '@type': 'Organization',
        name: 'ExamBuddy',
        logo: {
          '@type': 'ImageObject',
          url: 'https://exambuddy.me/logo.png'
        }
      },
      datePublished: article.datePublished,
      dateModified: article.dateModified || article.datePublished,
      url: article.url,
      ...(article.image && {
        image: {
          '@type': 'ImageObject',
          url: article.image
        }
      }),
      ...(article.wordCount && { wordCount: article.wordCount }),
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': article.url
      }
    };
  }

  static howTo(howTo: {
    name: string;
    description: string;
    image?: string;
    totalTime?: string;
    steps: Array<{ name: string; text: string; image?: string }>;
  }): StructuredData {
    return {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: howTo.name,
      description: howTo.description,
      ...(howTo.image && { image: howTo.image }),
      ...(howTo.totalTime && { totalTime: howTo.totalTime }),
      step: howTo.steps.map((step, index) => ({
        '@type': 'HowToStep',
        position: index + 1,
        name: step.name,
        text: step.text,
        ...(step.image && { image: step.image })
      }))
    };
  }
}

// Helper function to inject structured data into pages
export function injectStructuredData(data: StructuredData | StructuredData[]) {
  const dataArray = Array.isArray(data) ? data : [data];
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(dataArray.length === 1 ? dataArray[0] : dataArray)
      }}
    />
  );
}