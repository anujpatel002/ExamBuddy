import asyncHandler from 'express-async-handler';
import Subject from '../models/subjectModel.js';
import Note from '../models/noteModel.js';
import { getPlanLimits } from '../middleware/planLimits.js';

// @desc    Create a new subject
// @route   POST /api/subjects
// @access  Private
const createSubject = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name || name.trim() === '') {
    res.status(400);
    throw new Error('Subject name cannot be empty.');
  }

  // Check plan limits
  const userPlan = req.user.subscription?.plan || 'free';
  const limits = getPlanLimits(userPlan);
  const currentSubjectCount = await Subject.countDocuments({ user: req.user._id });
  
  if (limits.subjects !== -1 && currentSubjectCount >= limits.subjects) {
    res.status(403);
    throw new Error(`Subject limit reached. Upgrade your plan to create more than ${limits.subjects} subjects.`);
  }

  const subject = new Subject({
    name,
    user: req.user._id,
  });
  
  const createdSubject = await subject.save();
  res.status(201).json(createdSubject);
});

// @desc    Get subjects for a logged in user
// @route   GET /api/subjects
// @access  Private
const getMySubjects = asyncHandler(async (req, res) => {
  const subjects = await Subject.find({ user: req.user._id }).sort({ name: 1 });
  res.json(subjects);
});

// @desc    Get a single subject by ID with its notes
// @route   GET /api/subjects/:id
// @access  Private
const getSubjectById = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);
  if (subject && subject.user.toString() === req.user._id.toString()) {
    const notes = await Note.find({ subject: req.params.id }).sort({ title: 1 });
    res.json({ subject, notes });
  } else {
    res.status(404);
    throw new Error('Subject not found');
  }
});

// @desc    Update a subject
// @route   PUT /api/subjects/:id
// @access  Private
const updateSubject = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const subject = await Subject.findById(req.params.id);

  if (subject && subject.user.toString() === req.user._id.toString()) {
    subject.name = name || subject.name;
    const updatedSubject = await subject.save();
    res.json(updatedSubject);
  } else {
    res.status(404);
    throw new Error('Subject not found');
  }
});

// @desc    Delete a single subject (and its notes)
// @route   DELETE /api/subjects/:id
// @access  Private
const deleteSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);

  if (subject && subject.user.toString() === req.user._id.toString()) {
    await Note.deleteMany({ subject: req.params.id }); // Delete associated notes
    await subject.deleteOne();
    res.json({ message: 'Subject and associated notes removed' });
  } else {
    res.status(404);
    throw new Error('Subject not found');
  }
});

// @desc    Delete multiple subjects
// @route   DELETE /api/subjects
// @access  Private
const deleteMultipleSubjects = asyncHandler(async (req, res) => {
  const { ids } = req.body; // Expect an array of IDs

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    res.status(400);
    throw new Error('No subject IDs provided');
  }

  // Find subjects that belong to the current user
  const subjects = await Subject.find({ '_id': { $in: ids }, user: req.user._id });

  if (subjects.length === 0) {
    res.status(404);
    throw new Error('No matching subjects found for this user.');
  }

  const subjectIdsToDelete = subjects.map(s => s._id);

  // Delete all notes associated with the found subjects
  await Note.deleteMany({ subject: { $in: subjectIdsToDelete } });
  
  // Delete the subjects themselves
  await Subject.deleteMany({ '_id': { $in: subjectIdsToDelete } });

  res.json({ message: `${subjects.length} subjects and their notes were removed.` });
});


export { 
  createSubject, 
  getMySubjects, 
  getSubjectById, 
  updateSubject, 
  deleteSubject,
  deleteMultipleSubjects
};