import asyncHandler from 'express-async-handler';
import Quiz from '../models/quizModel.js';



// @desc    Get a quiz by ID
// @route   GET /api/quizzes/:id
// @access  Private
const getQuizById = asyncHandler(async (req, res) => {
    // The default findById will include the note's ObjectId, which is all we need.
    const quiz = await Quiz.findById(req.params.id);
    if(quiz){
        res.json(quiz);
    } else {
        res.status(404);
        throw new Error('Quiz not found');
    }
});
// @desc    Get all quizzes created by the user
// @route   GET /api/quizzes/my
// @access  Private
const getMyQuizzes = asyncHandler(async (req, res) => {
    const quizzes = await Quiz.find({ createdBy: req.user._id })
                              .populate('note', 'title')
                              .sort({ createdAt: -1 });

    // Add question count to each quiz object
    const quizzesWithCount = quizzes.map(quiz => ({
      ...quiz.toObject(),
      questionCount: quiz.questions.length
    }));
    
    res.json(quizzesWithCount);
});

// @desc    Delete a quiz
// @route   DELETE /api/quizzes/:id
// @access  Private
const deleteQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);

  if (quiz && quiz.createdBy.toString() === req.user._id.toString()) {
    await quiz.deleteOne();
    res.json({ message: 'Quiz removed' });
  } else {
    res.status(404);
    throw new Error('Quiz not found');
  }
});

export { getMyQuizzes, getQuizById, deleteQuiz };
