/**
 * Utility to detect and format code blocks in text content
 */

// Common programming language keywords and patterns - more specific
const CODE_PATTERNS = [
  // Function definitions with syntax
  /\b(function|def|class|interface|struct|enum)\s+\w+\s*[({]/gi,
  // Variable declarations with assignment or semicolon
  /\b(var|let|const|int|string|boolean|float|double|char)\s+\w+\s*[=;]/gi,
  // Control structures with parentheses
  /\b(if|else|for|while|switch|case|try|catch|finally)\s*\(/gi,
  // Multiple programming symbols in sequence
  /[{}();[\]].*[{}();[\]]/g,
  // Import/include statements with actual imports
  /\b(import|include|require)\s+[\w."']+/gi,
  // HTML/XML tags
  /<\/?[a-zA-Z][^>]*>/g,
  // CSS selectors and properties with proper syntax
  /[.#][\w-]+\s*{|[\w-]+\s*:\s*[^;]+;/g,
  // SQL keywords in context
  /\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|TABLE)\s+\w+/gi,
  // Code blocks with backticks
  /```[\s\S]*?```/g,
  /`[^`]+`/g,
];

// Language-specific patterns - only actual code syntax
const LANGUAGE_PATTERNS = {
  javascript: [
    /\b(console\.log|document\.|window\.|alert|prompt)\b/gi,
    /\b(async|await|Promise|setTimeout)\b/gi,
    /=>/g,
  ],
  python: [
    /\b(print|input|len|range|enumerate)\s*\(/gi,
    /\b(import|from|as|def|class|self)\b/gi,
    /__\w+__/g,
  ],
  java: [
    /\b(System\.out\.println|Scanner|ArrayList)\b/gi,
    /\b(public|private|protected|static)\s+(class|void|int|String)/gi,
    /\w+\s*\([^)]*\)\s*[{;]/g,
  ],
  html: [
    /<\/?[a-zA-Z][^>]*>/g,
    /&\w+;/g,
  ],
  css: [
    /[.#][\w-]+\s*{/g,
    /[\w-]+\s*:\s*[^;]+;/g,
    /@\w+/g,
  ],
  sql: [
    /\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|TABLE|JOIN|GROUP BY|ORDER BY)\b/gi,
  ],
};

/**
 * Detects if text contains code patterns
 */
export function containsCode(text: string, sectionType?: 'theory' | 'practical'): boolean {
  if (!text) return false;
  
  // If it's theory section, never treat as code
  if (sectionType === 'theory') {
    return false;
  }
  
  // Check for explicit code blocks
  if (text.includes('```') || text.match(/`[^`]+`/)) {
    return true;
  }
  
  // Strong code indicators - actual code syntax only
  const strongCodePatterns = [
    /\b(public|private|protected|static)\s+(class|void|int|String|boolean)/gi,
    /\b(System\.out\.println|Scanner|ArrayList|String\[\]\s+args)\b/gi,
    /\b(function|def|class|interface|struct|enum)\s+\w+\s*[({]/gi,
    /\b(import|include|require)\s+[\w."']+/gi,
    /[{}();[\]].*[{}();[\]]/g, // Multiple brackets/symbols
    /\w+\s*\([^)]*\)\s*[{;]/g, // Method calls with body
    /\b(int|String|boolean|float|double|char)\s+\w+\s*[=;]/gi // Variable declarations
  ];
  
  // Check for strong code patterns first
  let strongMatches = 0;
  strongCodePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      strongMatches += matches.length;
    }
  });
  
  // If we have strong code indicators, treat as code (but be more restrictive)
  if (strongMatches >= 4) {
    return true;
  }
  
  // Additional check: if text is just a question or answer mentioning programming terms, don't treat as code
  const questionAnswerPatterns = [
    /^\s*What\s+(is|are)\s+/i,
    /^\s*Define\s+/i,
    /^\s*Explain\s+/i,
    /^\s*Describe\s+/i,
    /^\s*List\s+/i,
    /^\s*Types?\s+of\s+/i,
    /^\s*Different\s+types?\s+of\s+/i,
    /\?\s*$/,
    /^\s*(Answer|Solution)\s*:?\s*/i,
  ];
  
  const isQuestionOrAnswer = questionAnswerPatterns.some(pattern => pattern.test(text.trim()));
  if (isQuestionOrAnswer && text.length < 500) {
    return false;
  }
  
  // Don't treat lists of program types as code
  const listPatterns = [
    /^\s*\d+[.):]\s*(Application|Console|Web|Desktop|Mobile|Standalone)/im,
    /^\s*[•\-*]\s*(Application|Console|Web|Desktop|Mobile|Standalone)/im,
    /\b(types?|kinds?|categories)\s+of\s+\w+\s+(programs?|applications?)/i,
  ];
  
  const isList = listPatterns.some(pattern => pattern.test(text));
  if (isList) {
    return false;
  }
  
  // Don't treat as code if it's primarily steps
  if (containsSteps(text)) {
    const lines = text.split('\n');
    const stepLines = lines.filter(line => 
      /^\s*\d+[.):]\s+/.test(line) || 
      /^\s*Step\s*\d+/i.test(line) || 
      /^\s*\(\d+\)\s+/.test(line)
    ).length;
    
    // If more than 50% of lines are steps, don't treat as code
    if (stepLines / lines.length > 0.5) {
      return false;
    }
  }
  
  const lines = text.split('\n');
  const lineCount = lines.length;
  
  // For multi-line content, use existing logic
  let codeScore = 0;
  let codeLines = 0;
  
  lines.forEach(line => {
    CODE_PATTERNS.forEach(pattern => {
      if (pattern.test(line)) {
        codeLines++;
        return;
      }
    });
  });
  
  // Calculate code density (percentage of lines with code patterns)
  const codeDensity = codeLines / lineCount;
  
  // Count total matches for scoring
  CODE_PATTERNS.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      codeScore += matches.length;
    }
  });
  
  // Check language-specific patterns
  Object.values(LANGUAGE_PATTERNS).forEach(patterns => {
    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        codeScore += matches.length * 2;
      }
    });
  });
  
  // Multi-line content needs higher code density or score
  return codeDensity >= 0.5 || codeScore >= 8;
}

/**
 * Detects if text contains numbered steps
 */
export function containsSteps(text: string): boolean {
  if (!text) return false;
  
  const stepPatterns = [
    /^\s*\d+[.):]\s+/gm,  // 1. or 1) or 1:
    /^\s*Step\s*\d+[.):]?\s*/gmi,  // Step 1 or Step 1.
    /^\s*\(\d+\)\s+/gm,  // (1)
  ];
  
  return stepPatterns.some(pattern => {
    const matches = text.match(pattern);
    return matches && matches.length >= 2;
  });
}

/**
 * Formats numbered steps with proper line breaks
 */
function formatSteps(text: string): string {
  let formattedText = text;
  
  // Format numbered steps (1., 2., etc.)
  formattedText = formattedText.replace(/(\d+[.):])\s*/g, '<br><strong>$1</strong> ');
  
  // Format Step 1, Step 2, etc.
  formattedText = formattedText.replace(/(Step\s*\d+[.):]*\s*)/gi, '<br><strong>$1</strong>');
  
  // Format (1), (2), etc.
  formattedText = formattedText.replace(/(\(\d+\))\s*/g, '<br><strong>$1</strong> ');
  
  // Remove leading <br> if it exists
  formattedText = formattedText.replace(/^<br>/, '');
  
  return formattedText;
}

/**
 * Formats text with proper code highlighting and step formatting
 */
export function formatCodeContent(text: string, sectionType?: 'theory' | 'practical'): string {
  if (!text) return text;
  
  let formattedText = text;
  
  // Check for steps first (before code formatting)
  const hasSteps = containsSteps(text);
  const hasCode = containsCode(text, sectionType);
  
  // If it has steps but not significant code, format as steps
  if (hasSteps && !hasCode) {
    return `<div class="step-content">${formatSteps(formattedText)}</div>`;
  }
  
  // Format existing code blocks
  formattedText = formattedText.replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
    const language = lang || 'text';
    return `<pre class="code-block" data-language="${language}"><code class="language-${language}">${escapeHtml(code.trim())}</code></pre>`;
  });
  
  // Format inline code
  formattedText = formattedText.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  
  // If no explicit code blocks but contains code patterns, decide formatting based on content
  if (!text.includes('```') && !text.includes('`') && hasCode) {
    const lines = text.split('\n');
    const lineCount = lines.length;
    
    // Always use code block formatting for detected code to preserve spacing
    const detectedLanguage = detectLanguage(text);
    
    // Format the text to add proper line breaks for Java code
    let codeText = text;
    
    // Add line breaks after common Java patterns
    codeText = codeText.replace(/;\s*/g, ';\n');
    codeText = codeText.replace(/\{\s*/g, ' {\n');
    codeText = codeText.replace(/\}\s*/g, '\n}\n');
    codeText = codeText.replace(/\)\s*\{/g, ') {\n');
    codeText = codeText.replace(/class\s+(\w+)/gi, 'class $1');
    codeText = codeText.replace(/extends\s+(\w+)/gi, 'extends $1');
    
    // Clean up excessive newlines
    codeText = codeText.replace(/\n\s*\n\s*\n/g, '\n\n');
    codeText = codeText.trim();
    
    formattedText = `<pre class="code-block auto-detected" data-language="${detectedLanguage}"><code class="language-${detectedLanguage}">${escapeHtml(codeText)}</code></pre>`;
  }
  
  // If it has both steps and code, format steps in the final output
  if (hasSteps && hasCode) {
    formattedText = `<div class="step-content">${formatSteps(formattedText)}</div>`;
  }
  
  return formattedText;
}

/**
 * Detects the programming language from text content
 */
function detectLanguage(text: string): string {
  const scores: Record<string, number> = {};
  
  Object.entries(LANGUAGE_PATTERNS).forEach(([lang, patterns]) => {
    scores[lang] = 0;
    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        scores[lang] += matches.length;
      }
    });
  });
  
  // Return language with highest score, or 'text' if no clear winner
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return 'text';
  
  return Object.entries(scores).find(([, score]) => score === maxScore)?.[0] || 'text';
}

/**
 * Escapes HTML characters
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Gets CSS classes for code formatting
 */
export function getCodeStyles(): string {
  return `
    .code-block {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 16px;
      margin: 12px 0;
      overflow-x: auto;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 14px;
      line-height: 1.5;
      position: relative;
    }
    
    .dark .code-block {
      background: #1e1e1e;
      border-color: #404040;
      color: #d4d4d4;
    }
    
    .code-block::before {
      content: attr(data-language);
      position: absolute;
      top: 8px;
      right: 12px;
      font-size: 10px;
      text-transform: uppercase;
      color: #6c757d;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    
    .code-block.auto-detected::before {
      content: "code";
    }
    
    .inline-code {
      background: #f1f3f4;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 0.9em;
      color: #d63384;
    }
    
    .dark .inline-code {
      background: #2d2d2d;
      color: #ff6b9d;
    }
    
    .code-block code {
      background: none;
      padding: 0;
      border: none;
      color: inherit;
    }
    
    /* Language-specific syntax highlighting */
    .language-javascript .keyword,
    .language-js .keyword {
      color: #0066cc;
    }
    
    .language-python .keyword {
      color: #ff7700;
    }
    
    .language-java .keyword {
      color: #7c4dff;
    }
    
    .language-html .tag {
      color: #e91e63;
    }
    
    .language-css .property {
      color: #2196f3;
    }
    
    .dark .language-javascript .keyword,
    .dark .language-js .keyword {
      color: #569cd6;
    }
    
    .dark .language-python .keyword {
      color: #ff9800;
    }
    
    .dark .language-java .keyword {
      color: #bb86fc;
    }
    
    .dark .language-html .tag {
      color: #f48fb1;
    }
    
    .dark .language-css .property {
      color: #64b5f6;
    }
    
    /* Custom scrollbar styles */
    .scrollbar-thin {
      scrollbar-width: thin;
    }
    
    .scrollbar-thin::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    
    .scrollbar-thumb-gray-300::-webkit-scrollbar-thumb {
      background-color: #d1d5db;
      border-radius: 3px;
    }
    
    .dark .scrollbar-thumb-gray-600::-webkit-scrollbar-thumb {
      background-color: #4b5563;
      border-radius: 3px;
    }
    
    .scrollbar-track-transparent::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .scrollbar-thin::-webkit-scrollbar-thumb:hover {
      background-color: #9ca3af;
    }
    
    .dark .scrollbar-thin::-webkit-scrollbar-thumb:hover {
      background-color: #6b7280;
    }
    
    /* Step formatting styles */
    .step-content {
      line-height: 1.8;
    }
    
    .step-content strong {
      color: #2563eb;
      font-weight: 600;
      margin-right: 8px;
    }
    
    .dark .step-content strong {
      color: #60a5fa;
    }
    
    .step-content br {
      margin-bottom: 8px;
    }
  `;
}