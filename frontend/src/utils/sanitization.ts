/**
 * Utility functions for input sanitization and XSS prevention
 */

/**
 * Sanitizes text for logging to prevent log injection attacks
 */
export const sanitizeForLogging = (input: string): string => {
  if (!input) return '';
  return input
    .replace(/[\r\n]/g, ' ')
    .replace(/[\x00-\x1f\x7f-\x9f]/g, '')
    .substring(0, 1000);
};

/**
 * Sanitizes HTML content to prevent XSS attacks
 */
export const sanitizeHtml = (input: string): string => {
  if (!input) return '';
  
  // Use textContent to safely escape HTML
  const div = document.createElement('div');
  div.textContent = input;
  return div.textContent || '';
};

/**
 * Escapes HTML entities in text
 */
export const escapeHtml = (text: string): string => {
  if (!text) return '';
  
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
  };
  
  return text.replace(/[&<>"'\/]/g, (s) => map[s]);
};

/**
 * Validates and sanitizes file content
 */
export const sanitizeFileContent = (content: string): string => {
  if (!content) return '';
  
  // Escape all HTML to prevent XSS
  return escapeHtml(content).trim();
};

/**
 * Validates JSON structure for mind map data
 */
export const validateMindMapJson = (data: any): boolean => {
  if (!data || typeof data !== 'object') return false;
  
  const hasValidStructure = (node: any): boolean => {
    return (
      typeof node === 'object' &&
      typeof node.name === 'string' &&
      Array.isArray(node.children) &&
      node.children.every((child: any) => hasValidStructure(child))
    );
  };
  
  return hasValidStructure(data);
};