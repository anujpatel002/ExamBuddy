import { marked } from 'marked';
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

export const parseAndSanitize = (markdownText) => {
  if (!markdownText) {
    return '';
  }
  const rawHtml = marked.parse(markdownText);
  const sanitizedHtml = purify.sanitize(rawHtml);
  return sanitizedHtml;
};