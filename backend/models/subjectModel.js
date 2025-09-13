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
  questionBank: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  studyPlan: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, { timestamps: true });

const Subject = mongoose.model('Subject', subjectSchema);
export default Subject;