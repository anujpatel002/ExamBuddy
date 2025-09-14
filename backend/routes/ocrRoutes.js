import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import Note from '../models/noteModel.js';
import asyncHandler from 'express-async-handler';

const router = express.Router();

// Download OCR extracted text
const downloadOCRText = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.noteId);
  
  if (!note || note.user.toString() !== req.user._id.toString()) {
    res.status(404);
    throw new Error('Note not found or user not authorized');
  }
  
  if (!note.ocrText) {
    res.status(404);
    throw new Error('No OCR text available for this note');
  }
  
  const filename = `${note.title.replace(/[^a-zA-Z0-9]/g, '_')}_extracted.txt`;
  
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(note.ocrText);
});

router.get('/:noteId/download-ocr', protect, downloadOCRText);

export default router;