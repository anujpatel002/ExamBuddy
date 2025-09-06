import mongoose from 'mongoose';

const noteSchema = mongoose.Schema(
  { subject: { // <-- ADD THIS
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Subject',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    title: {
      type: String,
      required: true,
    },
    fileUrl: { // This would be a Cloudinary/S3 URL in full production
      type: String,
      required: true,
    },
    fileName: {
        type: String,
        required: true,
    },
    textContent: { // The extracted text from the document
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    // AI Generated Content
    summary: {
      type: String,
    },
    flashcards: [
      {
        question: String,
        answer: String,
      },
    ],
    // --- ADD THIS NEW FIELD ---
    categorizedQuestions: {
      oneMarker: [{ question: String, answer: String }],
      threeMarker: [{ question: String, answer: String }],
      fourMarker: [{ question: String, answer: String }],
      fiveMarker: [{ question: String, answer: String }],
    },
  },
  {
    timestamps: true,
  }
);

const Note = mongoose.model('Note', noteSchema);
export default Note;