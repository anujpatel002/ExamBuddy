import express from 'express';
import multer from 'multer';
import { extractTextFromFile } from '../utils/fileParser.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/html'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  }
});

router.post('/extract-text', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('Extracting text from:', req.file.originalname, 'Type:', req.file.mimetype, 'Size:', req.file.size);
    
    const text = await extractTextFromFile(req.file);
    
    console.log('Extraction result length:', text?.length || 0);
    console.log('First 200 chars:', text?.substring(0, 200) || 'No text extracted');
    
    // Validate extraction result
    if (!text || text.length < 50 || text.includes('Unable to extract') || text.includes('INTERNAL_OCR_REQUIRED')) {
      return res.status(400).json({ 
        message: 'Failed to extract readable text from PDF. Please ensure the PDF contains selectable text or try converting to DOCX/TXT format.',
        text: 'PDF text extraction failed - no readable content found'
      });
    }
    
    res.json({ 
      text,
      filename: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype,
      extractedLength: text.length
    });
  } catch (error) {
    console.error('Text extraction error:', error);
    res.status(500).json({ 
      message: 'Failed to extract text from file: ' + error.message,
      text: 'PDF processing failed'
    });
  }
});

export default router;