import mammoth from 'mammoth';

// Simplified OCR function - placeholder for now
const extractTextWithOCR = async (pdfBuffer) => {
  console.log('OCR extraction attempted - requires proper setup');
  return 'OCR functionality needs proper configuration. Please convert your PDF to text format or use a text-based PDF for best results with Gujarati content.';
};

export const extractTextFromFile = async (file) => {
  try {
    if (file.mimetype === 'application/pdf') {
      try {
        const pdfParse = (await import('pdf-parse')).default;
        
        // Try multiple parsing strategies for better Unicode support
        const strategies = [
          // Strategy 1: Default parsing
          () => pdfParse(file.buffer, {
            normalizeWhitespace: false,
            disableCombineTextItems: false
          }),
          // Strategy 2: With different options for Unicode
          () => pdfParse(file.buffer, {
            normalizeWhitespace: true,
            disableCombineTextItems: true,
            useWorker: false
          }),
          // Strategy 3: Basic parsing
          () => pdfParse(file.buffer),
          // Strategy 4: Force text extraction with different encoding
          () => pdfParse(file.buffer, {
            normalizeWhitespace: true,
            disableCombineTextItems: false,
            max: 0 // No page limit
          })
        ];
        
        let bestResult = null;
        let maxLength = 0;
        
        for (let i = 0; i < strategies.length; i++) {
          try {
            console.log(`Trying PDF parsing strategy ${i + 1}...`);
            
            // Add timeout for each strategy
            const data = await Promise.race([
              strategies[i](),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Strategy timeout')), 15000)
              )
            ]);
            
            const text = data.text || '';
            
            if (text.length > maxLength) {
              maxLength = text.length;
              bestResult = text;
              console.log(`Strategy ${i + 1} extracted ${text.length} characters`);
              
              // For mobile, use first successful strategy to save time
              if (text.length > 500) {
                console.log('Good extraction found, stopping strategy search');
                break;
              }
            }
          } catch (strategyError) {
            console.log(`Strategy ${i + 1} failed:`, strategyError.message);
          }
        }
        
        if (bestResult && bestResult.length > 200) {
          // Clean and process the text
          const cleanText = bestResult
            .replace(/\uFEFF/g, '') // Remove BOM
            .replace(/\r\n/g, '\n') // Normalize line endings
            .replace(/\r/g, '\n')
            .trim();
          
          console.log('PDF text extraction successful, length:', cleanText.length);
          console.log('First 200 chars:', cleanText.substring(0, 200));
          console.log('Contains Gujarati:', /[\u0A80-\u0AFF]+/.test(cleanText));
          console.log('Contains Hindi:', /[\u0900-\u097F]+/.test(cleanText));
          
          return cleanText;
        } else {
          console.log('PDF appears to be image-based, attempting internal OCR conversion...');
          
          // Return special marker for internal OCR processing
          return 'INTERNAL_OCR_REQUIRED';
        }
      } catch (pdfError) {
        console.error('PDF parsing failed:', pdfError);
        return 'PDF uploaded successfully but text extraction failed. You can still use this file for other features.';
      }
    } 
    else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      console.log('Processing DOCX document...');
      try {
        const { value } = await mammoth.extractRawText({ buffer: file.buffer });
        
        const cleanText = value ? value.replace(/\uFEFF/g, '').trim() : '';
        console.log('DOCX text extraction completed, length:', cleanText.length);
        console.log('First 200 chars:', cleanText.substring(0, 200));
        console.log('Contains Gujarati:', /[\u0A80-\u0AFF]+/.test(cleanText));
        console.log('Contains Hindi:', /[\u0900-\u097F]+/.test(cleanText));
        
        return cleanText || 'DOCX document uploaded successfully but no text content found.';
      } catch (docxError) {
        console.log('DOCX parsing failed, trying as RTF...');
        const text = file.buffer.toString('utf8');
        const cleanText = text.replace(/\\par/g, '\n').replace(/[{}\\]/g, '').trim();
        return cleanText || 'Document uploaded but text extraction failed.';
      }
    }
    else if (file.mimetype === 'application/rtf' || file.mimetype === 'text/rtf') {
      console.log('Processing RTF document...');
      const text = file.buffer.toString('utf8');
      const cleanText = text.replace(/\\par/g, '\n').replace(/[{}\\]/g, '').trim();
      console.log('RTF text extraction completed, length:', cleanText.length);
      return cleanText || 'RTF document uploaded successfully but no text content found.';
    }
    else if (file.mimetype === 'application/msword') {
      console.log('Processing DOC document (old format)...');
      return 'Old DOC format detected. Please save your file as DOCX format for better text extraction, or copy the text and save as TXT file.';
    } 
 
    else if (file.mimetype === 'text/plain') {
      const text = file.buffer.toString('utf8');
      return text.replace(/\uFEFF/g, '').trim(); // Remove BOM and clean
    } 
    else {
      throw new Error('Unsupported file type. Please upload a PDF, DOC, DOCX, or TXT file.');
    }
  } catch (error) {
    console.error(`File parsing error for ${file.mimetype}:`, error);
    return `File uploaded successfully but text extraction failed: ${error.message}`;
  }
};