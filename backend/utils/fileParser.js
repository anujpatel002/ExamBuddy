import mammoth from 'mammoth';
import pptx2json from 'pptx2json';

export const extractTextFromFile = async (file) => {
  try {
    if (file.mimetype === 'application/pdf') {
      try {
        const pdfParse = (await import('pdf-parse')).default;
        const data = await pdfParse(file.buffer);
        return data.text || 'PDF uploaded successfully but no text content found.';
      } catch (pdfError) {
        console.error('PDF parsing failed:', pdfError);
        return 'PDF uploaded successfully but text extraction failed. You can still use this file for other features.';
      }
    } 
    else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const { value } = await mammoth.extractRawText({ buffer: file.buffer });
      return value || 'Word document uploaded successfully but no text content found.';
    } 
    else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      const data = await pptx2json.parse(file.buffer);
      let fullText = '';
      if (data.slides && Array.isArray(data.slides)) {
        for (const slide of data.slides) {
          if (slide.text) {
            fullText += slide.text + '\n\n';
          }
        }
      }
      return fullText || 'PowerPoint uploaded successfully but no text content found.';
    } 
    else if (file.mimetype === 'text/plain') {
      return file.buffer.toString('utf8');
    } 
    else {
      throw new Error('Unsupported file type. Please upload a PDF, DOCX, TXT, or PPTX file.');
    }
  } catch (error) {
    console.error(`File parsing error for ${file.mimetype}:`, error);
    return `File uploaded successfully but text extraction failed: ${error.message}`;
  }
};