import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import Note from '../models/noteModel.js';

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password');
  res.json(users);
});

// @desc    Get all notes (for admin overview)
// @route   GET /api/admin/notes
// @access  Private/Admin
const getAllNotes = asyncHandler(async (req, res) => {
    const notes = await Note.find({}).populate('user', 'name email').sort({ createdAt: -1 });
    res.json(notes);
});

// @desc    Approve a note
// @route   PUT /api/admin/notes/:id/approve
// @access  Private/Admin
const approveNote = asyncHandler(async (req, res) => {
    const note = await Note.findById(req.params.id);

    if (note) {
        note.status = 'approved';
        const updatedNote = await note.save();
        res.json(updatedNote);
    } else {
        res.status(404);
        throw new Error('Note not found');
    }
});

export { getUsers, getAllNotes, approveNote };