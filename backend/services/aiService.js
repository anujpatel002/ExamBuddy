import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize the model for all tasks
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Helper function for AI generation
const generateContent = async (prompt) => {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    if (!response.text()) {
        console.error("AI Response blocked due to safety ratings. Response:", JSON.stringify(response, null, 2));
        throw new Error("The generated content was blocked for safety reasons.");
    }
    return response.text();
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw new Error('Failed to generate content from AI service.');
  }
};

export const answerDoubt = async (context, question) => {
    const isKeyPointsRequest = question.toLowerCase().includes('key points') || 
                              question.toLowerCase().includes('main points') ||
                              question.toLowerCase().includes('briefly') ||
                              question.toLowerCase().includes('summarize') ||
                              question.toLowerCase().includes('advantages') ||
                              question.toLowerCase().includes('benefits') ||
                              question.toLowerCase().includes('features');
    
    const prompt = `
    You are an expert academic tutor. Answer the student's question using the provided context from their study notes.
    
    **FORMATTING REQUIREMENTS:**
    - Use proper headings with **bold text**
    - Use bullet points (•) for lists
    - Use numbered lists (1. 2. 3.) for steps
    - Use line breaks between sections
    - Use **bold** for important terms
    - Use *italic* for emphasis
    
    **INSTRUCTIONS:**
    1. Carefully analyze the context to find relevant information
    ${isKeyPointsRequest ? 
        `2. Format as:
        **Key Points:**
        
        • Point 1
        • Point 2  
        • Point 3
        
        Keep each point concise and focused` :
        `2. Format with clear sections using headings
        3. Use bullet points for features/benefits
        4. Use numbered lists for procedures/steps
        5. Provide detailed explanations with examples`
    }
    6. Use clear, educational language with proper formatting
    7. Only say information is not available if there's truly NO related content
    
    ---
    CONTEXT FROM NOTES:
    ${context}
    ---
    
    STUDENT'S QUESTION:
    "${question}"
    
    ANSWER:
    `;
    
    const response = await generateContent(prompt);
    
    // Clean text formatting without HTML tags
    return response;
};

const cleanAndParseJson = (rawResponse) => {
  const startIndex = rawResponse.indexOf('{');
  const endIndex = rawResponse.lastIndexOf('}');
  const arrayStartIndex = rawResponse.indexOf('[');
  const arrayEndIndex = rawResponse.lastIndexOf(']');
  let jsonString;
  if (startIndex !== -1 && endIndex !== -1 && (arrayStartIndex === -1 || startIndex < arrayStartIndex)) {
    jsonString = rawResponse.substring(startIndex, endIndex + 1);
  } else if (arrayStartIndex !== -1 && arrayEndIndex !== -1) {
    jsonString = rawResponse.substring(arrayStartIndex, arrayEndIndex + 1);
  } else {
    throw new Error("No valid JSON found in the AI response.");
  }
  return JSON.parse(jsonString);
};

// --- FEATURE ROUTING ---

export const generateSummary = async (textContent) => {
  const prompt = `
  Act as an expert academic tutor. Summarize the text using appropriate formatting like headings, bullet points, and bold keywords.
  ---
  TEXT TO USE:
  "${textContent}"`;
  return await generateContent(prompt);
};

export const generateMarkBasedQuestions = async (textContent, category = null, existingQuestions = []) => {
  const existingQuestionsString = existingQuestions.map(q => q.question).join('\n');
  const prompt = category 
    ? `
      Generate 2-3 new, unique questions for the "${category}" category. Do NOT repeat any of the following questions:
      ${existingQuestionsString}
      Return the output as a valid JSON array of objects with "question" and "answer" keys. Do not wrap the JSON in markdown backticks.
      ---
      TEXT TO USE:
      "${textContent}"
      `
    : `
      Act as an expert exam paper creator. Generate a set of questions categorized by marks.
      Return the output as a single, valid JSON object with keys "oneMarker", "threeMarker", "fourMarker", and "fiveMarker". Each key should hold an array of objects with "question" and "answer" keys. Do not wrap the JSON in markdown backticks.
      ---
      TEXT TO USE:
      "${textContent}"
      `;
  const rawResponse = await generateContent(prompt);
  try {
    return cleanAndParseJson(rawResponse);
  } catch (error) {
    console.error("Failed to parse mark-based questions JSON. Raw AI response:", rawResponse);
    throw new Error("AI generated invalid format for mark-based questions.");
  }
};

export const generateMindMap = async (textContent) => {
  const prompt = `
  Create a comprehensive, detailed mind map from the following text. The mind map should include:
  - Main topics as primary branches
  - Subtopics with detailed explanations
  - Key concepts with examples where applicable
  - Important formulas, definitions, or facts
  - Practical applications or real-world examples
  - Memory aids or mnemonics where helpful
  
  Structure as nested JSON with this format:
  {
    "name": "Main Topic",
    "description": "Brief overview of the main topic",
    "children": [
      {
        "name": "Subtopic 1",
        "description": "Detailed explanation of this subtopic",
        "examples": ["Example 1", "Example 2"],
        "keyPoints": ["Important point 1", "Important point 2"],
        "children": [
          {
            "name": "Sub-subtopic",
            "description": "Detailed explanation",
            "formula": "Mathematical formula if applicable",
            "examples": ["Specific example with solution"],
            "applications": ["Real-world application"]
          }
        ]
      }
    ]
  }
  
  Make it as detailed and educational as possible. Include practical examples, step-by-step explanations, and memory aids.
  Return ONLY the valid JSON object.
  ---
  TEXT TO USE:
  "${textContent}"`;
  const rawResponse = await generateContent(prompt);
  try {
    return cleanAndParseJson(rawResponse);
  } catch (error) {
    console.error("Failed to parse mind map JSON. Raw AI response:", rawResponse);
    throw new Error("AI generated invalid mind map format.");
  }
};

export const extractTopics = async (textContent) => {
  const prompt = `
  Analyze the following text from a student's notes. Identify the top 5-7 most important, core concepts or topics. Rank them by importance from 1 (most important) to 7 (least important).
  Return ONLY a valid JSON object with a single key "topics". The value should be an array of objects, where each object has a "topic" (string) and "importance" (number) key.
  ---
  TEXT TO ANALYZE:
  "${textContent}"`;
  
  const rawResponse = await generateContent(prompt);
  try {
    return cleanAndParseJson(rawResponse);
  } catch (error) {
    console.error("Failed to parse topics JSON:", error);
    throw new Error("AI generated invalid topic format.");
  }
};

export const generateQuestionsForTopic = async (textContent, topic) => {
    const prompt = `
    **Primary Directive:** Your response MUST be in the same language as the provided text context.
    Act as an expert exam paper creator. Based on the provided text context, generate 3 exam-style questions specifically about the topic: **"${topic}"**. Create one question for each category: 1 marker, 3 markers, and 5 markers.
    Return ONLY a valid JSON array of objects. Each object must have a "question" (string), "answer" (string), and "marks" (number) key.
    ---
    TEXT CONTEXT:
    "${textContent}"`;
    const rawResponse = await generateContent(prompt);
    try {
        return cleanAndParseJson(rawResponse);
    } catch (error) {
        console.error(`Failed to parse questions for topic ${topic}:`, error);
        throw new Error(`AI generated invalid question format for ${topic}.`);
    }
};

export const generateTitle = async (textContent) => {
  const truncatedText = textContent.substring(0, 500);
  const prompt = `
  Analyze the following text and suggest a short, descriptive title for it (5-10 words maximum). Your response must be only the title text, with no extra words or quotation marks.
  ---
  TEXT TO ANALYZE:
  "${truncatedText}"`;
  return await generateContent(prompt);
};

export const generateFlashcards = async (textContent, existingCount = 0) => {
  const prompt = `
  **IMPORTANT: Generate all content in English language only.**
  Generate 5 unique question and answer pairs suitable for flashcards, different from the first ${existingCount} questions. Return the output as a valid JSON array of objects with "question" and "answer" keys. Do not wrap the JSON in markdown backticks.
  ---
  TEXT TO USE:
  "${textContent}"`;
  
  const rawResponse = await generateContent(prompt);
  try {
    return cleanAndParseJson(rawResponse);
  } catch (error) {
    console.error("Failed to parse flashcards JSON. Raw AI response:", rawResponse);
    throw new Error("AI generated invalid flashcard format.");
  }
};

export const generateQuiz = async (textContent, questionCount = 5) => {
    const prompt = `
    Create a quiz with exactly ${questionCount} multiple-choice questions (MCQs) and 2 descriptive questions.
    
    For MCQs, return JSON with this EXACT structure:
    {
      "mcqs": [
        {
          "question": "Question text?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "Option A"
        }
      ],
      "descriptive": [
        {"question": "Descriptive question text?"}
      ]
    }
    
    CRITICAL: correctAnswer must be EXACTLY one of the options.
    ---
    TEXT TO USE:
    "${textContent}"
    `;
    const rawResponse = await generateContent(prompt);
    try {
        return cleanAndParseJson(rawResponse);
    } catch (error) {
        console.error("Failed to parse quiz JSON. Raw AI response:", rawResponse);
        throw new Error("AI generated invalid quiz format.");
    }
};