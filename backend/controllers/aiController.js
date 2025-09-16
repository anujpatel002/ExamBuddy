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
  generateMindMap,
  generateAudioOverview as generateAudioScript
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
            // Show more cards - between 8-15
            const batchSizes = [8, 10, 12, 15];
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
    
    // Only check existing cards for initial load, always generate new for specific type requests
    if (!type) {
        const theoryUsed = showFromExisting('theory');
        const practicalUsed = showFromExisting('practical');
        usedExisting = theoryUsed || practicalUsed;
    }
    
    console.log('Used existing flashcards:', usedExisting);
    console.log('Forcing new generation for type:', type);
    
    // Always generate new flashcards when type is specified (user clicked Generate More)
    if (!usedExisting || type) {
        const existingQuestions = [];
        if (note.flashcards.allGenerated.theory) existingQuestions.push(...note.flashcards.allGenerated.theory.map(fc => fc.question));
        if (note.flashcards.allGenerated.practical) existingQuestions.push(...note.flashcards.allGenerated.practical.map(fc => fc.question));
        
        try {
            const newFlashcards = await generateFlashcards(note.textContent, 0, type, existingQuestions, 10);
            console.log('Generated flashcards structure:', { 
                hasTheory: !!newFlashcards?.theory, 
                theoryLength: newFlashcards?.theory?.length || 0,
                hasPractical: !!newFlashcards?.practical,
                practicalLength: newFlashcards?.practical?.length || 0
            });
            
            const isUniqueQuestion = (newQuestion, existingCards) => {
                const normalizeQuestion = (q) => q.toLowerCase().replace(/[^\w\s\u0A80-\u0AFF\u0900-\u097F]/g, '').trim();
                const newQ = normalizeQuestion(newQuestion);
                const isUnique = !existingCards.some(card => {
                    const existingQ = normalizeQuestion(card.question);
                    const similarity = existingQ === newQ || (existingQ.length > 10 && newQ.length > 10 && existingQ.includes(newQ.substring(0, 15)));
                    return similarity;
                });
                console.log(`Question uniqueness check: "${newQuestion.substring(0, 50)}..." - Unique: ${isUnique}`);
                return isUnique;
            };
            
            if (type === 'theory' && newFlashcards?.theory) {
                const allExisting = note.flashcards.allGenerated.theory || [];
                const uniqueTheory = newFlashcards.theory.filter(card => 
                    isUniqueQuestion(card.question, allExisting)
                );
                if (uniqueTheory.length > 0) {
                    note.flashcards.allGenerated.theory = [...allExisting, ...uniqueTheory];
                    note.flashcards.theory = [...(note.flashcards.theory || []), ...uniqueTheory];
                    note.flashcards.displayedCount.theory = (note.flashcards.displayedCount.theory || 0) + uniqueTheory.length;
                    console.log(`Added ${uniqueTheory.length} new theory flashcards, showing ${uniqueTheory.length}`);
                }
            } else if (type === 'practical' && newFlashcards?.practical) {
                const allExisting = note.flashcards.allGenerated.practical || [];
                const uniquePractical = newFlashcards.practical.filter(card => 
                    isUniqueQuestion(card.question, allExisting)
                );
                if (uniquePractical.length > 0) {
                    note.flashcards.allGenerated.practical = [...allExisting, ...uniquePractical];
                    note.flashcards.practical = [...(note.flashcards.practical || []), ...uniquePractical];
                    note.flashcards.displayedCount.practical = (note.flashcards.displayedCount.practical || 0) + uniquePractical.length;
                    console.log(`Added ${uniquePractical.length} new practical flashcards, showing ${uniquePractical.length}`);
                }
            } else if (!type && newFlashcards) {
                // Handle both code and non-code content
                if (newFlashcards.theory || newFlashcards.practical) {
                    // Code content with theory/practical structure
                    const allExistingTheory = note.flashcards.allGenerated.theory || [];
                    const allExistingPractical = note.flashcards.allGenerated.practical || [];
                    
                    const uniqueTheory = (newFlashcards?.theory || []).filter(card => 
                        isUniqueQuestion(card.question, allExistingTheory)
                    );
                    const uniquePractical = (newFlashcards?.practical || []).filter(card => 
                        isUniqueQuestion(card.question, allExistingPractical)
                    );
                    
                    if (uniqueTheory.length > 0) {
                        note.flashcards.allGenerated.theory = [...allExistingTheory, ...uniqueTheory];
                        note.flashcards.theory = [...(note.flashcards.theory || []), ...uniqueTheory];
                        note.flashcards.displayedCount.theory = (note.flashcards.displayedCount.theory || 0) + uniqueTheory.length;
                    }
                    if (uniquePractical.length > 0) {
                        note.flashcards.allGenerated.practical = [...allExistingPractical, ...uniquePractical];
                        note.flashcards.practical = [...(note.flashcards.practical || []), ...uniquePractical];
                        note.flashcards.displayedCount.practical = (note.flashcards.displayedCount.practical || 0) + uniquePractical.length;
                    }
                    console.log('Code content generation - Theory:', uniqueTheory.length, 'Practical:', uniquePractical.length);
                } else if (Array.isArray(newFlashcards.theory)) {
                    // Non-code content - flashcards returned as theory array
                    const allExistingTheory = note.flashcards.allGenerated.theory || [];
                    const uniqueTheory = newFlashcards.theory.filter(card => 
                        isUniqueQuestion(card.question, allExistingTheory)
                    );
                    
                    if (uniqueTheory.length > 0) {
                        note.flashcards.allGenerated.theory = [...allExistingTheory, ...uniqueTheory];
                        note.flashcards.theory = [...(note.flashcards.theory || []), ...uniqueTheory];
                        note.flashcards.displayedCount.theory = (note.flashcards.displayedCount.theory || 0) + uniqueTheory.length;
                        console.log(`Non-code content: Added ${uniqueTheory.length} flashcards, showing ${uniqueTheory.length}`);
                    }
                }
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
    console.log('=== RESPONSE TO FRONTEND ===');
    console.log('Sending flashcards:', JSON.stringify(savedNote.flashcards, null, 2));
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
                console.log(`Processing marker ${markers} (${markerKey}) with questions:`, questions);
                
                // Handle theory/practical structure
                if (questions.theory || questions.practical) {
                    ['theory', 'practical'].forEach(type => {
                        if (questions[type] && questions[type][markerKey]) {
                            if (!note.categorizedQuestions[type]) note.categorizedQuestions[type] = {};
                            if (!note.categorizedQuestions.allGenerated[type]) note.categorizedQuestions.allGenerated[type] = {};
                            if (!note.categorizedQuestions.displayedCount[type]) note.categorizedQuestions.displayedCount[type] = {};
                            
                            const allExisting = note.categorizedQuestions.allGenerated[type][markerKey] || [];
                            note.categorizedQuestions.allGenerated[type][markerKey] = [...allExisting, ...questions[type][markerKey]];
                            const currentQuestions = note.categorizedQuestions[type][markerKey] || [];
                            note.categorizedQuestions[type][markerKey] = [...currentQuestions, ...questions[type][markerKey]];
                            note.categorizedQuestions.displayedCount[type][markerKey] = (note.categorizedQuestions.displayedCount[type][markerKey] || 0) + questions[type][markerKey].length;
                            console.log(`Added ${questions[type][markerKey].length} new ${type} ${markerKey} questions. Total displayed: ${note.categorizedQuestions.displayedCount[type][markerKey]}`);
                        }
                    });
                } else if (Array.isArray(questions)) {
                    // Handle direct array - append to existing questions
                    console.log(`Processing direct array of ${questions.length} questions for ${markerKey}`);
                    
                    // Check if we have theory/practical structure in existing data
                    if (note.categorizedQuestions.theory || note.categorizedQuestions.practical) {
                        // Add to theory by default for marker-specific generation
                        if (!note.categorizedQuestions.theory) note.categorizedQuestions.theory = {};
                        if (!note.categorizedQuestions.allGenerated.theory) note.categorizedQuestions.allGenerated.theory = {};
                        if (!note.categorizedQuestions.displayedCount.theory) note.categorizedQuestions.displayedCount.theory = {};
                        
                        const allExisting = note.categorizedQuestions.allGenerated.theory[markerKey] || [];
                        note.categorizedQuestions.allGenerated.theory[markerKey] = [...allExisting, ...questions];
                        const currentQuestions = note.categorizedQuestions.theory[markerKey] || [];
                        note.categorizedQuestions.theory[markerKey] = [...currentQuestions, ...questions];
                        note.categorizedQuestions.displayedCount.theory[markerKey] = (note.categorizedQuestions.displayedCount.theory[markerKey] || 0) + questions.length;
                        console.log(`Added ${questions.length} new theory ${markerKey} questions. Total displayed: ${note.categorizedQuestions.displayedCount.theory[markerKey]}`);
                    } else {
                        // Use direct structure
                        const allExisting = note.categorizedQuestions.allGenerated[markerKey] || [];
                        note.categorizedQuestions.allGenerated[markerKey] = [...allExisting, ...questions];
                        const currentQuestions = note.categorizedQuestions[markerKey] || [];
                        note.categorizedQuestions[markerKey] = [...currentQuestions, ...questions];
                        note.categorizedQuestions.displayedCount[markerKey] = (note.categorizedQuestions.displayedCount[markerKey] || 0) + questions.length;
                        console.log(`Added ${questions.length} new ${markerKey} questions. Total displayed: ${note.categorizedQuestions.displayedCount[markerKey]}`);
                    }
                } else if (questions[markerKey]) {
                    // Handle direct marker structure - append to existing questions
                    const allExisting = note.categorizedQuestions.allGenerated[markerKey] || [];
                    note.categorizedQuestions.allGenerated[markerKey] = [...allExisting, ...questions[markerKey]];
                    const currentQuestions = note.categorizedQuestions[markerKey] || [];
                    note.categorizedQuestions[markerKey] = [...currentQuestions, ...questions[markerKey]];
                    note.categorizedQuestions.displayedCount[markerKey] = (note.categorizedQuestions.displayedCount[markerKey] || 0) + questions[markerKey].length;
                    console.log(`Added ${questions[markerKey].length} new ${markerKey} questions. Total displayed: ${note.categorizedQuestions.displayedCount[markerKey]}`);
                } else {
                    console.log('No matching structure found for questions. Type:', typeof questions, 'Keys:', questions ? Object.keys(questions) : 'null');
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
    // Handle both subject-based and note-based exam generation
    let content, title;
    
    if (req.params.subjectId) {
        // Subject-based generation
        const subject = await Subject.findById(req.params.subjectId);
        if (!subject || subject.user.toString() !== req.user._id.toString()) {
            res.status(404);
            throw new Error('Subject not found or user not authorized');
        }
        
        const notes = await Note.find({ subject: req.params.subjectId });
        if (notes.length === 0) {
            res.status(400);
            throw new Error('No notes found in this subject to generate exam paper from.');
        }
        
        content = notes.map(note => `${note.title}:\n${note.textContent}`).join('\n\n---\n\n');
        title = subject.name;
    } else if (req.params.noteId) {
        // Note-based generation
        const note = await Note.findById(req.params.noteId);
        if (!note || note.user.toString() !== req.user._id.toString()) {
            res.status(404);
            throw new Error('Note not found or user not authorized');
        }
        
        content = note.textContent;
        title = note.title;
    } else {
        res.status(400);
        throw new Error('Either subjectId or noteId must be provided');
    }
    
    const { totalMarks, duration, distribution, bloomsTaxonomy } = req.body;
    
    const emitProgress = (message, progress) => {
        if (req.io && req.userSocketMap[req.user._id]) {
            req.io.to(req.userSocketMap[req.user._id]).emit('ai-progress', { message, progress });
        }
    };
    
    emitProgress('Analyzing content...', 20);
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    emitProgress('Generating exam questions...', 60);
    
    const prompt = `Generate exam questions based on the following content:

${content}

Generate questions in this JSON format:
{
  "questions": {
    "oneMarker": [{"question": "...", "answer": "..."}],
    "threeMarker": [{"question": "...", "answer": "..."}],
    "fourMarker": [{"question": "...", "answer": "..."}],
    "fiveMarker": [{"question": "...", "answer": "..."}]
  }
}

Question Distribution:
- ${distribution?.oneMarker || 10} x 1 Mark Questions
- ${distribution?.threeMarker || 6} x 3 Mark Questions  
- ${distribution?.fourMarker || 4} x 4 Mark Questions
- ${distribution?.fiveMarker || 4} x 5 Mark Questions

Ensure questions are:
1. Directly based on the provided content
2. Appropriate for their mark allocation
3. Clear and well-formatted
4. Include detailed answers

Return only valid JSON.`;
    
    console.log('=== EXAM GENERATION LOG ===');
    console.log('Content length:', content.length);
    console.log('Title:', title);
    console.log('Distribution:', distribution);
    
    const result = await model.generateContent(prompt);
    let responseText = result.response.text();
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    let questions = {};
    
    if (jsonMatch) {
        try {
            const parsedData = JSON.parse(jsonMatch[0]);
            questions = parsedData.questions || parsedData;
            
            console.log('Generated questions:');
            Object.keys(questions).forEach(key => {
                console.log(`${key}: ${questions[key]?.length || 0} questions`);
                questions[key]?.forEach((q, i) => {
                    console.log(`  ${i+1}. ${q.question?.substring(0, 100)}...`);
                });
            });
        } catch (error) {
            console.error('JSON parsing failed:', error);
            throw new Error('Failed to parse generated questions');
        }
    } else {
        console.error('No JSON found in response:', responseText.substring(0, 500));
        throw new Error('Invalid response format from AI');
    }
    
    emitProgress('Questions generated!', 90);
    
    await User.findByIdAndUpdate(req.user._id, { $inc: { 'usage.requests': 1 } });
    
    emitProgress('Exam ready!', 100);
    console.log('=== END EXAM GENERATION LOG ===');
    
    res.json({ questions, title });
});

const createSubjectQuiz = asyncHandler(async (req, res) => {
    const subject = await Subject.findById(req.params.subjectId);
    if (!subject || subject.user.toString() !== req.user._id.toString()) {
        res.status(404);
        throw new Error('Subject not found or user not authorized');
    }
    
    const notes = await Note.find({ subject: req.params.subjectId });
    if (notes.length === 0) {
        res.status(400);
        throw new Error('No notes found in this subject to generate quiz from.');
    }
    
    const { quizName, questionCount } = req.body;
    
    const emitProgress = (message, progress) => {
        if (req.io && req.userSocketMap[req.user._id]) {
            req.io.to(req.userSocketMap[req.user._id]).emit('ai-progress', { message, progress });
        }
    };
    
    emitProgress('Analyzing all notes in subject...', 20);
    
    // Combine all note content
    const combinedContent = notes.map(note => `${note.title}:\n${note.textContent}`).join('\n\n---\n\n');
    
    emitProgress('Generating quiz questions...', 60);
    
    const quizData = await generateQuiz(combinedContent, questionCount || 10);
    
    emitProgress('Creating quiz...', 90);
    
    const quiz = new Quiz({
        title: quizName || `${subject.name} Quiz`,
        subject: subject._id,
        createdBy: req.user._id,
        questions: quizData.mcqs || [],
        isVisible: true
    });
    
    await quiz.save();
    await User.findByIdAndUpdate(req.user._id, { $inc: { 'usage.requests': 1 } });
    
    emitProgress('Subject quiz ready!', 100);
    res.json({ quiz, message: 'Subject quiz created successfully!' });
});

// NotebookLM functionality
const analyzeDocuments = asyncHandler(async (req, res) => {
    console.log('analyzeDocuments called with:', { 
        sourcesCount: req.body.sources?.length, 
        query: req.body.query 
    });
    
    const { sources, query } = req.body;
    
    if (!sources || sources.length === 0) {
        console.log('No sources provided');
        return res.status(400).json({ message: 'No sources provided' });
    }
    
    if (!process.env.GEMINI_API_KEY) {
        console.log('GEMINI_API_KEY not found');
        return res.status(500).json({ message: 'AI service not configured' });
    }
    
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        // Process sources and extract content from files if needed
        const processedSources = [];
        for (const source of sources) {
            let content = source.content;
            
            // If source has a file path, try to extract content
            if (source.file && !content) {
                try {
                    content = await extractTextFromFile(source.file);
                    console.log(`Extracted ${content.length} characters from ${source.name}`);
                } catch (error) {
                    console.error(`Failed to extract content from ${source.name}:`, error);
                    content = `Unable to process file: ${source.name}. Please ensure the file is accessible and in a supported format.`;
                }
            }
            
            processedSources.push({
                name: source.name,
                content: content || 'No content available'
            });
        }
        
        const combinedContent = processedSources.map(source => 
            `Source: ${source.name}\n${source.content}`
        ).join('\n\n---\n\n');
        
        console.log('Combined content length:', combinedContent.length);
        
        // If content is too large, process with chunking strategy
        if (combinedContent.length > 800000) {
            console.log('Content too large, using chunking strategy');
            
            // Create summary of each source first
            const sourceSummaries = [];
            for (const source of processedSources) {
                if (source.content.length > 100000) {
                    // Summarize large sources
                    const summaryPrompt = `Summarize the key points from this document:\n\n${source.content.substring(0, 50000)}`;
                    const summaryResult = await model.generateContent(summaryPrompt);
                    sourceSummaries.push(`Source: ${source.name}\nSummary: ${summaryResult.response.text()}`);
                } else {
                    sourceSummaries.push(`Source: ${source.name}\n${source.content}`);
                }
            }
            
            const summarizedContent = sourceSummaries.join('\n\n---\n\n');
            const prompt = `Based on the following documents and summaries, answer this question: "${query}"\n\nDocuments:\n${summarizedContent}\n\nProvide a comprehensive answer with specific citations to the source documents. Format your response with:
- Clear headings using ## for main sections
- Bullet points using - for lists
- Numbered lists using 1. 2. 3. for steps
- **Bold text** for important points
- Proper line spacing with double line breaks between sections
- Clear references to source documents
- Well-structured paragraphs with good spacing`;
            
            const result = await model.generateContent(prompt);
            const response = result.response.text();
            
            await User.findByIdAndUpdate(req.user._id, { $inc: { 'usage.requests': 1 } });
            return res.json({ response, sources: processedSources.map(s => ({ name: s.name, id: s.id })) });
        }
        
        const prompt = `Based on the following documents, answer this question: "${query}"\n\nDocuments:\n${combinedContent}\n\nProvide a comprehensive answer with specific citations to the source documents. Format your response with:
- Clear headings using ## for main sections
- Bullet points using - for lists
- Numbered lists using 1. 2. 3. for steps
- **Bold text** for important points
- Proper line spacing with double line breaks between sections
- Clear references to source documents
- Well-structured paragraphs with good spacing`;
        
        console.log('Sending request to Gemini...');
        const result = await model.generateContent(prompt);
        const response = result.response.text();
        
        console.log('Gemini response received, length:', response.length);
        
        await User.findByIdAndUpdate(req.user._id, { $inc: { 'usage.requests': 1 } });
        
        res.json({ response, sources: processedSources.map(s => ({ name: s.name, id: s.id })) });
    } catch (error) {
        console.error('Error in analyzeDocuments:', error);
        res.status(500).json({ message: 'Failed to analyze documents: ' + error.message });
    }
});

const generateStudyMaterial = asyncHandler(async (req, res) => {
    console.log('generateStudyMaterial called with:', { type: req.body.type, sourcesCount: req.body.sources?.length });
    
    const { sources, type } = req.body;
    
    if (!sources || sources.length === 0) {
        console.log('No sources provided');
        return res.status(400).json({ message: 'No sources provided' });
    }
    
    if (!process.env.GEMINI_API_KEY) {
        console.log('GEMINI_API_KEY not found');
        return res.status(500).json({ message: 'AI service not configured' });
    }
    
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Process sources and extract content from files if needed
    const processedSources = [];
    for (const source of sources) {
        let content = source.content;
        
        // If source has a file path, try to extract content
        if (source.file && !content) {
            try {
                content = await extractTextFromFile(source.file);
                console.log(`Extracted ${content.length} characters from ${source.name}`);
            } catch (error) {
                console.error(`Failed to extract content from ${source.name}:`, error);
                content = `Unable to process file: ${source.name}. Please ensure the file is accessible and in a supported format.`;
            }
        }
        
        processedSources.push({
            name: source.name,
            content: content || 'No content available'
        });
    }
    
    const maxTokensPerSource = Math.floor(800000 / processedSources.length);
    const truncatedSources = processedSources.map(source => ({
        ...source,
        content: source.content.length > maxTokensPerSource 
            ? source.content.substring(0, maxTokensPerSource) + '\n\n[Content truncated...]'
            : source.content
    }));
    
    const combinedContent = truncatedSources.map(source => 
        `Source: ${source.name}\n${source.content}`
    ).join('\n\n---\n\n');
    
    let prompt = '';
    
    switch (type) {
        case 'summary':
            prompt = `Create a comprehensive summary of the following documents:\n\n${combinedContent}\n\nProvide a well-structured summary that captures the key points from all sources.`;
            break;
        case 'outline':
            prompt = `Create a detailed outline based on the following documents:\n\n${combinedContent}\n\nOrganize the content into a hierarchical outline with main topics and subtopics.`;
            break;
        case 'timeline':
            prompt = `Create a timeline based on the following documents:\n\n${combinedContent}\n\nExtract chronological events and organize them in a timeline format.`;
            break;
        case 'flashcards':
            prompt = `Create flashcards based on the following documents:\n\n${combinedContent}\n\nGenerate question-answer pairs in JSON format: {"flashcards": [{"question": "...", "answer": "..."}]}`;
            break;
        case 'quiz':
            prompt = `Create a quiz based on the following documents:\n\n${combinedContent}\n\nGenerate multiple choice questions in JSON format: {"questions": [{"question": "...", "options": ["A", "B", "C", "D"], "correct": 0}]}`;
            break;
        case 'mindmap':
            prompt = `Create a detailed mind map structure based on the following documents:\n\n${combinedContent}\n\nFormat as a hierarchical text structure with:
- Main topic at center
- Primary branches with ##
- Secondary branches with ###
- Key points with bullet points
- Use indentation to show relationships
- Include all major concepts and connections`;
            break;
        case 'video':
            prompt = `Create an educational video script based on the following documents:\n\n${combinedContent}\n\nFormat as a complete video script with:
- [INTRO] section with hook and overview
- [MAIN CONTENT] sections with clear explanations
- [VISUAL CUES] suggestions for graphics/animations
- [TRANSITIONS] between topics
- [CONCLUSION] with key takeaways
- Estimated timing for each section
- Engaging and educational tone`;
            break;
        default:
            return res.status(400).json({ message: 'Invalid study material type' });
    }
    
        console.log('Sending request to Gemini for type:', type);
        const result = await model.generateContent(prompt);
        let content = result.response.text();
        
        console.log('Gemini response received, length:', content.length);
        
        // Try to parse JSON for flashcards and quiz
        if (type === 'flashcards' || type === 'quiz') {
            try {
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    content = JSON.parse(jsonMatch[0]);
                }
            } catch (e) {
                console.log('JSON parsing failed, keeping as text');
            }
        }
        
        await User.findByIdAndUpdate(req.user._id, { $inc: { 'usage.requests': 1 } });
        
        res.json({ content, type });
    } catch (error) {
        console.error('Error in generateStudyMaterial:', error);
        res.status(500).json({ message: 'Failed to generate study material: ' + error.message });
    }
});

const generateAudioOverview = asyncHandler(async (req, res) => {
    const { sources, format } = req.body;
    
    if (!sources || sources.length === 0) {
        return res.status(400).json({ message: 'No sources provided' });
    }
    
    try {
        const result = await generateAudioScript(sources, format);
        await User.findByIdAndUpdate(req.user._id, { $inc: { 'usage.requests': 1 } });
        res.json(result);
    } catch (error) {
        console.error('Error generating audio overview:', error);
        res.status(500).json({ message: 'Failed to generate audio overview: ' + error.message });
    }
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
    generateExamPaper,
    createSubjectQuiz,
    analyzeDocuments,
    generateStudyMaterial,
    generateAudioOverview
};