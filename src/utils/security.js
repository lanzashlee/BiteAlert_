/**
 * Security utilities for the BiteAlert application
 * Implements security best practices and input validation
 */

// Input sanitization
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

// Validate email format
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number (Philippines format)
export const validatePhoneNumber = (phone) => {
  const phoneRegex = /^09\d{9}$/;
  return phoneRegex.test(phone);
};

// Validate password strength
export const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/(?=.*\d)/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  
  if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }
  
  return { valid: true, message: 'Password is strong' };
};

// Secure storage utilities
export const secureStorage = {
  setItem: (key, value) => {
    try {
      const sanitizedValue = typeof value === 'string' ? sanitizeInput(value) : value;
      localStorage.setItem(key, JSON.stringify(sanitizedValue));
    } catch (error) {
      console.error('Error storing data securely:', error);
    }
  },
  
  getItem: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error retrieving data securely:', error);
      return null;
    }
  },
  
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing data securely:', error);
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing storage securely:', error);
    }
  }
};

// XSS prevention for user-generated content
export const escapeHtml = (text) => {
  if (typeof text !== 'string') return text;
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

// CSRF token generation (for future use)
export const generateCSRFToken = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Rate limiting helper
export const rateLimit = (() => {
  const attempts = new Map();
  
  return (key, maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
    const now = Date.now();
    const userAttempts = attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const validAttempts = userAttempts.filter(time => now - time < windowMs);
    
    if (validAttempts.length >= maxAttempts) {
      return false; // Rate limit exceeded
    }
    
    validAttempts.push(now);
    attempts.set(key, validAttempts);
    return true; // Within rate limit
  };
})();

// Content Security Policy helper
export const validateCSP = (content) => {
  const dangerousPatterns = [
    /javascript:/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    /onload=/gi,
    /onerror=/gi,
    /onclick=/gi
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(content));
};

// Log security events (for monitoring)
export const logSecurityEvent = (event, details = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event,
    details,
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  // In production, this should be sent to a secure logging service
  console.warn('Security Event:', logEntry);
  
  // Store in session storage for debugging (remove in production)
  try {
    const existingLogs = JSON.parse(sessionStorage.getItem('securityLogs') || '[]');
    existingLogs.push(logEntry);
    // Keep only last 50 entries
    if (existingLogs.length > 50) {
      existingLogs.splice(0, existingLogs.length - 50);
    }
    sessionStorage.setItem('securityLogs', JSON.stringify(existingLogs));
  } catch (error) {
    console.error('Error logging security event:', error);
  }
};
