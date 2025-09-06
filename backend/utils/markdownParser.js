import { marked } from 'marked';
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

// This function will take raw markdown text from the AI
// and turn it into safe, displayable HTML.
export const parseAndSanitize = (markdownText) => {
  if (!markdownText) {
    return '';
  }
  // 1. Convert markdown to HTML
  const rawHtml = marked.parse(markdownText);
  // 2. Sanitize the HTML to prevent XSS attacks
  const sanitizedHtml = purify.sanitize(rawHtml);
  return sanitizedHtml;
};