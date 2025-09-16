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

const generateMoreQuestions = asyncHandler(async (req, res) => {
  const { category, type, reset } = req.body; // type = 'theory' or 'practical', reset = true to clear existing
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

  // If reset is requested, clear existing questions for this category
  if (reset) {
    if (!subject.questionBank) {
      subject.questionBank = {};
    }
    
    const hasNestedStructure = subject.questionBank.theory || subject.questionBank.practical;
    
    if (hasNestedStructure) {
      const targetType = type || 'theory';
      if (!subject.questionBank[targetType]) {
        subject.questionBank[targetType] = {};
      }
      if (Object.prototype.hasOwnProperty.call(subject.questionBank, targetType) && 
          Object.prototype.hasOwnProperty.call(subject.questionBank[targetType], category)) {
        subject.questionBank[targetType][category] = [];
      }
    } else {
      if (Object.prototype.hasOwnProperty.call(subject.questionBank, category)) {
        subject.questionBank[category] = [];
      }
    }
    
    subject.markModified('questionBank');
    await subject.save();
  }

  // Check if we already have questions in database for this category
  const hasNestedStructure = subject.questionBank && (subject.questionBank.theory || subject.questionBank.practical);
  let existingQuestions = [];
  
  if (hasNestedStructure) {
    const targetType = type || 'theory';
    existingQuestions = subject.questionBank[targetType]?.[category] || [];
  } else {
    existingQuestions = subject.questionBank?.[category] || [];
  }

  // If we have existing questions and not resetting, return them (no credit charge)
  if (existingQuestions.length > 0 && !reset) {
    return res.status(200).json({ 
      message: `Retrieved ${existingQuestions.length} existing ${category} questions from database`, 
      questions: existingQuestions,
      category,
      hasNestedStructure,
      fromDatabase: true
    });
  }

  // Generate new questions from AI - one question per note for the specific category
  const newQuestions = [];
  for (const note of notes) {
    try {
      const questions = await generateMarkBasedQuestions(note.textContent);
      
      // Handle both nested and flat structures from AI response
      const processQuestions = (questionSet, prefix = '') => {
        if (questionSet[category] && questionSet[category].length > 0) {
          // Take only the first question from each note for this category
          const q = questionSet[category][0];
          newQuestions.push({
            question: q.question,
            answer: parseAndSanitize(q.answer),
            marks: category === 'oneMarker' ? 1 : 
                   category === 'threeMarker' ? 3 : 
                   category === 'fourMarker' ? 4 : 5,
            source: note.title + (prefix ? ` (${prefix})` : ''),
            type: 'individual'
          });
        }
      };
      
      // Check if AI returned nested structure (theory/practical)
      if (questions.theory || questions.practical) {
        // Only process the requested type
        if (type === 'theory' && questions.theory) {
          processQuestions(questions.theory, 'Theory');
        } else if (type === 'practical' && questions.practical) {
          processQuestions(questions.practical, 'Practical');
        } else if (!type) {
          // If no type specified, process both (backward compatibility)
          if (questions.theory) processQuestions(questions.theory, 'Theory');
          if (questions.practical) processQuestions(questions.practical, 'Practical');
        }
      } else {
        // Flat structure - always process
        processQuestions(questions);
      }
    } catch (error) {
      console.error(`Error generating questions for note ${note.title}:`, error);
    }
  }

  // Initialize question bank if it doesn't exist
  if (!subject.questionBank) {
    subject.questionBank = {};
  }
  
  // Determine if we should use nested structure based on existing data
  const isNestedStructure = subject.questionBank.theory || subject.questionBank.practical;
  
  if (isNestedStructure) {
    // Replace existing questions with new ones (one per note)
    const targetType = type || 'theory';
    if (!subject.questionBank[targetType]) {
      subject.questionBank[targetType] = {};
    }
    subject.questionBank[targetType][category] = newQuestions;
  } else {
    // Replace existing questions with new ones (one per note)
    subject.questionBank[category] = newQuestions;
  }
  
  // Force MongoDB to recognize the change
  subject.markModified('questionBank');
  await subject.save();
  
  // Update user credits - 2 for reset, 1 for new generation
  const creditIncrement = reset ? 2 : 1;
  await User.findByIdAndUpdate(req.user._id, { $inc: { 'usage.requests': creditIncrement } });

  console.log(`Generated ${newQuestions.length} questions for ${category} in subject ${subject.name}`);
  res.status(201).json({ 
    message: `${newQuestions.length} new ${category} questions generated`, 
    questions: newQuestions,
    category,
    hasNestedStructure: isNestedStructure,
    fromDatabase: false
  });
});

export { generateQuestionBank, generateMoreQuestions };