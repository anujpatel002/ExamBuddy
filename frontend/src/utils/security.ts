/**
 * Comprehensive security utilities for input validation and sanitization
 */

/**
 * Validates and sanitizes user input to prevent injection attacks
 */
export const validateInput = (input: any, type: 'string' | 'number' | 'email' | 'url' = 'string'): boolean => {
  if (input === null || input === undefined) return false;
  
  switch (type) {
    case 'string':
      return typeof input === 'string' && input.trim().length > 0;
    case 'number':
      return typeof input === 'number' && !isNaN(input);
    case 'email':
      return typeof input === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
    case 'url':
      try {
        new URL(input);
        return true;
      } catch {
        return false;
      }
    default:
      return false;
  }
};

/**
 * Sanitizes text content for safe display
 */
export const sanitizeText = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Validates file upload security
 */
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif'
  ];
  
  const maxSize = 50 * 1024 * 1024; // 50MB
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size too large' };
  }
  
  return { valid: true };
};

/**
 * Validates JSON structure to prevent prototype pollution
 */
export const validateJsonStructure = (data: any, allowedKeys: string[]): boolean => {
  if (!data || typeof data !== 'object') return false;
  
  const keys = Object.keys(data);
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
  
  // Check for dangerous keys
  if (keys.some(key => dangerousKeys.includes(key))) {
    return false;
  }
  
  // Check if all keys are allowed
  return keys.every(key => allowedKeys.includes(key));
};

/**
 * Rate limiting helper for client-side
 */
export class ClientRateLimit {
  private requests: Map<string, number[]> = new Map();
  
  isAllowed(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }
}

/**
 * Content Security Policy helper
 */
export const generateCSPNonce = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Secure random string generator
 */
export const generateSecureId = (length: number = 16): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  
  return result;
};