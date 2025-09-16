import mammoth from 'mammoth';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Use Gemini API for PDF processing like Google NotebookLM
const extractTextWithGemini = async (pdfBuffer) => {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent([
      {
        inlineData: {
          data: pdfBuffer.toString('base64'),
          mimeType: 'application/pdf'
        }
      },
      'Extract all text content from this PDF document. Preserve the structure and formatting. Return only the extracted text without any additional commentary.'
    ]);
    
    return result.response.text();
  } catch (error) {
    console.error('Gemini PDF extraction failed:', error);
    throw error;
  }
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
        
        if (bestResult && bestResult.length > 50) {
          // Clean and process the text
          const cleanText = bestResult
            .replace(/\uFEFF/g, '') // Remove BOM
            .replace(/\r\n/g, '\n') // Normalize line endings
            .replace(/\r/g, '\n')
            .trim();
          
          console.log('PDF text extraction result, length:', cleanText.length);
          
          // Check if extracted text is meaningful
          const meaningfulTextRatio = (cleanText.match(/[a-zA-Z\u0900-\u097F\u0A80-\u0AFF\s]/g) || []).length / cleanText.length;
          
          // If text is too short or mostly garbled, use Gemini API
          if (cleanText.length < 100 || meaningfulTextRatio < 0.5) {
            console.log('PDF appears to be image-based, using Gemini API extraction...');
            try {
              const geminiText = await extractTextWithGemini(file.buffer);
              if (geminiText && geminiText.length > 50) {
                console.log('Gemini extraction successful, length:', geminiText.length);
                return geminiText;
              }
            } catch (geminiError) {
              console.error('Gemini extraction failed:', geminiError);
            }
            return 'Unable to extract text from this PDF. The document may be image-based or corrupted.';
          }
          
          return cleanText;
        } else {
          console.log('No text extracted with pdf-parse, trying Gemini API...');
          try {
            const geminiText = await extractTextWithGemini(file.buffer);
            if (geminiText && geminiText.length > 50) {
              console.log('Gemini extraction successful, length:', geminiText.length);
              return geminiText;
            }
          } catch (geminiError) {
            console.error('Gemini extraction failed:', geminiError);
          }
          return 'Unable to extract text from this PDF. Please try a different file format.';
        }
      } catch (pdfError) {
        console.error('PDF parsing failed, trying Gemini API as fallback:', pdfError);
        try {
          const geminiText = await extractTextWithGemini(file.buffer);
          if (geminiText && geminiText.length > 50) {
            console.log('Gemini fallback extraction successful, length:', geminiText.length);
            return geminiText;
          }
        } catch (geminiError) {
          console.error('Gemini fallback failed:', geminiError);
        }
        return 'Unable to extract text from this PDF. Please ensure the file is not corrupted and try again.';
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
    else if (file.mimetype === 'text/html') {
      console.log('Processing HTML document...');
      const htmlContent = file.buffer.toString('utf8');
      // Extract text from HTML by removing tags and decoding entities
      const textContent = htmlContent
        .replace(/<script[^>]*>.*?<\/script>/gis, '') // Remove script tags
        .replace(/<style[^>]*>.*?<\/style>/gis, '') // Remove style tags
        .replace(/<[^>]*>/g, ' ') // Remove HTML tags and replace with space
        .replace(/&nbsp;/g, ' ') // Replace HTML entities
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/\uFEFF/g, '') // Remove BOM
        .trim();
      console.log('HTML text extraction completed, length:', textContent.length);
      return textContent || 'HTML document uploaded successfully but no text content found.';
    } 
    else {
      throw new Error('Unsupported file type. Please upload a PDF, DOC, DOCX, or TXT file.');
    }
  } catch (error) {
    console.error(`File parsing error for ${file.mimetype}:`, error);
    return `File uploaded successfully but text extraction failed: ${error.message}`;
  }
};