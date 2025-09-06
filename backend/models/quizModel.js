import mongoose from 'mongoose';

const questionSchema = mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: String, required: true },
});

const descriptiveQuestionSchema = mongoose.Schema({
    question: { type: String, required: true },
});

const quizSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    note: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    questions: [questionSchema],
    descriptiveQuestions: [descriptiveQuestionSchema],
  },
  { timestamps: true }
);

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;