/**
 * Test utilities for NotebookLM components
 */

interface Source {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'txt' | 'url';
  content: string;
  uploadedAt: Date;
  pageCount?: number;
}

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  sources?: { sourceId: string; page?: number; excerpt: string }[];
  timestamp: Date;
}

interface StudyMaterial {
  id: string;
  type: 'summary' | 'outline' | 'timeline' | 'flashcards' | 'quiz' | 'mindmap' | 'video';
  title: string;
  content: string;
  sources: string[];
  createdAt: Date;
}

/**
 * Mock source data for testing
 */
export const mockSources: Source[] = [
  {
    id: 'source-1',
    name: 'Introduction to React.pdf',
    type: 'pdf',
    content: 'React is a JavaScript library for building user interfaces. It was created by Facebook and is now maintained by Meta and the community.',
    uploadedAt: new Date('2024-01-15'),
    pageCount: 25
  },
  {
    id: 'source-2',
    name: 'JavaScript Fundamentals.docx',
    type: 'doc',
    content: 'JavaScript is a high-level, interpreted programming language. It is a language which is also characterized as dynamic, weakly typed, prototype-based and multi-paradigm.',
    uploadedAt: new Date('2024-01-16')
  },
  {
    id: 'source-3',
    name: 'Web Development Notes.txt',
    type: 'txt',
    content: 'Web development involves creating websites and web applications. It includes frontend development (HTML, CSS, JavaScript) and backend development (server-side programming).',
    uploadedAt: new Date('2024-01-17')
  }
];

/**
 * Mock chat messages for testing
 */
export const mockChatMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    content: 'What is React?',
    isUser: true,
    timestamp: new Date('2024-01-18T10:00:00')
  },
  {
    id: 'msg-2',
    content: 'React is a JavaScript library for building user interfaces. It allows developers to create reusable UI components and manage application state efficiently.',
    isUser: false,
    sources: [
      {
        sourceId: 'source-1',
        excerpt: 'React is a JavaScript library for building user interfaces'
      }
    ],
    timestamp: new Date('2024-01-18T10:00:30')
  }
];

/**
 * Mock study materials for testing
 */
export const mockStudyMaterials: StudyMaterial[] = [
  {
    id: 'material-1',
    type: 'summary',
    title: 'Web Development Summary - 2024-01-18',
    content: '## Introduction\n\nWeb development is the process of creating websites and web applications.\n\n## Key Technologies\n\n- **Frontend**: HTML, CSS, JavaScript\n- **Backend**: Server-side programming\n- **Frameworks**: React, Angular, Vue.js',
    sources: ['source-1', 'source-2', 'source-3'],
    createdAt: new Date('2024-01-18')
  },
  {
    id: 'material-2',
    type: 'flashcards',
    title: 'React Flashcards - 2024-01-18',
    content: JSON.stringify({
      flashcards: [
        {
          question: 'What is React?',
          answer: 'A JavaScript library for building user interfaces'
        },
        {
          question: 'Who created React?',
          answer: 'Facebook (now Meta)'
        }
      ]
    }),
    sources: ['source-1'],
    createdAt: new Date('2024-01-18')
  }
];

/**
 * Mock API responses
 */
export const mockApiResponses = {
  analyzeDocuments: {
    response: 'Based on your documents, React is a powerful JavaScript library that enables developers to build interactive user interfaces efficiently.',
    sources: [
      { name: 'Introduction to React.pdf', id: 'source-1' }
    ]
  },
  generateStudyMaterial: {
    summary: {
      content: '## Web Development Overview\n\nWeb development encompasses both frontend and backend technologies...',
      type: 'summary'
    },
    flashcards: {
      content: {
        flashcards: [
          { question: 'What is React?', answer: 'A JavaScript library' }
        ]
      },
      type: 'flashcards'
    }
  }
};

/**
 * Mock file for testing file upload
 */
export const createMockFile = (name: string, content: string, type: string = 'text/plain'): File => {
  const blob = new Blob([content], { type });
  const file = new File([blob], name, { type });
  return file;
};

/**
 * Mock localStorage for testing
 */
export const mockLocalStorage = (() => {
  let store: { [key: string]: string } = {};
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

/**
 * Test helper to wait for async operations
 */
export const waitFor = (ms: number = 100): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};