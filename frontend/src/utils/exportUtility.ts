/**
 * Professional export utilities for NotebookLM study materials
 */

interface StudyMaterial {
  id: string;
  type: 'summary' | 'outline' | 'timeline' | 'flashcards' | 'quiz' | 'mindmap' | 'video';
  title: string;
  content: string;
  sources: string[];
  createdAt: Date;
}

/**
 * Export study material as formatted text
 */
export const exportAsText = (material: StudyMaterial): void => {
  const header = `${material.title}\n${'='.repeat(material.title.length)}\n\n`;
  const metadata = `Generated: ${material.createdAt.toLocaleDateString()}\nType: ${material.type.charAt(0).toUpperCase() + material.type.slice(1)}\nSources: ${material.sources.length}\n\n`;
  const content = material.content;
  
  const fullContent = header + metadata + content;
  
  downloadFile(fullContent, `${material.title}.txt`, 'text/plain');
};

/**
 * Export flashcards as CSV
 */
export const exportFlashcardsAsCSV = (material: StudyMaterial): void => {
  if (material.type !== 'flashcards') {
    throw new Error('Material must be of type flashcards');
  }
  
  try {
    const flashcards = typeof material.content === 'string' 
      ? JSON.parse(material.content) 
      : material.content;
    
    const cards = flashcards.flashcards || flashcards;
    if (!Array.isArray(cards)) {
      throw new Error('Invalid flashcard format');
    }
    
    const csvHeader = 'Question,Answer\n';
    const csvRows = cards.map((card: any) => 
      `"${escapeCSV(card.question)}","${escapeCSV(card.answer)}"`
    ).join('\n');
    
    const csvContent = csvHeader + csvRows;
    downloadFile(csvContent, `${material.title}_flashcards.csv`, 'text/csv');
  } catch (error) {
    throw new Error('Failed to export flashcards: Invalid format');
  }
};

/**
 * Export quiz as formatted text
 */
export const exportQuizAsText = (material: StudyMaterial): void => {
  if (material.type !== 'quiz') {
    throw new Error('Material must be of type quiz');
  }
  
  try {
    const quiz = typeof material.content === 'string' 
      ? JSON.parse(material.content) 
      : material.content;
    
    const questions = quiz.questions || quiz.mcqs || quiz;
    if (!Array.isArray(questions)) {
      throw new Error('Invalid quiz format');
    }
    
    let formattedContent = `${material.title}\n${'='.repeat(material.title.length)}\n\n`;
    formattedContent += `Generated: ${material.createdAt.toLocaleDateString()}\n`;
    formattedContent += `Total Questions: ${questions.length}\n\n`;
    
    questions.forEach((q: any, index: number) => {
      formattedContent += `Question ${index + 1}: ${q.question}\n\n`;
      
      if (q.options) {
        q.options.forEach((option: string, optIndex: number) => {
          const isCorrect = q.correctAnswer === option || q.correct === optIndex;
          formattedContent += `${String.fromCharCode(65 + optIndex)}. ${option}${isCorrect ? ' ✓' : ''}\n`;
        });
      }
      
      if (q.answer && !q.options) {
        formattedContent += `Answer: ${q.answer}\n`;
      }
      
      formattedContent += '\n';
    });
    
    downloadFile(formattedContent, `${material.title}_quiz.txt`, 'text/plain');
  } catch (error) {
    throw new Error('Failed to export quiz: Invalid format');
  }
};

/**
 * Export mind map as structured text
 */
export const exportMindMapAsText = (material: StudyMaterial): void => {
  if (material.type !== 'mindmap') {
    throw new Error('Material must be of type mindmap');
  }
  
  const header = `${material.title} - Mind Map\n${'='.repeat(material.title.length + 12)}\n\n`;
  const metadata = `Generated: ${material.createdAt.toLocaleDateString()}\n\n`;
  const content = material.content;
  
  const fullContent = header + metadata + content;
  downloadFile(fullContent, `${material.title}_mindmap.txt`, 'text/plain');
};

/**
 * Export as PDF (requires additional library in production)
 */
export const exportAsPDF = async (material: StudyMaterial): Promise<void> => {
  // This is a placeholder for PDF export functionality
  // In production, you would use a library like jsPDF or Puppeteer
  console.warn('PDF export requires additional setup. Falling back to text export.');
  exportAsText(material);
};

/**
 * Export all materials as ZIP (requires additional library in production)
 */
export const exportAllAsZip = async (materials: StudyMaterial[]): Promise<void> => {
  // This is a placeholder for ZIP export functionality
  // In production, you would use a library like JSZip
  console.warn('ZIP export requires additional setup. Exporting individually.');
  
  materials.forEach((material, index) => {
    setTimeout(() => {
      exportAsText(material);
    }, index * 500); // Stagger downloads to avoid browser blocking
  });
};

/**
 * Utility function to download file
 */
const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

/**
 * Escape CSV special characters
 */
const escapeCSV = (text: string): string => {
  if (!text) return '';
  return text.replace(/"/g, '""').replace(/\n/g, ' ').replace(/\r/g, '');
};

/**
 * Get appropriate export function based on material type
 */
export const getExportFunction = (type: StudyMaterial['type']) => {
  switch (type) {
    case 'flashcards':
      return exportFlashcardsAsCSV;
    case 'quiz':
      return exportQuizAsText;
    case 'mindmap':
      return exportMindMapAsText;
    default:
      return exportAsText;
  }
};

/**
 * Validate material before export
 */
export const validateMaterialForExport = (material: StudyMaterial): boolean => {
  if (!material.title || !material.content) {
    return false;
  }
  
  if (material.type === 'flashcards' || material.type === 'quiz') {
    try {
      const parsed = typeof material.content === 'string' 
        ? JSON.parse(material.content) 
        : material.content;
      return Array.isArray(parsed) || Array.isArray(parsed.flashcards) || Array.isArray(parsed.questions);
    } catch {
      return false;
    }
  }
  
  return true;
};