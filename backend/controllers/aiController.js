import asyncHandler from 'express-async-handler';
import Note from '../models/noteModel.js';
import Quiz from '../models/quizModel.js';
import { generateSummary, generateFlashcards, generateQuiz, generateMarkBasedQuestions } from '../services/aiService.js';
import { parseAndSanitize } from '../utils/markdownParser.js';

const createSummary = asyncHandler(async (req, res) => {
    const note = await Note.findById(req.params.noteId);
    if (!note || note.user.toString() !== req.user._id.toString()) {
        res.status(404);
        throw new Error('Note not found or user not authorized');
    }
    const summaryMarkdown = await generateSummary(note.textContent);
    note.summary = parseAndSanitize(summaryMarkdown); 
    await note.save();
    res.json({ summary: note.summary });
});

const createFlashcards = asyncHandler(async (req, res) => {
    const note = await Note.findById(req.params.noteId);
    if (!note || note.user.toString() !== req.user._id.toString()) {
        res.status(404);
        throw new Error('Note not found or user not authorized');
    }
    const newFlashcards = await generateFlashcards(note.textContent, note.flashcards.length);
    note.flashcards.push(...newFlashcards);
    await note.save();
    res.json({ flashcards: note.flashcards });
});

const createQuiz = asyncHandler(async (req, res) => {
    const { quizName, questionCount } = req.body;
    const note = await Note.findById(req.params.noteId);

    if (!quizName) {
        res.status(400);
        throw new Error('Quiz name is required.');
    }

    if (!note || note.user.toString() !== req.user._id.toString()) {
        res.status(404);
        throw new Error('Note not found or user not authorized');
    }
    
    const quizData = await generateQuiz(note.textContent, questionCount);

    const quiz = new Quiz({
        title: quizName, // Use the user-provided name
        note: note._id,
        createdBy: req.user._id,
        questions: quizData.mcqs,
        descriptiveQuestions: quizData.descriptive,
    });
    
    const createdQuiz = await quiz.save();
    res.status(201).json(createdQuiz);
});

const createCategorizedQuestions = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.noteId);
  if (!note || note.user.toString() !== req.user._id.toString()) {
    res.status(404);
    throw new Error('Note not found');
  }
  const questions = await generateMarkBasedQuestions(note.textContent);
  for (const category in questions) {
    if (Array.isArray(questions[category])) {
      questions[category] = questions[category].map(q => ({ ...q, answer: parseAndSanitize(q.answer) }));
    }
  }
  note.categorizedQuestions = questions;
  await note.save();
  res.status(201).json(note.categorizedQuestions);
});

const createMoreCategorizedQuestions = asyncHandler(async (req, res) => {
  const { category } = req.body;
  const note = await Note.findById(req.params.noteId);
  
  if (!note || note.user.toString() !== req.user._id.toString()) {
    res.status(404); throw new Error('Note not found');
  }
  if (!category || !note.categorizedQuestions[category]) {
    res.status(400); throw new Error('Invalid category specified.');
  }

  const existingQuestions = note.categorizedQuestions[category];
  const newQuestions = await generateMarkBasedQuestions(note.textContent, category, existingQuestions);
  
  const sanitizedNewQuestions = newQuestions.map(q => ({
    ...q,
    answer: parseAndSanitize(q.answer)
  }));
  
  note.categorizedQuestions[category].push(...sanitizedNewQuestions);
  await note.save();
  
  res.status(201).json(note.categorizedQuestions);
});

export { createSummary, createFlashcards, createQuiz, createCategorizedQuestions, createMoreCategorizedQuestions };