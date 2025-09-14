import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import Subject from '../models/subjectModel.js';

const pinQuestion = asyncHandler(async (req, res) => {
  const { subjectId, questionIndex, category, type } = req.body;

  if (!subjectId || questionIndex === undefined || !category) {
    res.status(400);
    throw new Error('Subject ID, question index, and category are required');
  }

  // Verify subject belongs to user
  const subject = await Subject.findById(subjectId);
  if (!subject || subject.user.toString() !== req.user._id.toString()) {
    res.status(404);
    throw new Error('Subject not found');
  }

  // Check if question is already pinned
  const existingPin = req.user.pinnedQuestions.find(
    pin => pin.subjectId.toString() === subjectId && 
           pin.questionIndex === questionIndex && 
           pin.category === category &&
           pin.type === type
  );

  if (existingPin) {
    res.status(400);
    throw new Error('Question is already pinned');
  }

  // Add to pinned questions
  req.user.pinnedQuestions.push({
    subjectId,
    questionIndex,
    category,
    type,
    pinnedAt: new Date()
  });

  await req.user.save();

  res.status(201).json({
    message: 'Question pinned successfully',
    pinnedQuestion: {
      subjectId,
      questionIndex,
      category,
      type
    }
  });
});

const unpinQuestion = asyncHandler(async (req, res) => {
  const { subjectId, questionIndex, category, type } = req.body;

  if (!subjectId || questionIndex === undefined || !category) {
    res.status(400);
    throw new Error('Subject ID, question index, and category are required');
  }

  // Remove from pinned questions
  req.user.pinnedQuestions = req.user.pinnedQuestions.filter(
    pin => !(pin.subjectId.toString() === subjectId && 
             pin.questionIndex === questionIndex && 
             pin.category === category &&
             pin.type === type)
  );

  await req.user.save();

  res.status(200).json({
    message: 'Question unpinned successfully'
  });
});

const getPinnedQuestions = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;

  // Get user with populated pinned questions
  const user = await User.findById(req.user._id).populate('pinnedQuestions.subjectId');
  
  let pinnedQuestions = user.pinnedQuestions;

  // Filter by subject if provided
  if (subjectId) {
    pinnedQuestions = pinnedQuestions.filter(
      pin => pin.subjectId._id.toString() === subjectId
    );
  }

  // Get the actual question data for each pinned question
  const questionsWithData = [];
  
  for (const pin of pinnedQuestions) {
    const subject = await Subject.findById(pin.subjectId._id);
    if (subject && subject.questionBank) {
      let questionData = null;
      
      // Handle nested structure (theory/practical)
      if (subject.questionBank.theory || subject.questionBank.practical) {
        const targetType = pin.type || 'theory';
        if (subject.questionBank[targetType] && subject.questionBank[targetType][pin.category]) {
          questionData = subject.questionBank[targetType][pin.category][pin.questionIndex];
        }
      } else {
        // Flat structure
        if (subject.questionBank[pin.category]) {
          questionData = subject.questionBank[pin.category][pin.questionIndex];
        }
      }

      if (questionData) {
        questionsWithData.push({
          ...pin.toObject(),
          questionData,
          subjectName: subject.name
        });
      }
    }
  }

  res.status(200).json({
    pinnedQuestions: questionsWithData,
    count: questionsWithData.length
  });
});

export { pinQuestion, unpinQuestion, getPinnedQuestions };