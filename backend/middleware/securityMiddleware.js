/**
 * Security middleware for protecting against common vulnerabilities
 */

/**
 * Input validation middleware
 */
export const validateInput = (req, res, next) => {
  // Validate that request body doesn't contain dangerous properties
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
  
  const checkObject = (obj, path = '') => {
    if (!obj || typeof obj !== 'object') return;
    
    for (const key in obj) {
      if (dangerousKeys.includes(key)) {
        return res.status(400).json({ 
          message: `Invalid property: ${path}${key}` 
        });
      }
      
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        checkObject(obj[key], `${path}${key}.`);
      }
    }
  };
  
  if (req.body) {
    checkObject(req.body);
  }
  
  next();
};

/**
 * Sanitize log data to prevent log injection
 */
export const sanitizeLogData = (data) => {
  if (typeof data !== 'string') {
    data = JSON.stringify(data);
  }
  
  return data
    .replace(/[\r\n]/g, ' ')
    .replace(/[\x00-\x1f\x7f-\x9f]/g, '')
    .substring(0, 1000);
};

/**
 * Type validation middleware
 */
export const validateTypes = (schema) => {
  return (req, res, next) => {
    for (const [field, expectedType] of Object.entries(schema)) {
      const value = req.body[field];
      
      if (value !== undefined) {
        switch (expectedType) {
          case 'string':
            if (typeof value !== 'string') {
              return res.status(400).json({ 
                message: `${field} must be a string` 
              });
            }
            break;
          case 'number':
            if (typeof value !== 'number' || isNaN(value)) {
              return res.status(400).json({ 
                message: `${field} must be a number` 
              });
            }
            break;
          case 'email':
            if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
              return res.status(400).json({ 
                message: `${field} must be a valid email` 
              });
            }
            break;
          case 'array':
            if (!Array.isArray(value)) {
              return res.status(400).json({ 
                message: `${field} must be an array` 
              });
            }
            break;
        }
      }
    }
    next();
  };
};

/**
 * File upload security validation
 */
export const validateFileUpload = (req, res, next) => {
  if (!req.file && !req.files) {
    return next();
  }
  
  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif'
  ];
  
  const maxSize = 50 * 1024 * 1024; // 50MB
  
  const validateFile = (file) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return { valid: false, error: 'File type not allowed' };
    }
    
    if (file.size > maxSize) {
      return { valid: false, error: 'File size too large' };
    }
    
    // Check for suspicious file names
    if (/[<>:"/\\|?*]/.test(file.originalname)) {
      return { valid: false, error: 'Invalid file name' };
    }
    
    return { valid: true };
  };
  
  if (req.file) {
    const validation = validateFile(req.file);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.error });
    }
  }
  
  if (req.files) {
    for (const file of req.files) {
      const validation = validateFile(file);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.error });
      }
    }
  }
  
  next();
};

/**
 * Request size limiter
 */
export const limitRequestSize = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('content-length') || '0');
    const maxBytes = typeof maxSize === 'string' 
      ? parseInt(maxSize) * 1024 * 1024 
      : maxSize;
    
    if (contentLength > maxBytes) {
      return res.status(413).json({ 
        message: 'Request entity too large' 
      });
    }
    
    next();
  };
};

/**
 * SQL injection prevention for MongoDB queries
 */
export const sanitizeQuery = (req, res, next) => {
  const sanitize = (obj) => {
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          // Remove potential NoSQL injection patterns
          obj[key] = obj[key].replace(/[${}]/g, '');
        } else if (typeof obj[key] === 'object') {
          sanitize(obj[key]);
        }
      }
    }
  };
  
  if (req.query) sanitize(req.query);
  if (req.body) sanitize(req.body);
  if (req.params) sanitize(req.params);
  
  next();
};