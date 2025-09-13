import asyncHandler from 'express-async-handler';
import Note from '../models/noteModel.js';
import User from '../models/userModel.js';
import Quiz from '../models/quizModel.js';
import { extractTextFromFile } from '../utils/fileParser.js';
import crypto from 'crypto';
import { createEmbeddingsForNote } from '../utils/vectorStore.js';
import { updateStreak, addPoints } from '../utils/gamification.js';
import { getPlanLimits } from '../middleware/planLimits.js';

const uploadNote = asyncHandler(async (req, res) => {
  const { title, subjectId } = req.body;
  const user = await User.findById(req.user._id);
  
  // Check if subscription is active
  const isActive = user.isSubscriptionActive();
  const userPlan = isActive ? (user.subscription?.plan || 'free') : 'free';
  const limits = getPlanLimits(userPlan);
  
  const notesInSubject = await Note.countDocuments({ user: req.user._id, subject: subjectId });
  
  if (limits.notesPerSubject !== -1 && notesInSubject >= limits.notesPerSubject) {
    res.status(403);
    throw new Error(`Note limit reached. Your ${userPlan} plan allows ${limits.notesPerSubject} notes per subject. Upgrade to add more notes.`);
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
        
        console.log('=== BACKEND - NOTE FETCH ===');
        console.log('User ID:', req.user._id);
        console.log('Note ID:', req.params.id);
        if (note.flashcards) {
            console.log('Theory displayed in DB:', note.flashcards.theory?.length || 0);
            console.log('Practical displayed in DB:', note.flashcards.practical?.length || 0);
            console.log('Theory total in DB:', note.flashcards.allGenerated?.theory?.length || 0);
            console.log('Practical total in DB:', note.flashcards.allGenerated?.practical?.length || 0);
        }
        console.log('=== END BACKEND FETCH ===');
        
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

const resetFlashcards = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);
  
  if (!note || note.user.toString() !== req.user._id.toString()) {
    res.status(404);
    throw new Error('Note not found or user not authorized');
  }
  
  const { displayedCount } = req.body;
  
  if (note.flashcards && displayedCount) {
    // Reset the displayed flashcards based on the new displayed count
    if (displayedCount.theory !== undefined) {
      const theoryCards = note.flashcards.allGenerated?.theory?.slice(0, displayedCount.theory) || [];
      note.flashcards.theory = theoryCards;
      note.flashcards.displayedCount.theory = displayedCount.theory;
    }
    
    if (displayedCount.practical !== undefined) {
      const practicalCards = note.flashcards.allGenerated?.practical?.slice(0, displayedCount.practical) || [];
      note.flashcards.practical = practicalCards;
      note.flashcards.displayedCount.practical = displayedCount.practical;
    }
    
    note.markModified('flashcards');
    await note.save();
  }
  
  res.json({ message: 'Content reset successfully' });
});

const resetPracticeQuestions = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);
  
  if (!note || note.user.toString() !== req.user._id.toString()) {
    res.status(404);
    throw new Error('Note not found or user not authorized');
  }
  
  if (note.categorizedQuestions && note.categorizedQuestions.allGenerated) {
    const markerKeys = ['oneMarker', 'threeMarker', 'fourMarker', 'fiveMarker'];
    
    markerKeys.forEach(key => {
      if (note.categorizedQuestions.allGenerated[key]) {
        const questionsToShow = note.categorizedQuestions.allGenerated[key].slice(0, 3);
        note.categorizedQuestions[key] = questionsToShow;
        note.categorizedQuestions.displayedCount[key] = questionsToShow.length;
      }
    });
    
    note.markModified('categorizedQuestions');
    await note.save();
  }
  
  res.json({ message: 'Practice questions reset successfully' });
});

const resetQuizzes = asyncHandler(async (req, res) => {
  const { noteId } = req.params;
  
  // Hide all quizzes except the first 3 for this note
  await Quiz.updateMany(
    { note: noteId, createdBy: req.user._id },
    { isVisible: false }
  );
  
  const quizzesToShow = await Quiz.find(
    { note: noteId, createdBy: req.user._id }
  ).sort({ createdAt: 1 }).limit(3);
  
  await Quiz.updateMany(
    { _id: { $in: quizzesToShow.map(q => q._id) } },
    { isVisible: true }
  );
  
  res.json({ message: 'Quizzes reset successfully' });
});

export { 
  uploadNote, 
  getMyNotes, 
  getNoteById, 
  deleteNote, 
  updateNote,
  deleteMultipleNotes,
  resetFlashcards,
  resetPracticeQuestions,
  resetQuizzes
};