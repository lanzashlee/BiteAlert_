/**
 * Console security utilities
 * Removes sensitive information from console logs in production
 */

// Check if we're in production
const isProduction = process.env.NODE_ENV === 'production';

// Sensitive patterns to remove from logs
const sensitivePatterns = [
  /password/gi,
  /token/gi,
  /secret/gi,
  /key/gi,
  /auth/gi,
  /credential/gi,
  /session/gi,
  /cookie/gi,
  /bearer/gi,
  /jwt/gi,
  /api[_-]?key/gi,
  /private[_-]?key/gi,
  /access[_-]?token/gi,
  /refresh[_-]?token/gi
];

// Function to sanitize log data
const sanitizeLogData = (data) => {
  if (typeof data === 'string') {
    return sensitivePatterns.some(pattern => pattern.test(data)) ? '[REDACTED]' : data;
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      if (sensitivePatterns.some(pattern => pattern.test(key))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeLogData(value);
      } else if (typeof value === 'string' && sensitivePatterns.some(pattern => pattern.test(value))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
  
  return data;
};

// Secure console methods
export const secureConsole = {
  log: (...args) => {
    if (isProduction) {
      const sanitizedArgs = args.map(sanitizeLogData);
      console.log(...sanitizedArgs);
    } else {
      console.log(...args);
    }
  },
  
  error: (...args) => {
    if (isProduction) {
      const sanitizedArgs = args.map(sanitizeLogData);
      console.error(...sanitizedArgs);
    } else {
      console.error(...args);
    }
  },
  
  warn: (...args) => {
    if (isProduction) {
      const sanitizedArgs = args.map(sanitizeLogData);
      console.warn(...sanitizedArgs);
    } else {
      console.warn(...args);
    }
  },
  
  info: (...args) => {
    if (isProduction) {
      const sanitizedArgs = args.map(sanitizeLogData);
      console.info(...sanitizedArgs);
    } else {
      console.info(...args);
    }
  },
  
  debug: (...args) => {
    if (isProduction) {
      // Don't log debug messages in production
      return;
    } else {
      console.debug(...args);
    }
  }
};

// Replace console methods in production
if (isProduction) {
  // Override global console methods
  window.console = {
    ...console,
    log: secureConsole.log,
    error: secureConsole.error,
    warn: secureConsole.warn,
    info: secureConsole.info,
    debug: secureConsole.debug
  };
}

export default secureConsole;
