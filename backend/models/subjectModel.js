import mongoose from 'mongoose';

const subjectSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  questionBank: [
    {
      topic: String,
      importance: Number,
      questions: [
        {
          question: String,
          answer: String,
          marks: Number,
        }
      ]
    }
  ],
  studyPlan: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, { timestamps: true });

const Subject = mongoose.model('Subject', subjectSchema);
export default Subject;