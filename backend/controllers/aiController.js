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

const createSummary = asyncHandler(async (req, res) => {
    const note = await Note.findById(req.params.noteId);
    if (!note || note.user.toString() !== req.user._id.toString()) {
        res.status(404);
        throw new Error('Note not found or user not authorized');
    }
    
    const emitProgress = (message, progress) => {
        if (req.io && req.userSocketMap[req.user._id]) {
            req.io.to(req.userSocketMap[req.user._id]).emit('ai-progress', { message, progress });
        }
    };
    
    emitProgress('Analyzing content...', 30);
    const summaryMarkdown = await generateSummary(note.textContent);
    emitProgress('Formatting summary...', 80);
    note.summary = parseAndSanitize(summaryMarkdown); 
    await note.save();
    
    await User.findByIdAndUpdate(req.user._id, { $inc: { 'usage.requests': 1 } });
    
    emitProgress('Summary completed!', 100);
    res.json({ summary: note.summary });
});

const createFlashcards = asyncHandler(async (req, res) => {
    const note = await Note.findById(req.params.noteId);
    if (!note || note.user.toString() !== req.user._id.toString()) {
        res.status(404);
        throw new Error('Note not found or user not authorized');
    }
    
    const emitProgress = (message, progress) => {
        if (req.io && req.userSocketMap[req.user._id]) {
            req.io.to(req.userSocketMap[req.user._id]).emit('ai-progress', { message, progress });
        }
    };
    
    emitProgress('Creating flashcards...', 40);
    const { type } = req.body;
    
    // Initialize structure if needed
    if (!note.flashcards || Array.isArray(note.flashcards)) {
        note.flashcards = { 
            theory: [], 
            practical: [],
            allGenerated: { theory: [], practical: [] },
            displayedCount: { theory: 0, practical: 0 }
        };
    }
    if (!note.flashcards.allGenerated) {
        note.flashcards.allGenerated = { theory: [], practical: [] };
    }
    if (!note.flashcards.displayedCount) {
        note.flashcards.displayedCount = { theory: 0, practical: 0 };
    }
    
    console.log('=== FLASHCARD GENERATION DEBUG ===');
    console.log('Request type:', type);
    console.log('Current displayed counts:', note.flashcards.displayedCount);
    console.log('Total generated counts:', {
        theory: note.flashcards.allGenerated.theory?.length || 0,
        practical: note.flashcards.allGenerated.practical?.length || 0
    });
    
    // Check if we have unused flashcards in database first
    const showFromExisting = (type) => {
        const allCards = note.flashcards.allGenerated[type] || [];
        const currentDisplayed = note.flashcards.displayedCount[type] || 0;
        const remainingCards = allCards.slice(currentDisplayed);
        
        console.log(`${type} - Total: ${allCards.length}, Displayed: ${currentDisplayed}, Remaining: ${remainingCards.length}`);
        
        if (remainingCards.length > 0) {
            // Random batch size between 3-5 cards
            const batchSizes = [3, 4, 5];
            const randomBatchSize = batchSizes[Math.floor(Math.random() * batchSizes.length)];
            const actualBatchSize = Math.min(randomBatchSize, remainingCards.length);
            
            const cardsToShow = remainingCards.slice(0, actualBatchSize);
            const currentCards = note.flashcards[type] || [];
            note.flashcards[type] = [...currentCards, ...cardsToShow];
            note.flashcards.displayedCount[type] = currentDisplayed + cardsToShow.length;
            console.log(`Loaded ${cardsToShow.length} more ${type} flashcards from database (batch size: ${actualBatchSize}). Total displayed: ${note.flashcards.displayedCount[type]}/${allCards.length}`);
            return true;
        } else {
            console.log(`No more ${type} flashcards available in database`);
        }
        return false;
    };
    
    let usedExisting = false;
    
    if (type === 'theory') {
        usedExisting = showFromExisting('theory');
    } else if (type === 'practical') {
        usedExisting = showFromExisting('practical');
    } else if (!type) {
        // Initial load - show first 5 from each type if available
        const theoryUsed = showFromExisting('theory');
        const practicalUsed = showFromExisting('practical');
        usedExisting = theoryUsed || practicalUsed;
    }
    
    console.log('Used existing flashcards:', usedExisting);
    
    // Only generate new flashcards if we didn't use existing ones
    if (!usedExisting) {
        const existingQuestions = [];
        if (note.flashcards.allGenerated.theory) existingQuestions.push(...note.flashcards.allGenerated.theory.map(fc => fc.question));
        if (note.flashcards.allGenerated.practical) existingQuestions.push(...note.flashcards.allGenerated.practical.map(fc => fc.question));
        
        try {
            const newFlashcards = await generateFlashcards(note.textContent, 0, type, existingQuestions, 10);
            
            const isUniqueQuestion = (newQuestion, existingCards) => {
                const normalizeQuestion = (q) => q.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
                const newQ = normalizeQuestion(newQuestion);
                return !existingCards.some(card => {
                    const existingQ = normalizeQuestion(card.question);
                    return existingQ === newQ;
                });
            };
            
            if (type === 'theory' && newFlashcards?.theory) {
                const allExisting = note.flashcards.allGenerated.theory || [];
                const uniqueTheory = newFlashcards.theory.filter(card => 
                    isUniqueQuestion(card.question, allExisting)
                );
                note.flashcards.allGenerated.theory = [...allExisting, ...uniqueTheory];
                const cardsToShow = uniqueTheory.slice(0, 5);
                note.flashcards.theory = [...(note.flashcards.theory || []), ...cardsToShow];
                note.flashcards.displayedCount.theory = (note.flashcards.displayedCount.theory || 0) + cardsToShow.length;
            } else if (type === 'practical' && newFlashcards?.practical) {
                const allExisting = note.flashcards.allGenerated.practical || [];
                const uniquePractical = newFlashcards.practical.filter(card => 
                    isUniqueQuestion(card.question, allExisting)
                );
                note.flashcards.allGenerated.practical = [...allExisting, ...uniquePractical];
                const cardsToShow = uniquePractical.slice(0, 5);
                note.flashcards.practical = [...(note.flashcards.practical || []), ...cardsToShow];
                note.flashcards.displayedCount.practical = (note.flashcards.displayedCount.practical || 0) + cardsToShow.length;
            } else if (!type && newFlashcards) {
                // Initial generation
                const allExistingTheory = note.flashcards.allGenerated.theory || [];
                const allExistingPractical = note.flashcards.allGenerated.practical || [];
                
                const uniqueTheory = (newFlashcards?.theory || []).filter(card => 
                    isUniqueQuestion(card.question, allExistingTheory)
                );
                const uniquePractical = (newFlashcards?.practical || []).filter(card => 
                    isUniqueQuestion(card.question, allExistingPractical)
                );
                
                note.flashcards.allGenerated.theory = [...allExistingTheory, ...uniqueTheory];
                note.flashcards.allGenerated.practical = [...allExistingPractical, ...uniquePractical];
                
                const theoryToShow = uniqueTheory.slice(0, 5);
                const practicalToShow = uniquePractical.slice(0, 5);
                
                note.flashcards.theory = theoryToShow;
                note.flashcards.practical = practicalToShow;
                note.flashcards.displayedCount.theory = theoryToShow.length;
                note.flashcards.displayedCount.practical = practicalToShow.length;
                console.log('Initial generation completed - Theory:', theoryToShow.length, 'Practical:', practicalToShow.length);
            }
            
            // Only count credit for AI generation, not loading from DB
            await User.findByIdAndUpdate(req.user._id, { $inc: { 'usage.requests': 1 } });
        } catch (error) {
            console.error('AI generation failed:', error);
            throw new Error('Failed to generate flashcards');
        }
    }
    
    // Force save with markModified
    note.markModified('flashcards');
    await note.save();
    const savedNote = await Note.findById(req.params.noteId);
    
    console.log('=== SAVE VERIFICATION ===');
    console.log('Saved flashcard counts:', {
        theory: savedNote.flashcards?.theory?.length || 0,
        practical: savedNote.flashcards?.practical?.length || 0,
        theoryDisplayed: savedNote.flashcards?.displayedCount?.theory || 0,
        practicalDisplayed: savedNote.flashcards?.displayedCount?.practical || 0
    });
    console.log('=== END SAVE VERIFICATION ===');
    
    // Credit already counted in AI generation block if new content was generated
    
    emitProgress('Flashcards ready!', 100);
    res.json({ flashcards: savedNote.flashcards });
});

const createQuiz = asyncHandler(async (req, res) => {
    const note = await Note.findById(req.params.noteId);
    if (!note || note.user.toString() !== req.user._id.toString()) {
        res.status(404);
        throw new Error('Note not found or user not authorized');
    }
    
    const { quizName, questionCount } = req.body;
    
    const emitProgress = (message, progress) => {
        if (req.io && req.userSocketMap[req.user._id]) {
            req.io.to(req.userSocketMap[req.user._id]).emit('ai-progress', { message, progress });
        }
    };
    
    emitProgress('Generating quiz questions...', 40);
    
    const quizData = await generateQuiz(note.textContent, questionCount || 10);
    
    emitProgress('Creating quiz...', 80);
    
    const quiz = new Quiz({
        title: quizName,
        note: note._id,
        createdBy: req.user._id,
        questions: quizData.mcqs || [],
        isVisible: true
    });
    
    await quiz.save();
    await User.findByIdAndUpdate(req.user._id, { $inc: { 'usage.requests': 1 } });
    
    emitProgress('Quiz ready!', 100);
    res.json({ quiz, message: 'Quiz created successfully!' });
});

const createCategorizedQuestions = asyncHandler(async (req, res) => {
    const note = await Note.findById(req.params.noteId);
    if (!note || note.user.toString() !== req.user._id.toString()) {
        res.status(404);
        throw new Error('Note not found or user not authorized');
    }
    
    const emitProgress = (message, progress) => {
        if (req.io && req.userSocketMap[req.user._id]) {
            req.io.to(req.userSocketMap[req.user._id]).emit('ai-progress', { message, progress });
        }
    };
    
    const { markers } = req.body;
    
    // Initialize progressive loading structure
    if (!note.categorizedQuestions) {
        note.categorizedQuestions = {};
    }
    if (!note.categorizedQuestions.allGenerated) {
        note.categorizedQuestions.allGenerated = {};
    }
    if (!note.categorizedQuestions.displayedCount) {
        note.categorizedQuestions.displayedCount = {};
    }
    
    const markerKeyMap = {
        '1': 'oneMarker',
        '3': 'threeMarker', 
        '4': 'fourMarker',
        '5': 'fiveMarker'
    };
    
    // Check if we have unused questions in database first
    const showFromExisting = (markerKey, type = null) => {
        if (type) {
            // Handle theory/practical structure
            const allQuestions = note.categorizedQuestions.allGenerated?.[type]?.[markerKey] || [];
            const currentDisplayed = note.categorizedQuestions.displayedCount?.[type]?.[markerKey] || 0;
            const remainingQuestions = allQuestions.slice(currentDisplayed);
            
            if (remainingQuestions.length > 0) {
                const batchSize = Math.min(3, remainingQuestions.length);
                const questionsToShow = remainingQuestions.slice(0, batchSize);
                
                if (!note.categorizedQuestions[type]) note.categorizedQuestions[type] = {};
                const currentQuestions = note.categorizedQuestions[type][markerKey] || [];
                note.categorizedQuestions[type][markerKey] = [...currentQuestions, ...questionsToShow];
                
                if (!note.categorizedQuestions.displayedCount[type]) note.categorizedQuestions.displayedCount[type] = {};
                note.categorizedQuestions.displayedCount[type][markerKey] = currentDisplayed + questionsToShow.length;
                return true;
            }
        } else {
            // Handle direct marker structure
            const allQuestions = note.categorizedQuestions.allGenerated[markerKey] || [];
            const currentDisplayed = note.categorizedQuestions.displayedCount[markerKey] || 0;
            const remainingQuestions = allQuestions.slice(currentDisplayed);
            
            if (remainingQuestions.length > 0) {
                const batchSize = Math.min(3, remainingQuestions.length);
                const questionsToShow = remainingQuestions.slice(0, batchSize);
                const currentQuestions = note.categorizedQuestions[markerKey] || [];
                note.categorizedQuestions[markerKey] = [...currentQuestions, ...questionsToShow];
                note.categorizedQuestions.displayedCount[markerKey] = currentDisplayed + questionsToShow.length;
                return true;
            }
        }
        return false;
    };
    
    let usedExisting = false;
    
    if (markers) {
        const markerKey = markerKeyMap[markers];
        if (markerKey) {
            usedExisting = showFromExisting(markerKey);
        }
    } else {
        // Initial load - check for theory/practical structure first
        if (note.categorizedQuestions.allGenerated?.theory || note.categorizedQuestions.allGenerated?.practical) {
            ['theory', 'practical'].forEach(type => {
                Object.values(markerKeyMap).forEach(key => {
                    if (showFromExisting(key, type)) usedExisting = true;
                });
            });
        } else {
            // Fallback to direct marker structure
            Object.values(markerKeyMap).forEach(key => {
                if (showFromExisting(key)) usedExisting = true;
            });
        }
    }
    
    // Only generate new questions if we didn't use existing ones
    if (!usedExisting) {
        emitProgress('Generating practice questions...', 40);
        
        const existingQuestions = [];
        if (note.categorizedQuestions.allGenerated) {
            Object.values(note.categorizedQuestions.allGenerated).forEach(categoryQuestions => {
                if (Array.isArray(categoryQuestions)) {
                    existingQuestions.push(...categoryQuestions.map(q => q.question));
                }
            });
        }
        
        let questions;
        try {
            questions = await generateMarkBasedQuestions(note.textContent, markers, existingQuestions);
            console.log('Generated questions structure:', JSON.stringify(questions, null, 2));
        } catch (error) {
            console.error('Question generation failed:', error);
            throw new Error('Failed to generate questions: ' + error.message);
        }
    
        if (markers) {
            const markerKey = markerKeyMap[markers];
            if (markerKey) {
                // Handle theory/practical structure
                if (questions.theory || questions.practical) {
                    ['theory', 'practical'].forEach(type => {
                        if (questions[type] && questions[type][markerKey]) {
                            if (!note.categorizedQuestions[type]) note.categorizedQuestions[type] = {};
                            if (!note.categorizedQuestions.allGenerated[type]) note.categorizedQuestions.allGenerated[type] = {};
                            if (!note.categorizedQuestions.displayedCount[type]) note.categorizedQuestions.displayedCount[type] = {};
                            
                            const allExisting = note.categorizedQuestions.allGenerated[type][markerKey] || [];
                            note.categorizedQuestions.allGenerated[type][markerKey] = [...allExisting, ...questions[type][markerKey]];
                            const questionsToShow = questions[type][markerKey].slice(0, 3);
                            note.categorizedQuestions[type][markerKey] = [...(note.categorizedQuestions[type][markerKey] || []), ...questionsToShow];
                            note.categorizedQuestions.displayedCount[type][markerKey] = (note.categorizedQuestions.displayedCount[type][markerKey] || 0) + questionsToShow.length;
                        }
                    });
                } else if (Array.isArray(questions)) {
                    // Handle direct array
                    const allExisting = note.categorizedQuestions.allGenerated[markerKey] || [];
                    note.categorizedQuestions.allGenerated[markerKey] = [...allExisting, ...questions];
                    const questionsToShow = questions.slice(0, 3);
                    note.categorizedQuestions[markerKey] = [...(note.categorizedQuestions[markerKey] || []), ...questionsToShow];
                    note.categorizedQuestions.displayedCount[markerKey] = (note.categorizedQuestions.displayedCount[markerKey] || 0) + questionsToShow.length;
                } else if (questions[markerKey]) {
                    // Handle direct marker structure
                    const allExisting = note.categorizedQuestions.allGenerated[markerKey] || [];
                    note.categorizedQuestions.allGenerated[markerKey] = [...allExisting, ...questions[markerKey]];
                    const questionsToShow = questions[markerKey].slice(0, 3);
                    note.categorizedQuestions[markerKey] = [...(note.categorizedQuestions[markerKey] || []), ...questionsToShow];
                    note.categorizedQuestions.displayedCount[markerKey] = (note.categorizedQuestions.displayedCount[markerKey] || 0) + questionsToShow.length;
                }
            }
        } else {
            // Initial generation - process all categories
            if (questions && typeof questions === 'object') {
                // Handle theory/practical structure
                if (questions.theory || questions.practical) {
                    ['theory', 'practical'].forEach(type => {
                        if (questions[type]) {
                            if (!note.categorizedQuestions[type]) {
                                note.categorizedQuestions[type] = {};
                            }
                            if (!note.categorizedQuestions.allGenerated[type]) {
                                note.categorizedQuestions.allGenerated[type] = {};
                            }
                            if (!note.categorizedQuestions.displayedCount[type]) {
                                note.categorizedQuestions.displayedCount[type] = {};
                            }
                            
                            Object.keys(markerKeyMap).forEach(key => {
                                const markerKey = markerKeyMap[key];
                                if (questions[type][markerKey]) {
                                    const allExisting = note.categorizedQuestions.allGenerated[type][markerKey] || [];
                                    note.categorizedQuestions.allGenerated[type][markerKey] = [...allExisting, ...questions[type][markerKey]];
                                    const questionsToShow = questions[type][markerKey].slice(0, 3);
                                    note.categorizedQuestions[type][markerKey] = questionsToShow;
                                    note.categorizedQuestions.displayedCount[type][markerKey] = questionsToShow.length;
                                }
                            });
                        }
                    });
                } else {
                    // Handle direct marker structure
                    Object.keys(markerKeyMap).forEach(key => {
                        const markerKey = markerKeyMap[key];
                        if (questions[markerKey]) {
                            const allExisting = note.categorizedQuestions.allGenerated[markerKey] || [];
                            note.categorizedQuestions.allGenerated[markerKey] = [...allExisting, ...questions[markerKey]];
                            const questionsToShow = questions[markerKey].slice(0, 3);
                            note.categorizedQuestions[markerKey] = questionsToShow;
                            note.categorizedQuestions.displayedCount[markerKey] = questionsToShow.length;
                        }
                    });
                }
            }
        }
        
        // Only count credit for AI generation, not loading from DB
        await User.findByIdAndUpdate(req.user._id, { $inc: { 'usage.requests': 1 } });
    }
    
    note.markModified('categorizedQuestions');
    await note.save();
    
    // Credit already counted in AI generation block if new content was generated
    
    emitProgress('Practice questions ready!', 100);
    res.json({ 
        practiceQuestions: note.categorizedQuestions,
        categorizedQuestions: note.categorizedQuestions 
    });
});

const createMoreCategorizedQuestions = asyncHandler(async (req, res) => {
    // This endpoint now uses the same logic as createCategorizedQuestions
    // Just call the main function with the markers parameter
    return createCategorizedQuestions(req, res);
});

const suggestTitle = asyncHandler(async (req, res) => {
    res.status(501).json({ message: 'Title suggestion not implemented yet' });
});

const createMindMap = asyncHandler(async (req, res) => {
    const note = await Note.findById(req.params.noteId);
    if (!note || note.user.toString() !== req.user._id.toString()) {
        res.status(404);
        throw new Error('Note not found or user not authorized');
    }
    
    const emitProgress = (message, progress) => {
        if (req.io && req.userSocketMap[req.user._id]) {
            req.io.to(req.userSocketMap[req.user._id]).emit('ai-progress', { message, progress });
        }
    };
    
    emitProgress('Creating mind map...', 40);
    const mindMapData = await generateMindMap(note.textContent);
    emitProgress('Formatting mind map...', 80);
    note.mindMap = mindMapData;
    await note.save();
    
    await User.findByIdAndUpdate(req.user._id, { $inc: { 'usage.requests': 1 } });
    
    emitProgress('Mind map ready!', 100);
    res.json({ mindMap: note.mindMap });
});

const createStudyPlan = asyncHandler(async (req, res) => {
    res.status(501).json({ message: 'Study plan creation not implemented yet' });
});

const compareConcepts = asyncHandler(async (req, res) => {
    res.status(501).json({ message: 'Concept comparison not implemented yet' });
});

const generateExamPaper = asyncHandler(async (req, res) => {
    res.status(501).json({ message: 'Exam paper generation not implemented yet' });
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