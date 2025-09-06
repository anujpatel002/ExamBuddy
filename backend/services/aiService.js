import { GoogleGenerativeAI } from '@google/generative-ai';

// --- THIS IS THE GEMINI CLIENT ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
// --------------------------------

const generateWithGemini = async (prompt) => {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    if (!response.text()) {
        console.error("AI Response blocked due to safety ratings. Response:", JSON.stringify(response, null, 2));
        throw new Error("The generated content was blocked for safety reasons. Please try with different source material.");
    }
    return response.text();
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw new Error('Failed to generate content from AI service.');
  }
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

export const generateSummary = async (textContent) => {
  const prompt = `
  **Primary Directive:** Your response MUST be in the same language as the "TEXT TO USE" provided below.

  Act as an expert academic tutor. Summarize the text using appropriate formatting like headings, bullet points, and bold keywords.

  ---
  TEXT TO USE:
  "${textContent}"`;
  return await generateWithGemini(prompt);
};

export const generateFlashcards = async (textContent, existingCount = 0) => {
  const prompt = `
  **Primary Directive:** Your response MUST be in the same language as the "TEXT TO USE" provided below.

  Generate 5 unique question and answer pairs suitable for flashcards, different from the first ${existingCount} questions. Return the output as a valid JSON array of objects with "question" and "answer" keys. Do not wrap the JSON in markdown backticks.

  ---
  TEXT TO USE:
  "${textContent}"`;
  
  const rawResponse = await generateWithGemini(prompt);
  try {
    return cleanAndParseJson(rawResponse);
  } catch (error) {
    console.error("Failed to parse flashcards JSON. Raw AI response:", rawResponse);
    throw new Error("AI generated invalid flashcard format.");
  }
};

export const generateMarkBasedQuestions = async (textContent, category = null, existingQuestions = []) => {
  const existingQuestionsString = existingQuestions.map(q => q.question).join('\n');
  
  // --- THE FULL PROMPT IS NOW RESTORED ---
  const prompt = category 
    ? `
      **Primary Directive:** Your response MUST be in the same language as the "TEXT TO USE" provided below. Both questions and answers must be in that language.

      Generate 2-3 new, unique questions for the "${category}" category. Do NOT repeat any of the following questions:
      ${existingQuestionsString}
      
      Return the output as a valid JSON array of objects with "question" and "answer" keys. Do not wrap the JSON in markdown backticks.
      
      ---
      TEXT TO USE:
      "${textContent}"
      `
    : `
      **Primary Directive:** Your response MUST be in the same language as the "TEXT TO USE" provided below. All questions and answers for all categories must be in that language.

      Act as an expert exam paper creator. Generate a set of questions categorized by marks.
      
      Return the output as a single, valid JSON object with keys "oneMarker", "threeMarker", "fourMarker", and "fiveMarker". Each key should hold an array of objects with "question" and "answer" keys. Do not wrap the JSON in markdown backticks.
      
      ---
      TEXT TO USE:
      "${textContent}"
      `;

  const rawResponse = await generateWithGemini(prompt);
  try {
    return cleanAndParseJson(rawResponse);
  } catch (error) {
    console.error("Failed to parse mark-based questions JSON. Raw AI response:", rawResponse);
    throw new Error("AI generated invalid format for mark-based questions.");
  }
};

export const generateQuiz = async (textContent, questionCount = 5) => {
    // --- THE FULL PROMPT IS NOW RESTORED ---
    const prompt = `
    **Primary Directive:** Your response MUST be in the same language as the "TEXT TO USE" provided below. All questions, options, and answers must be in that language.

    Create a quiz with exactly ${questionCount} multiple-choice questions (MCQs) and 2 descriptive questions.
    
    Return the output as a single valid JSON object with keys "mcqs" and "descriptive". Do not wrap the JSON in markdown backticks.

    ---
    TEXT TO USE:
    "${textContent}"
    `;
    const rawResponse = await generateWithGemini(prompt);
    try {
        return cleanAndParseJson(rawResponse);
    } catch (error) {
        console.error("Failed to parse quiz JSON. Raw AI response:", rawResponse);
        throw new Error("AI generated invalid quiz format.");
    }
};

export const generateTitle = async (textContent) => {
  const truncatedText = textContent.substring(0, 500);
  const prompt = `
  **Primary Directive:** Analyze the following text and suggest a short, descriptive title for it (5-10 words maximum). Your response must be only the title text, with no extra words or quotation marks.

  ---
  TEXT TO ANALYZE:
  "${truncatedText}"`;
  
  return await generateWithGemini(prompt);
};