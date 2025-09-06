import asyncHandler from 'express-async-handler';
import Note from '../models/noteModel.js';
import { extractTextFromFile } from '../utils/fileParser.js';

// @desc    Upload a new note
// @route   POST /api/notes/upload
// @access  Private
const uploadNote = asyncHandler(async (req, res) => {
  const { title, subjectId } = req.body;
  const file = req.file;

  if (!file || !title || !subjectId) {
    res.status(400);
    throw new Error('Title, file, and subject are required');
  }

  try {
    const textContent = await extractTextFromFile(file);
    const fileUrl = `/uploads/${file.filename}`; // Placeholder URL

    const note = new Note({
      title,
      subject: subjectId,
      user: req.user._id,
      fileUrl,
      fileName: file.originalname,
      textContent,
      status: 'approved',
    });

    const createdNote = await note.save();
    res.status(201).json(createdNote);
  } catch (error) {
    res.status(500);
    throw new Error(`File processing failed: ${error.message}`);
  }
});

// @desc    Get all notes for a logged-in user
// @route   GET /api/notes
// @access  Private
const getMyNotes = asyncHandler(async (req, res) => {
    const notes = await Note.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(notes);
});

// @desc    Get a single note by ID
// @route   GET /api/notes/:id
// @access  Private
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

// @desc    Update a note
// @route   PUT /api/notes/:id
// @access  Private
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

// @desc    Delete a single note
// @route   DELETE /api/notes/:id
// @access  Private
const deleteNote = asyncHandler(async (req, res) => {
    const note = await Note.findById(req.params.id);

    if (note && note.user.toString() === req.user._id.toString()) {
        // You might also want to delete associated quizzes here
        await note.deleteOne();
        res.json({ message: 'Note removed' });
    } else {
        res.status(404);
        throw new Error('Note not found');
    }
});

// @desc    Delete multiple notes
// @route   DELETE /api/notes
// @access  Private
const deleteMultipleNotes = asyncHandler(async (req, res) => {
  const { ids } = req.body; // Expect an array of note IDs

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    res.status(400);
    throw new Error('No note IDs provided');
  }

  // Find notes that belong to the current user
  const notes = await Note.find({ '_id': { $in: ids }, user: req.user._id });

  if (notes.length === 0) {
    res.status(404);
    throw new Error('No matching notes found for this user.');
  }

  // You might also want to delete associated quizzes here
  const noteIdsToDelete = notes.map(n => n._id);
  await Note.deleteMany({ '_id': { $in: noteIdsToDelete } });

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