import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import mammoth from 'mammoth';
import pptx2json from 'pptx2json';

// This line is required by pdfjs-dist for Node.js environments
pdfjsLib.GlobalWorkerOptions.workerSrc = `pdfjs-dist/legacy/build/pdf.worker.mjs`;

export const extractTextFromFile = async (file) => {
  if (file.mimetype === 'application/pdf') {
    // Convert the Buffer from multer into a Uint8Array
    const uint8Array = new Uint8Array(file.buffer);
    const loadingTask = pdfjsLib.getDocument(uint8Array);
    const doc = await loadingTask.promise;
    let fullText = '';
    
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => 'str' in item ? item.str : '').join(' ');
      fullText += pageText + '\n';
    }
    return fullText;

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