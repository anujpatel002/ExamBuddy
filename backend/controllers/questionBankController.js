import asyncHandler from 'express-async-handler';
import Subject from '../models/subjectModel.js';
import Note from '../models/noteModel.js';
import { extractTopics, generateQuestionsForTopic } from '../services/aiService.js';
import { parseAndSanitize } from '../utils/markdownParser.js';

const generateQuestionBank = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.subjectId);
  if (!subject || subject.user.toString() !== req.user._id.toString()) {
    res.status(404);
    throw new Error('Subject not found');
  }

  const notes = await Note.find({ subject: req.params.subjectId });
  if (notes.length === 0) {
    res.status(400);
    throw new Error('No notes in this subject to analyze.');
  }
  const combinedText = notes.map(note => note.textContent).join('\n\n');

  const { topics } = await extractTopics(combinedText);

  // Process topics in parallel for better performance
  const questionPromises = topics.map(async (topicItem) => {
    const generatedQuestions = await generateQuestionsForTopic(combinedText, topicItem.topic);
    
    const sanitizedQuestions = generatedQuestions.map(q => ({
        ...q,
        answer: parseAndSanitize(q.answer)
    }));

    return {
      topic: topicItem.topic,
      importance: topicItem.importance,
      questions: sanitizedQuestions
    };
  });

  const questionBank = await Promise.all(questionPromises);

  subject.questionBank = questionBank;
  await subject.save();

  res.status(201).json(subject.questionBank);
});

export { generateQuestionBank };