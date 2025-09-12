import asyncHandler from 'express-async-handler';
import Note from '../models/noteModel.js';
import Quiz from '../models/quizModel.js';
import User from '../models/userModel.js';
import Subject from '../models/subjectModel.js';
import { 
  generateSummary, 
  generateFlashcards, 
  generateQuiz, 
  generateMarkBasedQuestions, 
  generateTitle,
  generateMindMap
} from '../services/aiService.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { parseAndSanitize } from '../utils/markdownParser.js';
import { extractTextFromFile } from '../utils/fileParser.js';

const QUIZ_LIMITS = {
    free: { maxQuizzesPerNote: 1, maxMCQs: 10 },
    pro: { maxQuizzesPerNote: 5, maxMCQs: 25 },
    premium: { maxQuizzesPerNote: 50, maxMCQs: 100 },
    ultra: { maxQuizzesPerNote: Infinity, maxMCQs: Infinity }
};

const createSummary = asyncHandler(async (req, res) => {
    const note = await Note.findById(req.params.noteId);
    if (!note || note.user.toString() !== req.user._id.toString()) {
        res.status(404);
        throw new Error('Note not found or user not authorized');
    }
    const summaryMarkdown = await generateSummary(note.textContent);
    note.summary = parseAndSanitize(summaryMarkdown); 
    await note.save();
    
    // Update user credits
    await User.findByIdAndUpdate(req.user._id, { $inc: { 'usage.requests': 1 } });
    
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
    
    // Update user credits
    await User.findByIdAndUpdate(req.user._id, { $inc: { 'usage.requests': 1 } });
    
    res.json({ flashcards: note.flashcards });
});

const createQuiz = asyncHandler(async (req, res) => {
    const { quizName, questionCount } = req.body;
    const note = await Note.findById(req.params.noteId);
    const user = await User.findById(req.user._id);
    const plan = user.subscription.plan;
    const limits = QUIZ_LIMITS[plan];

    if (!quizName) {
        res.status(400); throw new Error('Quiz name is required.');
    }
    if (!note || note.user.toString() !== req.user._id.toString()) {
        res.status(404); throw new Error('Note not found or user not authorized');
    }
    
    if (questionCount > limits.maxMCQs) {
        res.status(403);
        throw new Error(`Your ${plan} plan allows a maximum of ${limits.maxMCQs} MCQs per quiz.`);
    }

    const existingQuizzes = await Quiz.countDocuments({ note: req.params.noteId });
    if (existingQuizzes >= limits.maxQuizzesPerNote) {
        res.status(403);
        throw new Error(`Your ${plan} plan allows a maximum of ${limits.maxQuizzesPerNote} quizzes per note.`);
    }

    const quizData = await generateQuiz(note.textContent, questionCount);
    const quiz = new Quiz({
        title: quizName,
        note: note._id,
        createdBy: req.user._id,
        questions: quizData.mcqs,
        descriptiveQuestions: quizData.descriptive,
    });
    const createdQuiz = await quiz.save();
    
    // Update user credits
    await User.findByIdAndUpdate(req.user._id, { $inc: { 'usage.requests': 1 } });
    
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
  
  // Update user credits
  await User.findByIdAndUpdate(req.user._id, { $inc: { 'usage.requests': 1 } });
  
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
  
  // Update user credits
  await User.findByIdAndUpdate(req.user._id, { $inc: { 'usage.requests': 1 } });
  
  res.status(201).json(note.categorizedQuestions);
});

const suggestTitle = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) {
    res.status(400);
    throw new Error('No file provided for title suggestion.');
  }
  try {
    const textContent = await extractTextFromFile(file);
    const title = await generateTitle(textContent);
    res.json({ title });
  } catch (error) {
    res.status(500);
    throw new Error('Failed to suggest a title.');
  }
});

const createMindMap = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.noteId);
  if (!note || note.user.toString() !== req.user._id.toString()) {
    res.status(404);
    throw new Error('Note not found');
  }

  const mindMapData = await generateMindMap(note.textContent);

  note.mindMap = mindMapData;
  await note.save();
  
  // Update user credits
  await User.findByIdAndUpdate(req.user._id, { $inc: { 'usage.requests': 1 } });

  res.status(201).json(note.mindMap);
});

const createStudyPlan = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;
  const subject = await Subject.findById(subjectId);
  const notes = await Note.find({ subject: subjectId });

  if (!subject || subject.user.toString() !== req.user._id.toString()) {
    res.status(404);
    throw new Error('Subject not found');
  }

  if (notes.length < 2) {
    res.status(400);
    throw new Error('At least 2 notes required to generate a study plan');
  }

  const allContent = notes.map(note => `Title: ${note.title}\n${note.textContent}`).join('\n\n');
  
  const prompt = `Analyze the following study materials for the subject "${subject.name}" and create a comprehensive 4-week study plan.

Content:
${allContent}

Create a structured study plan with:
- Week-by-week breakdown
- Key topics to focus on each week
- Recommended study activities
- Logical progression from basics to advanced

Return as JSON with this structure:
{
  "weeks": [
    {
      "week": 1,
      "title": "Week title",
      "description": "What to focus on this week",
      "topics": ["topic1", "topic2"],
      "activities": ["activity1", "activity2"]
    }
  ]
}`;

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(prompt);
  const rawResponse = result.response.text();
  
  // Clean the response to extract JSON
  const startIndex = rawResponse.indexOf('{');
  const endIndex = rawResponse.lastIndexOf('}');
  const jsonString = rawResponse.substring(startIndex, endIndex + 1);
  
  subject.studyPlan = JSON.parse(jsonString);
  await subject.save();
  
  // Update user credits
  await User.findByIdAndUpdate(req.user._id, { $inc: { 'usage.requests': 1 } });

  res.json({ studyPlan: subject.studyPlan });
});

const compareConcepts = asyncHandler(async (req, res) => {
  const { noteIds } = req.body;
  
  if (!noteIds || noteIds.length !== 2) {
    res.status(400);
    throw new Error('Exactly 2 note IDs required for comparison');
  }

  const notes = await Note.find({ 
    _id: { $in: noteIds }, 
    user: req.user._id 
  });

  if (notes.length !== 2) {
    res.status(404);
    throw new Error('Notes not found or not authorized');
  }

  const [note1, note2] = notes;
  
  const prompt = `Compare and contrast the concepts from these two study materials:

Material 1: "${note1.title}"
${note1.textContent}

Material 2: "${note2.title}"
${note2.textContent}

Create a detailed comparison table showing key differences and similarities. Return as JSON with this structure:
{
  "title": "Comparison title",
  "concept1": "Name of first concept",
  "concept2": "Name of second concept",
  "comparisons": [
    {
      "aspect": "Comparison aspect",
      "value1": "Value for concept 1",
      "value2": "Value for concept 2"
    }
  ]
}`;

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(prompt);
  const rawResponse = result.response.text();
  
  // Clean the response to extract JSON
  const startIndex = rawResponse.indexOf('{');
  const endIndex = rawResponse.lastIndexOf('}');
  const jsonString = rawResponse.substring(startIndex, endIndex + 1);
  
  const comparison = JSON.parse(jsonString);
  
  // Update user credits
  await User.findByIdAndUpdate(req.user._id, { $inc: { 'usage.requests': 1 } });

  res.json({ comparison });
});

const generateExamPaper = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;
  const { totalMarks, duration, distribution, bloomsTaxonomy } = req.body;
  
  const subject = await Subject.findById(subjectId);
  const notes = await Note.find({ subject: subjectId });

  if (!subject || subject.user.toString() !== req.user._id.toString()) {
    res.status(404);
    throw new Error('Subject not found');
  }

  if (!subject.questionBank || subject.questionBank.length === 0) {
    res.status(400);
    throw new Error('Generate question bank first to create exam papers');
  }

  const allContent = notes.map(note => note.textContent).join('\n\n');
  
  const prompt = `Create a comprehensive exam paper for "${subject.name}" with the following specifications:

TOTAL MARKS: ${totalMarks}
DURATION: ${duration} hours

QUESTION DISTRIBUTION:
- ${distribution.mcq1} MCQ questions (1 mark each)
- ${distribution.mark3} questions (3 marks each)
- ${distribution.mark4} questions (4 marks each) 
- ${distribution.mark5} questions (5 marks each)

BLOOM'S TAXONOMY DISTRIBUTION:
- Remember: ${bloomsTaxonomy.remember}%
- Understand: ${bloomsTaxonomy.understand}%
- Apply: ${bloomsTaxonomy.apply}%
- Analyze: ${bloomsTaxonomy.analyze}%
- Evaluate: ${bloomsTaxonomy.evaluate}%
- Create: ${bloomsTaxonomy.create}%

CONTENT TO BASE QUESTIONS ON:
${allContent}

Generate a complete exam paper with this EXACT format:

<div class="header">
<h1>UNIVERSITY EXAMINATION</h1>
<h2>Subject: ${subject.name}</h2>
<p><strong>Time: ${duration} Hours</strong> &nbsp;&nbsp;&nbsp;&nbsp; <strong>Maximum Marks: ${totalMarks}</strong></p>
</div>

<div class="instructions">
<h3>INSTRUCTIONS:</h3>
<ul>
<li>Answer all questions</li>
<li>All questions are compulsory</li>
<li>Figures to the right indicate full marks</li>
<li>Use of calculator is allowed</li>
</ul>
</div>

<div class="section">
<h2>SECTION A - Multiple Choice Questions (${distribution.mcq1} × 1 = ${distribution.mcq1} Marks)</h2>
[Generate ${distribution.mcq1} MCQ questions with 4 options each, mark correct answer with *]
</div>

<div class="section">
<h2>SECTION B - Short Answer Questions (${distribution.mark3} × 3 = ${distribution.mark3 * 3} Marks)</h2>
[Generate ${distribution.mark3} questions worth 3 marks each]
</div>

<div class="section">
<h2>SECTION C - Medium Answer Questions (${distribution.mark4} × 4 = ${distribution.mark4 * 4} Marks)</h2>
[Generate ${distribution.mark4} questions worth 4 marks each]
</div>

<div class="section">
<h2>SECTION D - Long Answer Questions (${distribution.mark5} × 5 = ${distribution.mark5 * 5} Marks)</h2>
[Generate ${distribution.mark5} questions worth 5 marks each]
</div>

Ensure questions follow Bloom's taxonomy distribution and are based on the provided content.`;

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(prompt);
  const examPaper = result.response.text();
  
  // Update user credits
  await User.findByIdAndUpdate(req.user._id, { $inc: { 'usage.requests': 1 } });

  res.json({ examPaper });
});


export { 
  createSummary, 
  createFlashcards, 
  createQuiz, 
  createCategorizedQuestions, 
  createMoreCategorizedQuestions,
  suggestTitle,
  createMindMap,
  createStudyPlan,
  compareConcepts,
  generateExamPaper
};