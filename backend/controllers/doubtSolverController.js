import asyncHandler from 'express-async-handler';
import { findRelevantDocuments } from '../utils/vectorStore.js';
import { answerDoubt } from '../services/aiService.js';
import Note from '../models/noteModel.js';
import User from '../models/userModel.js';

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

    // 1. Get full note content as primary context
    let context = note.textContent || '';
    
    if (!context || context.trim().length === 0) {
        res.status(400);
        throw new Error('No content found in this note.');
    }
    
    // 2. Try to get more relevant context from vector search and combine
    try {
        const vectorContext = await findRelevantDocuments(noteId, question);
        if (vectorContext && vectorContext.trim().length > 0) {
            context = `--- Most Relevant Sections ---\n${vectorContext}\n\n--- Full Note Content ---\n${context}`;
        }
    } catch (error) {
        console.log('Vector search failed, using full note content:', error.message);
    }
    
    // 3. Limit context size to prevent token overflow
    if (context.length > 12000) {
        context = context.substring(0, 12000) + '\n\n[Note: Content truncated for processing]';
    }

    // 4. Generate answer using comprehensive context
    const answer = await answerDoubt(context, question);
    
    // 5. Update user credits
    await User.findByIdAndUpdate(req.user._id, { $inc: { 'usage.requests': 1 } });

    res.json({ answer });
});

export { askQuestion };