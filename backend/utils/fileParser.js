import mammoth from 'mammoth';
import pptx2json from 'pptx2json';

export const extractTextFromFile = async (file) => {
  if (file.mimetype === 'application/pdf') {
    try {
      // Use pdf-parse which works better in serverless
      const pdfParse = (await import('pdf-parse')).default;
      const data = await pdfParse(file.buffer);
      return data.text;
    } catch (error) {
      console.error('PDF parsing error:', error);
      return 'PDF uploaded successfully but text extraction failed. You can still use this file for other features.';
    }

  } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const { value } = await mammoth.extractRawText({ buffer: file.buffer });
    return value;
  } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
    const data = await pptx2json.parse(file.buffer);
    let fullText = '';
    for (const slide of data.slides) {
      if (slide.text) {
        fullText += slide.text + '\n\n';
      }
    }
    return fullText;
  } else if (file.mimetype === 'text/plain') {
    return file.buffer.toString('utf8');
  } else {
    throw new Error('Unsupported file type. Please upload a PDF, DOCX, TXT, or PPTX file.');
  }
};