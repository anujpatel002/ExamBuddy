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
    
    FORMATTING REQUIREMENTS:
    - Use proper headings
    - Use bullet points (•) for lists
    - Use numbered lists (1. 2. 3.) for steps
    - Use line breaks between sections
    - Use clear, readable text formatting
    
    **INSTRUCTIONS:**
    1. Carefully analyze the context to find relevant information
    ${isKeyPointsRequest ? 
        `2. Format as:
        Key Points:
        
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
  // Remove ** and other markdown formatting from response
  if (typeof rawResponse === 'string') {
    rawResponse = rawResponse
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      .replace(/_(.*?)_/g, '$1');
  }
  console.log('Raw AI response (first 200 chars):', rawResponse.substring(0, 200));
  
  if (!rawResponse || typeof rawResponse !== 'string') {
    console.error('Invalid response type:', typeof rawResponse);
    return createFallbackStructure('Invalid response');
  }
  
  // Try multiple parsing strategies
  const strategies = [
    // Strategy 1: Direct parse
    () => JSON.parse(rawResponse),
    
    // Strategy 2: Clean markdown and fix JSON structure
    () => {
      let cleaned = rawResponse
        .replace(/```json\s*|```\s*/g, '')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\n\s*/g, ' ')
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .trim();
      
      // Fix incomplete JSON by finding the last complete object
      const lastCompleteObject = cleaned.lastIndexOf('}');
      if (lastCompleteObject > 0) {
        cleaned = cleaned.substring(0, lastCompleteObject + 1);
        if (!cleaned.endsWith(']')) {
          cleaned += ']';
        }
      }
      
      return JSON.parse(cleaned);
    },
    
    // Strategy 3: Extract JSON structure with HTML entity cleanup
    () => {
      let cleaned = rawResponse
        .replace(/```json\s*|```\s*/g, '')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
      
      const startIndex = cleaned.indexOf('{');
      const endIndex = cleaned.lastIndexOf('}');
      const arrayStartIndex = cleaned.indexOf('[');
      const arrayEndIndex = cleaned.lastIndexOf(']');
      
      let jsonString;
      if (startIndex !== -1 && endIndex !== -1 && (arrayStartIndex === -1 || startIndex < arrayStartIndex)) {
        jsonString = cleaned.substring(startIndex, endIndex + 1);
      } else if (arrayStartIndex !== -1 && arrayEndIndex !== -1) {
        jsonString = cleaned.substring(arrayStartIndex, arrayEndIndex + 1);
      } else {
        throw new Error('No JSON structure found');
      }
      
      return JSON.parse(jsonString);
    },
    
    // Strategy 4: Clean common issues and HTML entities, then parse
    () => {
      let cleaned = rawResponse
        .replace(/```json\s*|```\s*/g, '')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/^Here.*?:\s*/gim, '')
        .replace(/^The.*?:\s*/gim, '')
        .replace(/^Based.*?:\s*/gim, '')
        .trim();
      
      const startIndex = cleaned.indexOf('{');
      const endIndex = cleaned.lastIndexOf('}');
      const arrayStartIndex = cleaned.indexOf('[');
      const arrayEndIndex = cleaned.lastIndexOf(']');
      
      let jsonString;
      if (startIndex !== -1 && endIndex !== -1 && (arrayStartIndex === -1 || startIndex < arrayStartIndex)) {
        jsonString = cleaned.substring(startIndex, endIndex + 1);
      } else if (arrayStartIndex !== -1 && arrayEndIndex !== -1) {
        jsonString = cleaned.substring(arrayStartIndex, arrayEndIndex + 1);
      } else {
        throw new Error('No JSON structure found');
      }
      
      // Clean common JSON issues
      jsonString = jsonString
        .replace(/\n\s*/g, ' ')
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*):/g, '$1"$2":')
        .replace(/:\s*'([^']*)'/g, ': "$1"')
        .replace(/\\n/g, ' ')
        .replace(/\\t/g, ' ');
      
      return JSON.parse(jsonString);
    },
    
    // Strategy 5: Extract question-answer pairs manually with Unicode support
    () => {
      const questions = [];
      // More flexible regex for Unicode text
      const questionRegex = /["']question["']\s*:\s*["']([^"']*?)["']/gis;
      const answerRegex = /["']answer["']\s*:\s*["']([^"']*?)["']/gis;
      
      let questionMatch, answerMatch;
      const questionMatches = [];
      const answerMatches = [];
      
      while ((questionMatch = questionRegex.exec(rawResponse)) !== null) {
        questionMatches.push(questionMatch[1].trim());
      }
      
      while ((answerMatch = answerRegex.exec(rawResponse)) !== null) {
        answerMatches.push(answerMatch[1].trim());
      }
      
      if (questionMatches.length > 0 && answerMatches.length > 0) {
        const minLength = Math.min(questionMatches.length, answerMatches.length);
        for (let i = 0; i < minLength; i++) {
          if (questionMatches[i] && answerMatches[i]) {
            questions.push({
              question: questionMatches[i],
              answer: answerMatches[i]
            });
          }
        }
        return questions;
      }
      
      throw new Error('Could not extract question-answer pairs');
    }
  ];
  
  // Try each strategy
  for (let i = 0; i < strategies.length; i++) {
    try {
      const result = strategies[i]();
      console.log(`JSON parsing successful with strategy ${i + 1}`);
      
      // Validate result
      if (Array.isArray(result) && result.length > 0) {
        const validItems = result.filter(item => item && item.question && item.answer);
        if (validItems.length > 0) {
          return validItems;
        }
      } else if (result && typeof result === 'object') {
        // For practice questions with marker structure, return the full object
        if (result.oneMarker || result.threeMarker || result.fourMarker || result.fiveMarker) {
          console.log('Found marker structure, returning full object:', Object.keys(result));
          return result;
        }
        // For single marker response, extract the specific marker
        const markerKeys = ['oneMarker', 'threeMarker', 'fourMarker', 'fiveMarker'];
        for (const key of markerKeys) {
          if (result[key] && Array.isArray(result[key])) {
            console.log(`Found single marker ${key}, returning array of ${result[key].length} questions`);
            return result[key];
          }
        }
        // For mind maps, ensure it has required structure
        if (result.name || result.keyPoints || result.description) {
          return {
            name: result.name || 'Generated Content',
            description: result.description || '',
            keyPoints: result.keyPoints || [],
            examples: result.examples || [],
            children: result.children || []
          };
        }
        return result;
      }
      
      throw new Error('Invalid structure after parsing');
    } catch (error) {
      console.log(`Strategy ${i + 1} failed:`, error.message);
    }
  }
  
  // All strategies failed
  console.error('All parsing strategies failed. Creating fallback structure.');
  return createFallbackStructure(rawResponse);
};

const createFallbackStructure = (rawResponse) => {
  console.log('Creating fallback structure from response');
  
  // Try to extract meaningful content even if JSON parsing fails
  if (rawResponse.includes('question') && rawResponse.includes('answer')) {
    // For flashcards or questions - try to extract some content
    const lines = rawResponse.split('\n').filter(line => line.trim());
    const flashcards = [];
    
    // Try to find question-answer patterns in the text
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (line.includes('question') || line.includes('what') || line.includes('how') || line.includes('define')) {
        const question = lines[i].replace(/^\d+\.\s*/, '').replace(/["']/g, '').trim();
        const answer = lines[i + 1] ? lines[i + 1].replace(/^\d+\.\s*/, '').replace(/["']/g, '').trim() : 'Answer not properly formatted';
        
        if (question && answer && flashcards.length < 3) {
          flashcards.push({ question, answer });
        }
      }
    }
    
    if (flashcards.length > 0) {
      return flashcards;
    }
    
    return [{
      question: 'Content was generated but needs better formatting',
      answer: 'Please try regenerating the flashcards. The AI response contained some content but was not in proper JSON format.'
    }];
  } else if (rawResponse.includes('name') || rawResponse.includes('title') || rawResponse.includes('keyPoints') || rawResponse.includes('mindmap')) {
    // For mind maps - create a basic structure
    return {
      name: 'Generated Mind Map',
      description: 'Content was generated but needs reformatting',
      keyPoints: ['Please regenerate for proper structure', 'The AI response contained content but was not in proper JSON format'],
      examples: ['Try regenerating the mind map for better results'],
      children: []
    };
  } else {
    // Generic fallback
    return [{
      question: 'Content generation completed',
      answer: 'The content was generated but needs to be reformatted. Please try regenerating.'
    }];
  }
};

// --- FEATURE ROUTING ---

export const generateSummary = async (textContent) => {
  const detectedLanguage = detectLanguage(textContent);
  const languageInstruction = getLanguageInstruction(detectedLanguage);
  
  // Check if content is large (more than 10 pages worth of text)
  const isLargeContent = textContent.length > 10000; // Approximately 10+ pages
  
  const prompt = `
  Create an EXTREMELY DETAILED, COMPREHENSIVE THEORETICAL summary with DEEP HIERARCHICAL STRUCTURE and perfect HTML formatting.
  
  FOCUS EXCLUSIVELY ON THEORETICAL CONCEPTS:
  - Definitions, principles, and conceptual frameworks
  - Theoretical advantages, disadvantages, and comparisons
  - Conceptual models and abstract understanding
  - Historical context and evolution of concepts
  - Theoretical applications and use cases
  - EXCLUDE: Code examples, syntax, implementation details, programming constructs
  
  CRITICAL: Return ONLY the content inside the body tags. DO NOT include <!DOCTYPE html>, <html>, <head>, or <body> tags.
  
  STRICT FORMATTING RULES:
  - Use <h1 style="color: #0f172a; text-align: center; border-bottom: 3px solid #0f172a; padding-bottom: 12px; margin: 32px 0 24px 0; font-size: 28px; font-weight: 700;"> for main title
  - Use <h2 style="color: #1e293b; border-bottom: 2px solid #cbd5e1; padding-bottom: 8px; margin: 32px 0 20px 0; font-size: 22px; font-weight: 600;"> for major sections
  - Use <h3 style="color: #334155; margin: 24px 0 16px 0; font-weight: 600; font-size: 18px;"> for subsections
  - Use <h4 style="color: #475569; margin: 20px 0 12px 0; font-weight: 600; font-size: 16px;"> for sub-subsections
  - Use <h5 style="color: #64748b; margin: 16px 0 8px 0; font-weight: 600; font-size: 14px;"> for detailed points
  - Use <p style="color: #374151; margin: 12px 0; line-height: 1.8; text-align: justify; font-size: 15px;"> for paragraphs
  - Use <table style="width: 100%; border-collapse: collapse; margin: 20px 0; border: 2px solid #d1d5db; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"> for tables
  - Use <th style="background: #f8fafc; border: 1px solid #e2e8f0; color: #1e293b; padding: 16px; font-weight: 700; text-align: center;"> for headers
  - Use <td style="border: 1px solid #e2e8f0; color: #374151; padding: 14px; vertical-align: top;"> for table cells
  - Use <ul style="color: #374151; margin: 16px 0; padding-left: 32px;"> and <li style="margin: 8px 0; line-height: 1.6;"> for lists
  - Use <ol style="color: #374151; margin: 16px 0; padding-left: 32px;"> and <li style="margin: 8px 0; line-height: 1.6;"> for numbered lists
  - Use <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 6px; font-family: 'Courier New', monospace; color: #dc2626;"> for inline code
  - Use <pre style="background: #1f2937; color: #10b981; padding: 20px; border-radius: 12px; overflow-x: auto; margin: 20px 0; border-left: 4px solid #10b981;"> for code blocks
  - Use <blockquote style="border-left: 6px solid #0f172a; background: #f8fafc; color: #1e293b; padding: 16px 20px; margin: 20px 0; border-radius: 8px; font-style: italic;"> for definitions
  - Use <div style="background: #f1f5f9; border: 2px solid #cbd5e1; color: #334155; padding: 20px; margin: 20px 0; border-radius: 12px;"> for special sections
  
  MANDATORY DEEP STRUCTURE (START DIRECTLY WITH CONTENT - NO HTML DOCUMENT TAGS):
  <h1 style="color: #1e40af; text-align: center; border-bottom: 3px solid #3b82f6; padding-bottom: 12px; margin: 32px 0 24px 0; font-size: 28px;">📚 Complete Study Guide</h1>
  
  <h2 style="color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin: 32px 0 20px 0; font-size: 22px;">📋 1. Executive Overview</h2>
  <p style="margin: 12px 0; line-height: 1.8; color: #374151; text-align: justify;">Comprehensive introduction covering scope, importance, and learning objectives</p>
  
  <h2>🔑 2. Fundamental Concepts & Definitions</h2>
  <h3>2.1 Core Terminology</h3>
  <blockquote>Primary definitions with detailed explanations</blockquote>
  <h3>2.2 Related Concepts</h3>
  <blockquote>Secondary definitions and interconnections</blockquote>
  
  <h2>📚 3. Theoretical Foundations</h2>
  <h3>3.1 Basic Principles</h3>
  <h4>3.1.1 Principle One</h4>
  <h5>Definition and Explanation</h5>
  <p>Detailed explanation with context</p>
  <h5>Applications and Examples</h5>
  <ul><li>Example 1 with detailed explanation</li><li>Example 2 with context</li></ul>
  <h4>3.1.2 Principle Two</h4>
  <p>Comprehensive coverage with examples</p>
  
  <h3>3.2 Advanced Concepts</h3>
  <h4>3.2.1 Complex Topic One</h4>
  <p>In-depth analysis with multiple perspectives</p>
  <h4>3.2.2 Complex Topic Two</h4>
  <p>Detailed examination with real-world connections</p>
  
  <h2>🔬 4. Theoretical Models and Frameworks</h2>
  <h3>4.1 Conceptual Models</h3>
  <h4>4.1.1 Theoretical Framework</h4>
  <p>Detailed explanation of theoretical framework and its components</p>
  <h4>4.1.2 Conceptual Relationships</h4>
  <p>How different theoretical concepts relate and interact</p>
  
  <h3>4.2 Advanced Theoretical Analysis</h3>
  <h4>4.2.1 Comparative Theory</h4>
  <p>Theoretical comparison between different approaches and methodologies</p>
  <h4>4.2.2 Theoretical Implications</h4>
  <p>Long-term theoretical implications and conceptual significance</p>
  
  <h2>📊 5. Comprehensive Analysis</h2>
  <h3>5.1 Comparative Analysis</h3>
  <table>
  <tr><th>Aspect</th><th>Approach A</th><th>Approach B</th><th>Best Use Case</th></tr>
  <tr><td>Performance</td><td>High speed</td><td>Memory efficient</td><td>Large datasets</td></tr>
  <tr><td>Complexity</td><td>Simple</td><td>Complex</td><td>Beginner projects</td></tr>
  </table>
  
  <h3>5.2 Advantages and Disadvantages</h3>
  <h4>5.2.1 Advantages</h4>
  <ul>
  <li>Detailed advantage 1 with explanation and impact</li>
  <li>Detailed advantage 2 with real-world benefits</li>
  <li>Detailed advantage 3 with quantifiable metrics</li>
  </ul>
  <h4>5.2.2 Disadvantages</h4>
  <ul>
  <li>Limitation 1 with mitigation strategies</li>
  <li>Limitation 2 with workaround solutions</li>
  </ul>
  
  <h2>🌍 6. Real-World Applications</h2>
  <h3>6.1 Industry Use Cases</h3>
  <h4>6.1.1 Web Development</h4>
  <p>Specific applications in web development with examples</p>
  <h4>6.1.2 Mobile Applications</h4>
  <p>Mobile-specific implementations and considerations</p>
  <h4>6.1.3 Enterprise Solutions</h4>
  <p>Large-scale enterprise applications and architectures</p>
  
  <h3>6.2 Case Studies</h3>
  <div>
  <h4>Case Study 1: [Specific Implementation]</h4>
  <p>Detailed case study with problem, solution, and results</p>
  </div>
  
  <h2>⚡ 7. Best Practices & Guidelines</h2>
  <h3>7.1 Development Best Practices</h3>
  <ol>
  <li>Best practice 1 with detailed explanation and rationale</li>
  <li>Best practice 2 with implementation guidelines</li>
  <li>Best practice 3 with common pitfalls to avoid</li>
  </ol>
  
  <h3>7.2 Performance Optimization</h3>
  <h4>7.2.1 Code Optimization</h4>
  <p>Specific optimization techniques with before/after examples</p>
  <h4>7.2.2 Resource Management</h4>
  <p>Memory and processing optimization strategies</p>
  
  <h2>🔍 8. Theoretical Analysis & Evaluation</h2>
  <h3>8.1 Critical Analysis</h3>
  <h4>8.1.1 Theoretical Strengths</h4>
  <p>Analysis of theoretical advantages and strong points</p>
  <h4>8.1.2 Theoretical Limitations</h4>
  <p>Examination of theoretical constraints and weaknesses</p>
  
  <h3>8.2 Evaluation Methods</h3>
  <h4>8.2.1 Comparative Evaluation</h4>
  <p>Methods for comparing different theoretical approaches</p>
  <h4>8.2.2 Theoretical Validation</h4>
  <p>Approaches to validate theoretical concepts and frameworks</p>
  
  <h2>🎯 9. Key Takeaways & Summary</h2>
  <h3>9.1 Essential Points</h3>
  <ul>
  <li>Critical takeaway 1 with supporting evidence</li>
  <li>Critical takeaway 2 with practical implications</li>
  <li>Critical takeaway 3 with future considerations</li>
  </ul>
  
  <h3>9.2 Learning Objectives Achieved</h3>
  <ol>
  <li>Objective 1: Detailed understanding of core concepts</li>
  <li>Objective 2: Practical implementation skills</li>
  <li>Objective 3: Real-world application knowledge</li>
  </ol>
  
  <h2>📖 10. Further Reading & Resources</h2>
  <h3>10.1 Advanced Topics</h3>
  <p>Suggestions for deeper study and advanced concepts</p>
  <h3>10.2 Related Technologies</h3>
  <p>Connected technologies and complementary skills</p>
  
  CRITICAL REQUIREMENTS:
  - Return ONLY the HTML content without <!DOCTYPE html>, <html>, <head>, or <body> tags
  - Start directly with the <h1> title and content
  - Create MAXIMUM DEPTH with 4-5 heading levels (h1 through h5)
  - Include COMPREHENSIVE coverage of ALL aspects
  - Use DETAILED explanations with context and examples
  - Add MULTIPLE code examples with complete implementations
  - Include EXTENSIVE tables with detailed comparisons
  - Provide STEP-BY-STEP processes and procedures
  - Add REAL-WORLD applications and case studies
  - Include TROUBLESHOOTING and debugging sections
  - Use RICH formatting with gradients, shadows, and styling
  - Make it EXAM-READY with complete information coverage
  
  ${isLargeContent ? `CRITICAL: Since this is a large document (10+ pages), generate the ENTIRE summary in ${detectedLanguage === 'gujarati' ? 'GUJARATI' : detectedLanguage === 'hindi' ? 'HINDI' : 'ENGLISH'} language only. Do not mix languages.` : ''}
  
  TEXT: "${textContent}"${languageInstruction}`;
  
  const response = await generateContent(prompt);
  
  // Clean the response to remove any HTML document structure if present
  let cleanedResponse = response;
  
  // Remove HTML document structure if present
  if (cleanedResponse.includes('<!DOCTYPE html>')) {
    const bodyStart = cleanedResponse.indexOf('<body>');
    const bodyEnd = cleanedResponse.lastIndexOf('</body>');
    if (bodyStart !== -1 && bodyEnd !== -1) {
      cleanedResponse = cleanedResponse.substring(bodyStart + 6, bodyEnd).trim();
    }
  }
  
  // Remove any remaining HTML, HEAD, or BODY tags
  cleanedResponse = cleanedResponse
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<\/?html[^>]*>/gi, '')
    .replace(/<\/?head[^>]*>/gi, '')
    .replace(/<\/?body[^>]*>/gi, '')
    .replace(/<title[^>]*>.*?<\/title>/gi, '')
    .replace(/<meta[^>]*>/gi, '')
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .trim();
  
  return cleanedResponse;
};

const detectPracticalContent = (textContent) => {
  // For non-English content, be more conservative about practical detection
  const hasUnicodeText = /[\u0900-\u097F\u0A80-\u0AFF]+/.test(textContent);
  
  const practicalKeywords = [
    'implementation', 'code', 'algorithm', 'program', 'function', 'method', 'class',
    'procedure', 'steps', 'process', 'workflow', 'example', 'case study', 'scenario',
    'application', 'practice', 'exercise', 'lab', 'experiment', 'project', 'build',
    'create', 'develop', 'design', 'construct', 'execute', 'run', 'test', 'debug',
    'syntax', 'variable', 'loop', 'condition', 'array', 'object', 'string', 'integer',
    'boolean', 'if', 'else', 'for', 'while', 'return', 'print', 'input', 'output',
    'compile', 'parameter', 'call', 'invoke', 'declare', 'initialize', 'instantiate',
    'programming', 'coding', 'software', 'development', 'javascript', 'python', 'java',
    'html', 'css', 'sql', 'database', 'framework', 'library', 'api'
  ];
  
  const lowerContent = textContent.toLowerCase();
  const keywordCount = practicalKeywords.filter(keyword => 
    lowerContent.includes(keyword)
  ).length;
  
  // Enhanced code pattern detection - but be more conservative for Unicode text
  const codePatterns = [
    /\b\w+\s*\(/,  // function calls like function()
    /\bif\s*\(/,   // if statements
    /\bfor\s*\(/,  // for loops
    /\bwhile\s*\(/, // while loops
    /\{[^}]*\}/,   // code blocks
    /\w+\s*=/,     // assignments
    /\bclass\s+\w+/, // class definitions
    /\bdef\s+\w+/,   // function definitions
    /\bvar\s+\w+/,   // variable declarations
    /\blet\s+\w+/,   // let declarations
    /\bconst\s+\w+/, // const declarations
    /<\w+[^>]*>/,    // HTML tags
    /SELECT|INSERT|UPDATE|DELETE/i, // SQL keywords
  ];
  
  const codePatternCount = codePatterns.filter(pattern => 
    pattern.test(textContent)
  ).length;
  
  // For Unicode text (Hindi/Gujarati), require more evidence of practical content
  const threshold = hasUnicodeText ? 3 : 1;
  const detected = keywordCount >= 3 || codePatternCount >= threshold;
  
  console.log(`Practical content detection: keywords=${keywordCount}, patterns=${codePatternCount}, hasUnicode=${hasUnicodeText}, threshold=${threshold}, detected=${detected}`);
  
  return detected;
};

export const generateMarkBasedQuestions = async (textContent, markers = null, existingQuestions = [], count = 5) => {
  const existingQuestionsString = existingQuestions.length > 0 ? existingQuestions.join('\n') : '';
  const hasCodeContent = detectPracticalContent(textContent);
  const detectedLanguage = detectLanguage(textContent);
  const languageInstruction = getLanguageInstruction(detectedLanguage);
  
  if (markers) {
    const languageSpecificInstruction = detectedLanguage === 'gujarati' ? 
      '\n\nCRITICAL: Generate ALL questions and answers ONLY in GUJARATI language. Do not use any English words. Maintain the input content language strictly.' :
      detectedLanguage === 'hindi' ? 
      '\n\nCRITICAL: Generate ALL questions and answers ONLY in HINDI language. Do not use any English words. Maintain the input content language strictly.' :
      '\n\nCRITICAL: Generate ALL questions and answers ONLY in ENGLISH language.';
      
    const prompt = `
CRITICAL LANGUAGE REQUIREMENT: Generate questions EXCLUSIVELY in ${detectedLanguage === 'gujarati' ? 'GUJARATI' : detectedLanguage === 'hindi' ? 'HINDI' : 'ENGLISH'} language ONLY. NO mixing of languages allowed.

Generate ${count} FINAL EXAM LEVEL questions worth ${markers} marks each.

STRICT LANGUAGE RULE: ALL content must be in ${detectedLanguage === 'gujarati' ? 'ગુજરાતી' : detectedLanguage === 'hindi' ? 'हिंदी' : 'English'} language ONLY.

ANSWER FORMATTING REQUIREMENTS:
- Use HTML formatting: <strong> for key points, <br> for line breaks
- Structure answers with clear sections and bullet points
- Remove any ** formatting - use <strong> instead

Answer length and structure based on marks:
- 1 mark: 1-2 sentences with <strong>key term</strong> highlighted
- 3 marks: 3-4 sentences with <strong>key points</strong> and examples
- 4 marks: 4-5 sentences with <strong>detailed explanation</strong>, examples, and applications
- 5 marks: 5-7 sentences with <strong>comprehensive analysis</strong>, multiple examples, and real-world applications

Return ONLY valid JSON array:
[{"question": "Question text", "answer": "<strong>Key Point:</strong> Definition here.<br><br>Explanation with <strong>important terms</strong> highlighted.<br><br>Examples and applications.", "marks": ${markers}}]

AVOID these questions: ${existingQuestionsString}${languageSpecificInstruction}
TEXT: "${textContent.substring(0, 2000)}"`;
    
    const rawResponse = await generateContent(prompt);
    const result = cleanAndParseJson(rawResponse);
    console.log('Generated questions result for marker', markers, ':', result);
    console.log('Result type:', typeof result, 'Is array:', Array.isArray(result));
    if (result && typeof result === 'object' && !Array.isArray(result)) {
      console.log('Result keys:', Object.keys(result));
    }
    return Array.isArray(result) ? result : [];
  }
  
  if (hasCodeContent) {
    // Generate theory questions
    const theoryPrompt = `
      Generate FINAL EXAM LEVEL theoretical questions. Return ONLY valid JSON:
      {
        "oneMarker": [{"question": "Define [concept]", "answer": "<strong>Definition:</strong> Clear definition with <strong>key terms</strong> highlighted.", "marks": 1}],
        "threeMarker": [{"question": "Explain [concept] with advantages", "answer": "<strong>Explanation:</strong> Detailed explanation.<br><br><strong>Advantages:</strong><br>• Point 1<br>• Point 2", "marks": 3}],
        "fourMarker": [{"question": "Compare [concept A] vs [concept B]", "answer": "<strong>Comparison:</strong><br><br><strong>[Concept A]:</strong> Details<br><br><strong>[Concept B]:</strong> Details<br><br><strong>Key Differences:</strong> Analysis", "marks": 4}],
        "fiveMarker": [{"question": "Analyze [concept] with applications", "answer": "<strong>Analysis:</strong> Comprehensive explanation.<br><br><strong>Key Features:</strong><br>• Feature 1<br>• Feature 2<br><br><strong>Applications:</strong> Real-world examples", "marks": 5}]
      }
      CRITICAL REQUIREMENTS:
      - Generate 3-4 questions per category
      - Focus ONLY on theoretical concepts, definitions, principles
      - Use proper HTML formatting: <strong>, <br>, bullet points
      - NO code examples or practical implementation
      - Clear, structured answers with proper sections
      - Ensure all questions are exam-level difficulty
      TEXT: "${textContent.substring(0, 2000)}"`;
      
    // Generate practical questions
    const practicalPrompt = `
      Generate FINAL EXAM LEVEL practical questions with HTML formatting. Return ONLY valid JSON:
      {
        "oneMarker": [{"question": "What is the output: [code]?", "answer": "<strong>Output:</strong> Result<br><br><strong>Explanation:</strong> Why this output", "marks": 1}],
        "threeMarker": [{"question": "Write code for [task]", "answer": "<strong>Solution:</strong><br><pre>code here</pre><br><strong>Explanation:</strong> How it works", "marks": 3}],
        "fourMarker": [{"question": "Debug this code: [buggy code]", "answer": "<strong>Errors Found:</strong><br>• Error 1<br>• Error 2<br><br><strong>Corrected Code:</strong><br><pre>fixed code</pre>", "marks": 4}],
        "fiveMarker": [{"question": "Design [complex system]", "answer": "<strong>Design Approach:</strong> Strategy<br><br><strong>Implementation:</strong><br><pre>complete code</pre><br><br><strong>Benefits:</strong> Advantages", "marks": 5}]
      }
      FORMATTING RULES:
      - Use <strong> for headings, NOT **
      - Use <pre> for code blocks
      - Use <br> for spacing
      - Structure answers with clear sections
      Generate 1-2 questions per category.
      TEXT: "${textContent.substring(0, 2000)}"`;
      
    const [theoryResponse, practicalResponse] = await Promise.all([
      generateContent(theoryPrompt),
      generateContent(practicalPrompt)
    ]);
    
    return {
      theory: cleanAndParseJson(theoryResponse),
      practical: cleanAndParseJson(practicalResponse)
    };
  } else {
    // Generate regular questions for non-code content
    const prompt = `
      Generate exam questions categorized by marks. Return ONLY valid JSON:
      {
        "oneMarker": [{"question": "...", "answer": "..."}],
        "threeMarker": [{"question": "...", "answer": "..."}],
        "fourMarker": [{"question": "...", "answer": "..."}],
        "fiveMarker": [{"question": "...", "answer": "..."}]
      }
      Generate 2-3 questions per category.
      TEXT: "${textContent.substring(0, 2000)}"`;
      
    const rawResponse = await generateContent(prompt);
    return cleanAndParseJson(rawResponse);
  }
};

export const generateMindMap = async (textContent) => {
  const hasCodeContent = detectPracticalContent(textContent);
  const detectedLanguage = detectLanguage(textContent);
  const languageInstruction = getLanguageInstruction(detectedLanguage);
  
  try {
    const prompt = `Create an EXTREMELY DETAILED and COMPREHENSIVE mind map with DEEP HIERARCHICAL STRUCTURE covering ALL aspects of the content.

Return ONLY valid JSON with MAXIMUM DEPTH and DETAIL:
{
  "name": "Complete Overview",
  "description": "Comprehensive mind map with deep hierarchical structure covering all theoretical and practical aspects in extreme detail",
  "keyPoints": [
    "Detailed theoretical concepts with definitions and explanations",
    "Complete practical implementations with step-by-step code examples",
    "Comprehensive syntax rules and programming constructs",
    "Extensive real-world applications and use cases",
    "Detailed algorithms, procedures, and methodologies",
    "In-depth analysis of advantages, disadvantages, and comparisons",
    "Complete workflow processes and implementation strategies"
  ],
  "examples": [
    "Detailed theoretical example with full explanation",
    "Complete code implementation: function demo() { return 'Hello World'; }",
    "Step-by-step syntax: if (condition) { executeAction(); }",
    "Real application: Used in enterprise web development for user authentication"
  ],
  "children": [
    {
      "name": "1. Theoretical Foundations",
      "description": "Complete theoretical understanding with definitions, principles, and conceptual framework",
      "keyPoints": ["Comprehensive definitions with etymology", "Core principles with detailed explanations", "Conceptual understanding with visual models", "Historical context and evolution", "Theoretical advantages and limitations"],
      "examples": ["Definition with real-world analogy", "Principle demonstration with examples", "Conceptual model visualization"],
      "children": [
        {
          "name": "1.1 Core Definitions",
          "description": "Detailed definitions of all key terms and concepts",
          "keyPoints": ["Primary definition with context", "Alternative definitions and interpretations", "Related terminology and synonyms", "Common misconceptions and clarifications"],
          "examples": ["Definition example 1", "Definition example 2", "Clarification example"],
          "children": [
            {
              "name": "1.1.1 Primary Concepts",
              "keyPoints": ["Fundamental concept explanation", "Key characteristics and properties", "Relationship to other concepts"],
              "examples": ["Primary concept example", "Characteristic demonstration"],
              "children": []
            },
            {
              "name": "1.1.2 Secondary Concepts",
              "keyPoints": ["Supporting concept details", "Derived properties and implications", "Practical significance"],
              "examples": ["Secondary concept example", "Implication demonstration"],
              "children": []
            }
          ]
        },
        {
          "name": "1.2 Fundamental Principles",
          "description": "Core principles governing the subject matter",
          "keyPoints": ["Principle 1 with detailed explanation", "Principle 2 with applications", "Principle interactions and dependencies", "Exceptions and special cases"],
          "examples": ["Principle application example", "Exception case example"],
          "children": [
            {
              "name": "1.2.1 Primary Principles",
              "keyPoints": ["Main governing rules", "Mathematical foundations", "Logical framework"],
              "examples": ["Mathematical example", "Logical proof example"],
              "children": []
            }
          ]
        }
      ]
    },
    {
      "name": "2. Practical Implementation",
      "description": "Complete implementation details with code examples, syntax, and best practices",
      "keyPoints": ["Detailed syntax with all variations", "Step-by-step implementation process", "Best practices and coding standards", "Common pitfalls and how to avoid them", "Performance considerations and optimizations", "Error handling and debugging techniques"],
      "examples": ["Complete function implementation", "Error handling example", "Optimization example"],
      "children": [
        {
          "name": "2.1 Syntax and Structure",
          "description": "Complete syntax rules and structural patterns",
          "keyPoints": ["Basic syntax rules with examples", "Advanced syntax patterns", "Structural conventions and standards", "Syntax variations across different contexts"],
          "examples": ["Basic syntax: var x = 10;", "Advanced pattern: function(param) { return result; }", "Structure example with comments"],
          "children": [
            {
              "name": "2.1.1 Basic Syntax Elements",
              "keyPoints": ["Variable declarations and types", "Operators and expressions", "Control structures"],
              "examples": ["let variable = value;", "if (condition) { action(); }", "for (let i = 0; i < n; i++) { }"],
              "children": []
            },
            {
              "name": "2.1.2 Advanced Syntax Patterns",
              "keyPoints": ["Complex expressions and operations", "Advanced control flow", "Object-oriented patterns"],
              "examples": ["Complex expression example", "Advanced loop example", "Class definition example"],
              "children": []
            }
          ]
        },
        {
          "name": "2.2 Implementation Strategies",
          "description": "Detailed implementation approaches and methodologies",
          "keyPoints": ["Step-by-step implementation process", "Alternative approaches and trade-offs", "Integration with existing systems", "Testing and validation strategies"],
          "examples": ["Complete implementation example", "Alternative approach example", "Integration example"],
          "children": [
            {
              "name": "2.2.1 Development Process",
              "keyPoints": ["Planning and design phase", "Implementation phase details", "Testing and debugging process"],
              "examples": ["Design pattern example", "Implementation step example", "Test case example"],
              "children": []
            }
          ]
        }
      ]
    },
    {
      "name": "3. Applications and Use Cases",
      "description": "Comprehensive coverage of real-world applications and practical use cases",
      "keyPoints": ["Industry-specific applications with details", "Real-world problem solving scenarios", "Case studies with complete analysis", "Performance metrics and benchmarks", "Scalability considerations", "Future trends and developments"],
      "examples": ["Enterprise application example", "Performance benchmark example", "Scalability case study"],
      "children": [
        {
          "name": "3.1 Industry Applications",
          "description": "Specific applications across different industries",
          "keyPoints": ["Web development applications", "Mobile app development", "Enterprise software solutions", "Data analysis and processing"],
          "examples": ["E-commerce platform example", "Mobile app feature example", "Enterprise dashboard example"],
          "children": [
            {
              "name": "3.1.1 Web Development",
              "keyPoints": ["Frontend implementation details", "Backend integration patterns", "Database interaction methods"],
              "examples": ["Frontend code example", "API integration example", "Database query example"],
              "children": []
            },
            {
              "name": "3.1.2 Mobile Development",
              "keyPoints": ["Platform-specific implementations", "Cross-platform solutions", "Performance optimization techniques"],
              "examples": ["Native implementation", "Cross-platform code", "Optimization example"],
              "children": []
            }
          ]
        }
      ]
    }
  ]
}

CRITICAL REQUIREMENTS FOR MAXIMUM DETAIL:
- Create EXTREMELY DEEP hierarchical structure with 4-5 levels of nesting
- Include COMPREHENSIVE theoretical concepts AND complete practical implementations
- In "examples" fields, include ACTUAL CODE SNIPPETS, complete functions, and real implementations
- Provide DETAILED descriptions for every node explaining the concept thoroughly
- Include EXTENSIVE keyPoints arrays with 5-7 detailed points per node
- Cover ALL major and minor topics with exhaustive detail
- Make it exam-focused with COMPLETE information students need
- Use NUMBERED TOPICS (1., 2., 3.) and DEEP SUBTOPIC numbering (1.1.1, 1.1.2, 1.2.1, etc.)
- Focus on COMPREHENSIVE TOPIC COVERAGE with maximum depth
- Include advantages, disadvantages, use cases, examples, and implementation details
- Provide step-by-step processes, complete code examples, and real-world applications
- Make every node information-rich with detailed explanations and multiple examples

${hasCodeContent ? 
  'SPECIAL FOCUS: Since this content contains code, ensure the mind map includes actual syntax examples, function definitions, variable declarations, and implementation patterns alongside theoretical concepts.' :
  'FOCUS: Create comprehensive coverage of all theoretical concepts, definitions, principles, and practical applications from the unit.'}

Analyze the COMPLETE content and create ONE EXTREMELY DETAILED unified mind map with MAXIMUM DEPTH and COMPREHENSIVE COVERAGE.
EXTRACT EVERY IMPORTANT DETAIL, CONCEPT, IMPLEMENTATION, AND EXAMPLE.${languageInstruction}
TEXT: "${textContent}"`;
    
    const rawResponse = await generateContent(prompt);
    return cleanAndParseJson(rawResponse);
  } catch (error) {
    console.error('Error in generateMindMap:', error);
    throw new Error('Failed to generate mind map: ' + error.message);
  }
};

export const extractTopics = async (textContent) => {
  const prompt = `
  Analyze the following text from a student's notes. Identify the top 5-7 most important, core concepts or topics. Rank them by importance from 1 (most important) to 7 (least important).
  Return ONLY a valid JSON object with a single key "topics". The value should be an array of objects, where each object has a "topic" (string) and "importance" (number) key.
  ---
  TEXT TO ANALYZE:
  "${textContent.substring(0, 2000)}"`;
  
  const rawResponse = await generateContent(prompt);
  try {
    return cleanAndParseJson(rawResponse);
  } catch (error) {
    console.error("Failed to parse topics JSON:", error);
    throw new Error("AI generated invalid topic format.");
  }
};

export const generateQuestionsForTopic = async (textContent, topic) => {
  const hasCodeContent = detectPracticalContent(textContent);
  
  if (hasCodeContent) {
    // Generate both theory and practical questions for the topic
    const theoryPrompt = `
      Generate 2 theoretical questions about "${topic}" (1-mark and 3-mark). Return ONLY valid JSON:
      [{"question": "Define ${topic}", "answer": "Clear definition", "marks": 1}, {"question": "Explain ${topic} with advantages", "answer": "Detailed explanation", "marks": 3}]
      Focus on concepts and definitions.
      TEXT: "${textContent.substring(0, 2000)}"`;
      
    const practicalPrompt = `
      Generate 1 practical question about "${topic}" (5-mark) with code examples. Return ONLY valid JSON:
      [{"question": "Implement ${topic} with complete code", "answer": "Full code implementation with explanation", "marks": 5}]
      Include implementation details and code snippets.
      TEXT: "${textContent.substring(0, 2000)}"`;
      
    const [theoryResponse, practicalResponse] = await Promise.all([
      generateContent(theoryPrompt),
      generateContent(practicalPrompt)
    ]);
    
    return {
      theory: cleanAndParseJson(theoryResponse),
      practical: cleanAndParseJson(practicalResponse)
    };
  } else {
    // Generate regular questions for non-code content
    const prompt = `
      Generate 3 exam questions about "${topic}". Return ONLY valid JSON:
      [{"question": "...", "answer": "...", "marks": 1}, {"question": "...", "answer": "...", "marks": 3}, {"question": "...", "answer": "...", "marks": 5}]
      TEXT: "${textContent.substring(0, 2000)}"`;
      
    const rawResponse = await generateContent(prompt);
    return cleanAndParseJson(rawResponse);
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

// Enhanced language detection for Hindi and Gujarati
const detectLanguage = (text) => {
  const languagePatterns = {
    hindi: /[\u0900-\u097F]+/g,
    gujarati: /[\u0A80-\u0AFF]+/g
  };
  
  const scores = {};
  for (const [lang, pattern] of Object.entries(languagePatterns)) {
    const matches = text.match(pattern);
    scores[lang] = matches ? matches.length : 0;
  }
  
  console.log('Language detection scores:', scores);
  const detectedLang = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
  const finalLang = scores[detectedLang] > 0 ? detectedLang : 'english';
  console.log('Detected language:', finalLang);
  return finalLang;
};

// Language-specific prompt helper
const getLanguageInstruction = (language) => {
  const instructions = {
    hindi: '\n\nमहत्वपूर्ण: सभी प्रश्न और उत्तर हिंदी भाषा में बनाएं। इनपुट कंटेंट की भाषा को बनाए रखें।',
    gujarati: '\n\nમહત્વપૂર્ણ: બધા પ્રશ્નો અને જવાબો ગુજરાતી ભાષામાં બનાવો। ઇનપુટ કન્ટેન્ટની ભાષા જાળવી રાખો।'
  };
  return instructions[language] || '';
};

export const generateFlashcards = async (textContent, existingCount = 0, type = null, existingQuestions = [], requestCount = null) => {
  console.log('=== FLASHCARD GENERATION DEBUG ===');
  console.log('Text content length:', textContent?.length || 0);
  console.log('First 200 chars of text:', textContent?.substring(0, 200) || 'No content');
  console.log('Text contains Gujarati chars:', /[\u0A80-\u0AFF]+/.test(textContent || ''));
  
  const hasCodeContent = detectPracticalContent(textContent);
  console.log('Generating flashcards - hasCodeContent:', hasCodeContent);
  
  try {
    if (hasCodeContent) {
      // Generate theory flashcards - focus on concepts, definitions, principles
      const cardCount = requestCount || 5;
      const avoidQuestions = existingQuestions.length > 0 ? `\nAVOID these existing questions: ${existingQuestions.slice(0, 10).join(', ')}` : '';
      
      // Detect language and adjust prompts accordingly
      const detectedLanguage = detectLanguage(textContent);
      console.log('Detected language:', detectedLanguage);
      
      const languageInstruction = getLanguageInstruction(detectedLanguage);
      
      const theoryPrompt = `Generate EXACTLY ${type === 'theory' ? cardCount : 5} theoretical flashcards based STRICTLY on the provided text content.

IMPORTANT RULES:
1. Use ONLY information from the provided text
2. Generate in the SAME LANGUAGE as the input text
3. Focus on definitions, concepts, and key points from the actual content
4. Do NOT create generic or external content

Return ONLY a JSON array:
[{"question": "What is [concept from text]?", "answer": "[Definition from text]\n\nKey Points:\n• Point 1 from text\n• Point 2 from text"}]

Focus on theoretical concepts from the provided content${avoidQuestions}${languageInstruction}

ACTUAL TEXT CONTENT: "${textContent.substring(0, 4000)}"`;

      // Generate practical flashcards - focus on implementation, syntax, examples
      const practicalPrompt = `Generate EXACTLY ${type === 'practical' ? cardCount : 5} practical flashcards based STRICTLY on the provided text content.

IMPORTANT RULES:
1. Use ONLY information from the provided text
2. Generate in the SAME LANGUAGE as the input text
3. Focus on procedures, methods, and practical applications from the actual content
4. Do NOT create generic or external content

Return ONLY a JSON array:
[{"question": "How to [process from text]?", "answer": "Steps from text:\n\n1. Step 1 from content\n2. Step 2 from content\n\nExample from text: [actual example]"}]

Focus on practical applications from the provided content${avoidQuestions}${languageInstruction}

ACTUAL TEXT CONTENT: "${textContent.substring(0, 4000)}"`;

      console.log('Generating flashcards - Type:', type, 'Count:', cardCount, 'Language:', detectedLanguage);
      
      if (type === 'theory') {
        const theoryResponse = await generateContent(theoryPrompt);
        const theoryCards = cleanAndParseJson(theoryResponse);
        const validTheoryCards = Array.isArray(theoryCards) ? theoryCards.filter(card => card.question && card.answer) : [];
        console.log(`Theory generation: requested ${cardCount}, got ${validTheoryCards.length}`);
        return { theory: validTheoryCards, practical: [] };
      } else if (type === 'practical') {
        const practicalResponse = await generateContent(practicalPrompt);
        const practicalCards = cleanAndParseJson(practicalResponse);
        const validPracticalCards = Array.isArray(practicalCards) ? practicalCards.filter(card => card.question && card.answer) : [];
        console.log(`Practical generation: requested ${cardCount}, got ${validPracticalCards.length}`);
        return { theory: [], practical: validPracticalCards };
      } else {
        const [theoryResponse, practicalResponse] = await Promise.all([
          generateContent(theoryPrompt),
          generateContent(practicalPrompt)
        ]);

        const theoryCards = cleanAndParseJson(theoryResponse);
        const practicalCards = cleanAndParseJson(practicalResponse);
        
        console.log('Theory cards generated:', Array.isArray(theoryCards) ? theoryCards.length : 0);
        console.log('Practical cards generated:', Array.isArray(practicalCards) ? practicalCards.length : 0);
        
        return {
          theory: Array.isArray(theoryCards) ? theoryCards : [],
          practical: Array.isArray(practicalCards) ? practicalCards : []
        };
      }
    } else {
      // Generate regular flashcards for non-code content - treat all languages the same
      const cardCount = requestCount || 10;
      const detectedLanguage = detectLanguage(textContent);
      const languageInstruction = getLanguageInstruction(detectedLanguage);
      
      const prompt = `Generate EXACTLY ${cardCount} flashcards based STRICTLY on the provided text content.

Return ONLY a JSON array with exactly ${cardCount} objects:
[{"question": "Question from the text", "answer": "Answer from the text"}]

Generate flashcards in the same language as the input text.${languageInstruction}

TEXT CONTENT: "${textContent.substring(0, 4000)}"`
      
      const rawResponse = await generateContent(prompt);
      const flashcards = cleanAndParseJson(rawResponse);
      
      // For non-code content, return as theory flashcards to match controller expectations
      const validFlashcards = Array.isArray(flashcards) ? flashcards : [];
      return {
        theory: validFlashcards,
        practical: [] // Keep empty for non-code content
      };
    }
  } catch (error) {
    console.error('Error in generateFlashcards:', error);
    throw new Error('Failed to generate flashcards: ' + error.message);
  }
};

export const generateQuiz = async (textContent, questionCount = 10) => {
  const hasCodeContent = detectPracticalContent(textContent);
  const detectedLanguage = detectLanguage(textContent);
  const languageInstruction = getLanguageInstruction(detectedLanguage);
  
  const prompt = `
  CRITICAL LANGUAGE REQUIREMENT: Generate ALL questions and options EXCLUSIVELY in ${detectedLanguage === 'gujarati' ? 'GUJARATI' : detectedLanguage === 'hindi' ? 'HINDI' : 'ENGLISH'} language ONLY.
  
  Create ${questionCount} FINAL EXAM LEVEL MCQ questions using BLOOM'S TAXONOMY.
  
  BLOOM'S TAXONOMY DISTRIBUTION:
  1. REMEMBER (20%): "What is...", "Define...", "List...", "Identify..."
  2. UNDERSTAND (25%): "Explain...", "Summarize...", "Compare...", "Describe..."
  3. APPLY (25%): "Apply...", "Solve...", "Use...", "Implement..."
  4. ANALYZE (15%): "Analyze...", "Break down...", "Examine...", "Why does..."
  5. EVALUATE (10%): "Evaluate...", "Judge...", "Critique...", "Which is better..."
  6. CREATE (5%): "Design...", "Create...", "Develop...", "Formulate..."
  
  QUESTION TYPES BY BLOOM LEVEL:
  - REMEMBER: Direct recall, definitions, facts
  - UNDERSTAND: Explanations, interpretations, examples
  - APPLY: Problem-solving, implementation, usage
  - ANALYZE: Comparisons, cause-effect, relationships
  - EVALUATE: Assessments, judgments, critiques
  - CREATE: Design solutions, formulate approaches
  
  RETURN ONLY valid JSON:
  {
    "mcqs": [
      {
        "question": "What is the primary purpose of [concept]?",
        "options": ["Correct definition", "Plausible alternative", "Common misconception", "Unrelated option"],
        "correctAnswer": "Correct definition",
        "bloomLevel": "Remember",
        "difficulty": "Easy"
      }
    ]
  }
  
  REQUIREMENTS:
  - Mix of direct questions, analytical questions, and application questions
  - Include some scenario-based questions but not all
  - Options must be realistic and educational
  - Vary difficulty: 30% Easy, 50% Medium, 20% Hard
  - Test different cognitive levels, not just memorization
  
  ${hasCodeContent ? 
    'INCLUDE: Code output questions, debugging questions, implementation questions, and theoretical programming concepts.' :
    'INCLUDE: Definitions, explanations, applications, comparisons, and analytical questions.'
  }
  
  TEXT: "${textContent.substring(0, 3000)}"${languageInstruction}`;
  
  const rawResponse = await generateContent(prompt);
  return cleanAndParseJson(rawResponse);
};