import asyncHandler from 'express-async-handler';
import { findRelevantDocuments } from '../utils/vectorStore.js';
import { answerDoubt } from '../services/aiService.js';
import Note from '../models/noteModel.js';

const askQuestion = asyncHandler(async (req, res) => {
    const { noteId, question } = req.body;
    const note = await Note.findById(noteId);

    if (!noteId || !question) {
        res.status(400);
        throw new Error('Note ID and question are required.');
    }

    if (!note) {
        res.status(404);
        throw new Error('Note not found.');
    }

    if (note.embeddingStatus !== 'completed') {
        res.status(400);
        throw new Error(`This note is still being processed (status: ${note.embeddingStatus}). Please try again in a moment.`);
    }

    console.log(`Processing question for note ${noteId}: ${question}`);

    // 1. Find relevant context from the user's notes
    let context = await findRelevantDocuments(noteId, question);
    
    // Fallback: if vector search fails, use the full note text
    if (!context || context.trim().length === 0) {
        console.log('Vector search failed, using full note text as fallback');
        context = note.textContent || '';
        
        if (!context || context.trim().length === 0) {
            res.status(400);
            throw new Error('No content found in this note.');
        }
    }

    // 2. Pass context and question to the AI to get an answer
    const answer = await answerDoubt(context, question);

    res.json({ answer });
});

export { askQuestion };