import asyncHandler from 'express-async-handler';
import Subject from '../models/subjectModel.js';
import Note from '../models/noteModel.js';
import User from '../models/userModel.js';
import { generateMarkBasedQuestions } from '../services/aiService.js';
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

  const emitProgress = (message, progress) => {
    if (req.io && req.userSocketMap[req.user._id]) {
      req.io.to(req.userSocketMap[req.user._id]).emit('qbank-progress', { message, progress });
    }
  };

  emitProgress('Starting question generation...', 10);

  // Generate questions from individual notes (80%)
  const individualQuestions = [];
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    try {
      emitProgress(`Processing ${note.title}...`, 20 + (i * 40 / notes.length));
      
      const questions = await generateMarkBasedQuestions(note.textContent);
      
      // Handle both nested (theoretical/practical) and flat structures
      const processQuestions = (questionSet, prefix = '') => {
        ['oneMarker', 'threeMarker', 'fourMarker', 'fiveMarker'].forEach(category => {
          if (questionSet[category] && questionSet[category].length > 0) {
            questionSet[category].forEach(q => {
              individualQuestions.push({
                question: q.question,
                answer: parseAndSanitize(q.answer),
                marks: category === 'oneMarker' ? 1 : 
                       category === 'threeMarker' ? 3 : 
                       category === 'fourMarker' ? 4 : 5,
                source: note.title + (prefix ? ` (${prefix})` : ''),
                type: 'individual'
              });
            });
          }
        });
      };
      
      // Check if it's nested structure (theory/practical)
      if (questions.theory || questions.practical) {
        if (questions.theory) processQuestions(questions.theory, 'Theory');
        if (questions.practical) processQuestions(questions.practical, 'Practical');
      } else {
        // Flat structure
        processQuestions(questions);
      }
    } catch (error) {
      console.error(`Error generating questions for note ${note.title}:`, error);
    }
  }

  emitProgress('Generating unit combinations...', 70);

  // Generate combination questions (20%) if multiple notes exist
  const combinationQuestions = [];
  if (notes.length >= 2) {
    try {
      const combinedText = notes.map(note => `${note.title}:\n${note.textContent}`).join('\n\n---\n\n');
      const combinedQs = await generateMarkBasedQuestions(combinedText);
      
      ['threeMarker', 'fourMarker', 'fiveMarker'].forEach(category => {
        if (combinedQs[category] && combinedQs[category].length > 0) {
          combinedQs[category].slice(0, 2).forEach(q => {
            combinationQuestions.push({
              question: q.question,
              answer: parseAndSanitize(q.answer),
              marks: category === 'threeMarker' ? 3 : 
                     category === 'fourMarker' ? 4 : 5,
              source: 'Multiple Units',
              type: 'combination'
            });
          });
        }
      });
    } catch (error) {
      console.error('Error generating combination questions:', error);
    }
  }

  emitProgress('Organizing questions...', 85);

  // Combine and organize all questions
  const allQuestions = [...individualQuestions, ...combinationQuestions];
  
  // Check if we have practical content
  const hasPractical = allQuestions.some(q => q.source.includes('Practical'));
  
  // Group by marks and type for better organization
  const questionBank = hasPractical ? {
    theory: {
      oneMarker: allQuestions.filter(q => q.marks === 1 && !q.source.includes('Practical')),
      threeMarker: allQuestions.filter(q => q.marks === 3 && !q.source.includes('Practical')),
      fourMarker: allQuestions.filter(q => q.marks === 4 && !q.source.includes('Practical')),
      fiveMarker: allQuestions.filter(q => q.marks === 5 && !q.source.includes('Practical'))
    },
    practical: {
      oneMarker: allQuestions.filter(q => q.marks === 1 && q.source.includes('Practical')),
      threeMarker: allQuestions.filter(q => q.marks === 3 && q.source.includes('Practical')),
      fourMarker: allQuestions.filter(q => q.marks === 4 && q.source.includes('Practical')),
      fiveMarker: allQuestions.filter(q => q.marks === 5 && q.source.includes('Practical'))
    }
  } : {
    oneMarker: allQuestions.filter(q => q.marks === 1),
    threeMarker: allQuestions.filter(q => q.marks === 3),
    fourMarker: allQuestions.filter(q => q.marks === 4),
    fiveMarker: allQuestions.filter(q => q.marks === 5)
  };

  emitProgress('Saving question bank...', 95);

  subject.questionBank = questionBank;
  await subject.save();
  
  // Update user credits
  await User.findByIdAndUpdate(req.user._id, { $inc: { 'usage.requests': 1 } });

  emitProgress('Question bank generated successfully!', 100);

  res.status(201).json(subject.questionBank);
});

export { generateQuestionBank };