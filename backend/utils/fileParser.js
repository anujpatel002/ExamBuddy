import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import mammoth from 'mammoth';

pdfjsLib.GlobalWorkerOptions.workerSrc = `pdfjs-dist/legacy/build/pdf.worker.mjs`;

export const extractTextFromFile = async (file) => {
  if (file.mimetype === 'application/pdf') {
    // **THIS IS THE FIX:** Convert Buffer to Uint8Array
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

  } else if (file.mimetype === 'text/plain') {
    return file.buffer.toString('utf8');

  } else {
    throw new Error('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
  }
};