import React from 'react';
import { escapeHtml } from './sanitization';

/**
 * Safe markdown formatter that avoids dangerouslySetInnerHTML
 */

interface FormattedTextProps {
  content: string;
  className?: string;
}

export const FormattedText: React.FC<FormattedTextProps> = ({ content, className = '' }) => {
  const formatContent = (text: string): React.ReactNode[] => {
    if (!text) return [];
    
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let key = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Handle headers
      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={key++} className="text-lg font-bold mt-4 mb-2 text-gray-900 dark:text-white border-b border-gray-300 dark:border-gray-600 pb-1">
            {formatInlineText(line.replace(/^## /, ''))}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={key++} className="text-base font-semibold mt-3 mb-2 text-gray-800 dark:text-gray-200">
            {formatInlineText(line.replace(/^### /, ''))}
          </h3>
        );
      } else if (line.startsWith('- ')) {
        // Handle bullet points
        const listItems: React.ReactNode[] = [];
        let j = i;
        while (j < lines.length && lines[j].startsWith('- ')) {
          listItems.push(
            <li key={key++} className="mb-1">
              {formatInlineText(lines[j].replace(/^- /, ''))}
            </li>
          );
          j++;
        }
        elements.push(
          <ul key={key++} className="list-disc pl-4 mb-3">
            {listItems}
          </ul>
        );
        i = j - 1;
      } else if (line.match(/^\d+\. /)) {
        // Handle numbered lists
        const listItems: React.ReactNode[] = [];
        let j = i;
        while (j < lines.length && lines[j].match(/^\d+\. /)) {
          listItems.push(
            <li key={key++} className="mb-1">
              {formatInlineText(lines[j].replace(/^\d+\. /, ''))}
            </li>
          );
          j++;
        }
        elements.push(
          <ol key={key++} className="list-decimal pl-4 mb-3">
            {listItems}
          </ol>
        );
        i = j - 1;
      } else if (line.trim() === '') {
        // Empty line - add spacing
        elements.push(<br key={key++} />);
      } else {
        // Regular paragraph
        elements.push(
          <p key={key++} className="mb-3">
            {formatInlineText(line)}
          </p>
        );
      }
    }
    
    return elements;
  };
  
  const formatInlineText = (text: string): React.ReactNode[] => {
    if (!text) return [];
    
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;
    
    while (remaining.length > 0) {
      // Find bold text
      const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
      if (boldMatch) {
        const beforeBold = remaining.substring(0, boldMatch.index);
        if (beforeBold) {
          parts.push(<span key={key++}>{escapeHtml(beforeBold)}</span>);
        }
        parts.push(
          <strong key={key++} className="font-bold text-gray-900 dark:text-white">
            {escapeHtml(boldMatch[1])}
          </strong>
        );
        remaining = remaining.substring((boldMatch.index || 0) + boldMatch[0].length);
        continue;
      }
      
      // Find italic text
      const italicMatch = remaining.match(/\*(.*?)\*/);
      if (italicMatch) {
        const beforeItalic = remaining.substring(0, italicMatch.index);
        if (beforeItalic) {
          parts.push(<span key={key++}>{escapeHtml(beforeItalic)}</span>);
        }
        parts.push(
          <em key={key++} className="italic">
            {escapeHtml(italicMatch[1])}
          </em>
        );
        remaining = remaining.substring((italicMatch.index || 0) + italicMatch[0].length);
        continue;
      }
      
      // No more formatting found
      parts.push(<span key={key++}>{escapeHtml(remaining)}</span>);
      break;
    }
    
    return parts;
  };
  
  return (
    <div className={`formatted-content ${className}`}>
      {formatContent(content)}
    </div>
  );
};

/**
 * Format summary content with proper styling
 */
export const FormattedSummary: React.FC<FormattedTextProps> = ({ content, className = '' }) => {
  return (
    <div className={`formatted-summary leading-8 text-base ${className}`}>
      <FormattedText content={content} />
    </div>
  );
};