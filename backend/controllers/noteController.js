import asyncHandler from 'express-async-handler';
import Note from '../models/noteModel.js';
import User from '../models/userModel.js';
import { extractTextFromFile } from '../utils/fileParser.js';
import crypto from 'crypto';
import { createEmbeddingsForNote } from '../utils/vectorStore.js';
import { updateStreak, addPoints } from '../utils/gamification.js';
import { getPlanLimits } from '../middleware/planLimits.js';

const uploadNote = asyncHandler(async (req, res) => {
  // --- THIS IS THE FIX ---
  // Define subjectId at the top of the function
  const { title, subjectId } = req.body;
  const user = await User.findById(req.user._id);
  const userPlan = user.subscription?.plan || 'free';
  const limits = getPlanLimits(userPlan);
  
  // Now the check can safely use the subjectId variable
  const notesInSubject = await Note.countDocuments({ user: req.user._id, subject: subjectId });
  
  if (limits.notesPerSubject !== -1 && notesInSubject >= limits.notesPerSubject) {
    res.status(403);
    throw new Error(`Note limit reached. Upgrade your plan to add more than ${limits.notesPerSubject} notes per subject.`);
  }

  const file = req.file;

  if (!file || !title || !subjectId) {
    res.status(400); throw new Error('Title, file, and subject are required');
  }

  try {
    const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');
    const existingNote = await Note.findOne({ fileHash });
    
    let fileUrl = `/uploads/${file.originalname}`;
    let isDuplicate = false;

    if (existingNote) {
      fileUrl = existingNote.fileUrl;
      isDuplicate = true;
    }

    const textContent = await extractTextFromFile(file);
    
    const note = new Note({
      title, subject: subjectId, user: req.user._id, fileUrl,
      fileName: file.originalname, textContent, status: 'approved',
      fileHash, isDuplicate, embeddingStatus: 'pending'
    });
    
    const createdNote = await note.save();
    
    await User.findByIdAndUpdate(req.user._id, { $inc: { 'usage.noteCount': 1 } });
    
    await updateStreak(req.user._id);
    await addPoints(req.user._id, 'UPLOAD_NOTE');

    if (textContent && textContent.trim().length > 0) {
      createEmbeddingsForNote(createdNote._id, textContent)
          .then(async () => {
              await Note.findByIdAndUpdate(createdNote._id, { embeddingStatus: 'completed' });
              console.log(`Embeddings created for note ${createdNote._id}`);
          })
          .catch(async (err) => {
              await Note.findByIdAndUpdate(createdNote._id, { embeddingStatus: 'failed' });
              console.error(`Embedding failed for note ${createdNote._id}:`, err);
          });
    }
        
    res.status(201).json(createdNote);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500);
    throw new Error(`Upload failed: ${error.message}`);
  }
});

const getMyNotes = asyncHandler(async (req, res) => {
    const notes = await Note.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(notes);
});

const getNoteById = asyncHandler(async (req, res) => {
    const note = await Note.findById(req.params.id);

    if (note) {
        if (note.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            res.status(403);
            throw new Error('Not authorized to view this note');
        }
        res.json(note);
    } else {
        res.status(404);
        throw new Error('Note not found');
    }
});

const updateNote = asyncHandler(async (req, res) => {
  const { title } = req.body;
  const note = await Note.findById(req.params.id);

  if (note && note.user.toString() === req.user._id.toString()) {
    note.title = title || note.title;
    const updatedNote = await note.save();
    res.json(updatedNote);
  } else {
    res.status(404);
    throw new Error('Note not found');
  }
});

const deleteNote = asyncHandler(async (req, res) => {
    const note = await Note.findById(req.params.id);

    if (note && note.user.toString() === req.user._id.toString()) {
        await note.deleteOne();
        await User.findByIdAndUpdate(req.user._id, { $inc: { 'usage.noteCount': -1 } });
        res.json({ message: 'Note removed' });
    } else {
        res.status(404); throw new Error('Note not found');
    }
});

const deleteMultipleNotes = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    res.status(400);
    throw new Error('No note IDs provided');
  }

  const notes = await Note.find({ '_id': { $in: ids }, user: req.user._id });

  if (notes.length === 0) {
    res.status(404);
    throw new Error('No matching notes found for this user.');
  }

  const noteIdsToDelete = notes.map(n => n._id);
  await Note.deleteMany({ '_id': { $in: noteIdsToDelete } });
  
  await User.findByIdAndUpdate(req.user._id, { $inc: { 'usage.noteCount': -notes.length } });

  res.json({ message: `${notes.length} notes were removed.` });
});

export { 
  uploadNote, 
  getMyNotes, 
  getNoteById, 
  deleteNote, 
  updateNote,
  deleteMultipleNotes 
};