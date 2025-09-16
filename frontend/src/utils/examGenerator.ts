import jsPDF from 'jspdf';

interface Question {
  question: string;
  answer: string;
}

interface ExamConfig {
  title: string;
  subject: string;
  duration: string;
  totalMarks: number;
  instructions: string[];
  questions: {
    oneMarker?: Question[];
    threeMarker?: Question[];
    fourMarker?: Question[];
    fiveMarker?: Question[];
  };
}

export const generateExamPaper = async (config: ExamConfig, format: 'pdf' | 'word' = 'pdf') => {
  if (format === 'pdf') {
    await generatePDF('', config.title);
  } else {
    const examHTML = createExamHTML(config);
    generateWordDoc(examHTML, config.title);
  }
};

const createExamHTML = (config: ExamConfig): string => {
  const { title, subject, duration, totalMarks, instructions, questions } = config;
  
  let questionsHTML = '';
  let questionNumber = 1;
  
  // Generate questions by marker type
  const markerTypes = [
    { key: 'oneMarker', label: 'SECTION A - 1 Mark Questions', marks: 1 },
    { key: 'threeMarker', label: 'SECTION B - 3 Mark Questions', marks: 3 },
    { key: 'fourMarker', label: 'SECTION C - 4 Mark Questions', marks: 4 },
    { key: 'fiveMarker', label: 'SECTION D - 5 Mark Questions', marks: 5 }
  ];
  
  markerTypes.forEach(({ key, label, marks }) => {
    const markerQuestions = questions[key as keyof typeof questions];
    if (markerQuestions && markerQuestions.length > 0) {
      questionsHTML += `
        <h2 style="color: #000; font-size: 16px; margin: 20px 0 10px 0; border-bottom: 1px solid #000;">${label}</h2>
        ${markerQuestions.slice(0, 10).map(q => `
          <div style="margin: 15px 0; page-break-inside: avoid;">
            <strong style="color: #000;">${questionNumber++}. ${q.question || 'Question not available'}</strong>
            <div style="color: #000; margin-left: 20px; font-size: 12px;">[${marks} Mark${marks > 1 ? 's' : ''}]</div>
            <div style="height: 40px; border-bottom: 1px dotted #ccc; margin: 10px 0;"></div>
          </div>
        `).join('')}
      `;
    }
  });
  
  if (!questionsHTML) {
    questionsHTML = '<p style="color: #000;">No questions available. Please ensure notes have been processed and practice questions generated.</p>';
  }
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body {
          font-family: 'Times New Roman', serif;
          line-height: 1.6;
          margin: 0;
          padding: 20px;
          background: white;
          color: black;
          width: 210mm;
          min-height: 297mm;
        }
        .exam-paper {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 30px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .exam-title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
          text-transform: uppercase;
        }
        .exam-info {
          display: flex;
          justify-content: space-between;
          margin: 15px 0;
          font-size: 14px;
        }
        .instructions {
          margin-bottom: 30px;
          padding: 15px;
          border: 1px solid #ddd;
          background-color: #f9f9f9;
        }
        .instructions h3 {
          margin-top: 0;
          color: #333;
        }
        .instructions ul {
          margin: 10px 0;
          padding-left: 20px;
        }
        .instructions li {
          margin-bottom: 5px;
        }
        .section {
          margin-bottom: 30px;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #333;
          border-bottom: 1px solid #333;
          padding-bottom: 5px;
          margin-bottom: 15px;
        }
        .question {
          display: flex;
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        .question-number {
          font-weight: bold;
          margin-right: 10px;
          min-width: 30px;
        }
        .question-content {
          flex: 1;
        }
        .question-text {
          margin-bottom: 5px;
          line-height: 1.8;
          color: #000 !important;
        }
        .marks {
          font-weight: bold;
          color: #000 !important;
          font-size: 12px;
          text-align: right;
        }
        p, div, span, h1, h2, h3, h4, h5, h6 {
          color: #000 !important;
        }
        .code-block {
          background-color: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 10px;
          margin: 10px 0;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          white-space: pre-wrap;
        }
        .answer-space {
          border-bottom: 1px solid #ccc;
          height: 60px;
          margin: 10px 0;
        }
        @media print {
          body { margin: 0; }
          .exam-paper { box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="exam-paper">
        <div class="header">
          <div class="exam-title">${title}</div>
          <div class="exam-info">
            <span><strong>Subject:</strong> ${subject}</span>
            <span><strong>Duration:</strong> ${duration}</span>
            <span><strong>Total Marks:</strong> ${totalMarks}</span>
          </div>
        </div>
        
        <div class="instructions">
          <h3>Instructions:</h3>
          <ul>
            ${instructions.map(instruction => `<li>${instruction}</li>`).join('')}
          </ul>
        </div>
        
        ${questionsHTML}
      </div>
    </body>
    </html>
  `;
};

const formatQuestionText = (text: string): string => {
  // Handle code blocks
  if (text.includes('```') || text.includes('public class') || text.includes('System.out.println')) {
    return `<div class="code-block">${text}</div>`;
  }
  
  // Handle numbered steps
  if (/^\d+\.\s/.test(text) || text.includes('\n1.') || text.includes('\n2.')) {
    return text.replace(/(\d+\.\s[^\n]+)/g, '<div style="margin: 5px 0;">$1</div>');
  }
  
  return text;
};

const generatePDF = async (html: string, filename: string): Promise<void> => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  let y = 20;
  pdf.setTextColor(0, 0, 0);
  
  // Header
  pdf.setFontSize(16);
  pdf.text(filename.toUpperCase(), 105, y, { align: 'center' });
  y += 10;
  
  pdf.setFontSize(12);
  pdf.text('Duration: 3 Hours                                Total Marks: 70', 105, y, { align: 'center' });
  y += 15;
  
  // Instructions
  pdf.setFontSize(10);
  pdf.text('Instructions:', 15, y);
  y += 5;
  const instructions = [
    '1. Read all questions carefully before attempting.',
    '2. Answer all questions.',
    '3. Write clearly and legibly.',
    '4. Manage your time effectively.'
  ];
  
  instructions.forEach(instruction => {
    pdf.text(instruction, 20, y);
    y += 5;
  });
  
  y += 10;
  pdf.save(`${filename.replace(/[^a-z0-9]/gi, '_')}_exam_paper.pdf`);
};

const generateWordDoc = (html: string, filename: string): void => {
  // Create Word document content
  const wordContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' 
          xmlns:w='urn:schemas-microsoft-com:office:word' 
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>${filename}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>90</w:Zoom>
          <w:DoNotPromptForConvert/>
          <w:DoNotShowInsertionsAndDeletions/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        body { font-family: 'Times New Roman', serif; }
        .exam-paper { margin: 20px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .exam-title { font-size: 24px; font-weight: bold; }
        .section-title { font-size: 18px; font-weight: bold; border-bottom: 1px solid #333; }
        .question { margin-bottom: 20px; }
        .code-block { background-color: #f5f5f5; border: 1px solid #ddd; padding: 10px; font-family: 'Courier New', monospace; }
      </style>
    </head>
    <body>
      ${html.match(/<body[^>]*>([\s\S]*)<\/body>/)?.[1] || html}
    </body>
    </html>
  `;
  
  // Create blob and download
  const blob = new Blob([wordContent], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename.replace(/[^a-z0-9]/gi, '_')}_exam_paper.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const generateQuickExam = async (questions: any, noteTitle: string, format: 'pdf' | 'word' = 'pdf') => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  let y = 20;
  let questionNum = 1;
  
  pdf.setTextColor(0, 0, 0);
  
  // Header
  pdf.setFontSize(16);
  pdf.text(`${noteTitle.toUpperCase()} - EXAMINATION`, 105, y, { align: 'center' });
  y += 15;
  
  pdf.setFontSize(12);
  pdf.text('Duration: 3 Hours                    Total Marks: 70', 105, y, { align: 'center' });
  y += 20;
  
  // Instructions
  pdf.setFontSize(10);
  pdf.text('Instructions:', 15, y);
  y += 7;
  ['1. Read all questions carefully', '2. Answer all questions', '3. Write clearly and legibly'].forEach(inst => {
    pdf.text(inst, 20, y);
    y += 5;
  });
  y += 10;
  
  // Debug log
  console.log('Questions received:', questions);
  
  // Questions
  const markerTypes = [['oneMarker', 'SECTION A - 1 MARK QUESTIONS', 1], ['threeMarker', 'SECTION B - 3 MARK QUESTIONS', 3], ['fourMarker', 'SECTION C - 4 MARK QUESTIONS', 4], ['fiveMarker', 'SECTION D - 5 MARK QUESTIONS', 5]];
  
  let hasQuestions = false;
  
  markerTypes.forEach(([key, label, marks]) => {
    const qs = questions?.[key];
    console.log(`${key}:`, qs);
    
    if (qs && Array.isArray(qs) && qs.length > 0) {
      hasQuestions = true;
      pdf.setFontSize(12);
      pdf.text(label as string, 15, y);
      y += 10;
      
      pdf.setFontSize(10);
      qs.slice(0, 8).forEach((q: any) => {
        if (y > 270) { pdf.addPage(); y = 20; }
        
        const questionText = q?.question || q || 'Question not available';
        const qText = `${questionNum}. ${questionText}`;
        const lines = pdf.splitTextToSize(qText, 170);
        pdf.text(lines, 15, y);
        y += lines.length * 5;
        
        pdf.text(`[${marks} Mark${marks > 1 ? 's' : ''}]`, 190, y - 2, { align: 'right' });
        
        // Add answer space
        y += 5;
        pdf.line(15, y, 195, y);
        y += 15;
        questionNum++;
      });
      y += 10;
    }
  });
  
  if (!hasQuestions) {
    pdf.text('No questions available. Please generate practice questions first.', 15, y);
  }
  
  pdf.save(`${noteTitle.replace(/[^a-z0-9]/gi, '_')}_exam_paper.pdf`);
  
  if (!hasQuestions) {
    throw new Error('No questions found for exam generation');
  }
};

const calculateTotalMarks = (questions: any): number => {
  let total = 0;
  if (questions.oneMarker) total += questions.oneMarker.length * 1;
  if (questions.threeMarker) total += questions.threeMarker.length * 3;
  if (questions.fourMarker) total += questions.fourMarker.length * 4;
  if (questions.fiveMarker) total += questions.fiveMarker.length * 5;
  return total;
};