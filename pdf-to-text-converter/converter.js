import { createWorker } from 'tesseract.js';
import pdf2pic from 'pdf2pic';
import fs from 'fs';
import path from 'path';

const convertPDFToText = async (pdfPath) => {
  try {
    console.log('Converting PDF to images...');
    const convert = pdf2pic.fromPath(pdfPath, {
      density: 300,
      format: 'png',
      width: 2000,
      height: 2000
    });

    const pages = await convert.bulk(-1, { responseType: 'buffer' });
    console.log(`Converted ${pages.length} pages to images`);

    console.log('Initializing OCR worker with Gujarati support...');
    const worker = await createWorker('guj');

    let extractedText = '';

    for (let i = 0; i < pages.length; i++) {
      console.log(`Processing page ${i + 1}/${pages.length}...`);
      const { data: { text } } = await worker.recognize(pages[i].buffer);
      extractedText += `--- Page ${i + 1} ---\n${text}\n\n`;
    }

    await worker.terminate();

    const outputPath = pdfPath.replace('.pdf', '_extracted.txt');
    fs.writeFileSync(outputPath, extractedText, 'utf8');
    
    console.log(`Text extracted and saved to: ${outputPath}`);
    console.log(`Extracted ${extractedText.length} characters`);
    
    return outputPath;
  } catch (error) {
    console.error('Conversion error:', error);
    throw error;
  }
};

// Command line usage
const pdfPath = process.argv[2];
if (!pdfPath) {
  console.log('Usage: node converter.js <path-to-pdf>');
  process.exit(1);
}

if (!fs.existsSync(pdfPath)) {
  console.error('PDF file not found:', pdfPath);
  process.exit(1);
}

convertPDFToText(pdfPath)
  .then(outputPath => {
    console.log('Conversion completed successfully!');
    console.log('Output file:', outputPath);
  })
  .catch(error => {
    console.error('Conversion failed:', error.message);
    process.exit(1);
  });