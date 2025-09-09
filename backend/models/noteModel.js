import mongoose from 'mongoose';

const noteSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    subject: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Subject' },
    title: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileHash: { type: String, required: true, index: true },
    isDuplicate: { type: Boolean, default: false },
    textContent: { type: String, required: true },
    status: { type: String, required: true, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
    summary: { type: String },
    flashcards: [{ question: String, answer: String }],
    categorizedQuestions: {
      oneMarker: [{ question: String, answer: String }],
      threeMarker: [{ question: String, answer: String }],
      fourMarker: [{ question: String, answer: String }],
      fiveMarker: [{ question: String, answer: String }],
    },
    mindMap: { type: Object },
    embeddingStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

const Note = mongoose.model('Note', noteSchema);
export default Note;