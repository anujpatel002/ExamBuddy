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
    note: { type: mongoose.Schema.Types.ObjectId, ref: 'Note' },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    questions: { type: mongoose.Schema.Types.Mixed },
    descriptiveQuestions: { type: mongoose.Schema.Types.Mixed },
    hasTheoryPractical: { type: Boolean, default: false },
    isVisible: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Validation: Either note or subject must be provided
quizSchema.pre('validate', function(next) {
  if (!this.note && !this.subject) {
    next(new Error('Either note or subject must be provided'));
  } else {
    next();
  }
});

// Virtual for question count
quizSchema.virtual('questionCount').get(function() {
  if (this.hasTheoryPractical && this.questions.theoretical && this.questions.practical) {
    return (this.questions.theoretical?.length || 0) + (this.questions.practical?.length || 0);
  }
  return Array.isArray(this.questions) ? this.questions.length : 0;
});

quizSchema.set('toJSON', { virtuals: true });
quizSchema.set('toObject', { virtuals: true });

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;