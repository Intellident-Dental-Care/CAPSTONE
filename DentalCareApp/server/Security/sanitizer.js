/**
 * Input Sanitization Module
 * Prevents SQL injection, XSS, and other injection attacks
 */

/**
 * Sanitizes string input by escaping special characters
 * @param {string} input - The input to sanitize
 * @returns {string} - Sanitized string
 */
const sanitizeString = (input) => {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/\\/g, '\\\\')  // Escape backslashes
    .replace(/'/g, "''")      // Escape single quotes
    .replace(/"/g, '\\"')     // Escape double quotes
    .replace(/\0/g, '\\0')    // Escape null bytes
    .replace(/\n/g, '\\n')    // Escape newlines
    .replace(/\r/g, '\\r')    // Escape carriage returns
    .replace(/\x1a/g, '\\Z'); // Escape ctrl+Z
};

/**
 * Removes HTML/script tags and dangerous characters
 * @param {string} input - The input to clean
 * @returns {string} - Cleaned string
 */
const removeHtmlTags = (input) => {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')  // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .replace(/<.*?>/g, '')                                               // Remove all HTML tags
    .replace(/javascript:/gi, '')                                        // Remove javascript protocol
    .replace(/on\w+\s*=/gi, '');                                         // Remove event handlers
};

/**
 * Sanitizes email address
 * @param {string} email - The email to sanitize
 * @returns {string} - Sanitized email
 */
const sanitizeEmail = (email) => {
  if (typeof email !== 'string') {
    return '';
  }

  // Remove any HTML/script tags first
  let cleaned = removeHtmlTags(email);
  
  // Trim whitespace
  cleaned = cleaned.trim().toLowerCase();
  
  // Only allow valid email characters
  cleaned = cleaned.replace(/[^a-z0-9@._\-+]/g, '');
  
  return cleaned;
};

/**
 * Sanitizes phone number
 * @param {string} phone - The phone number to sanitize
 * @returns {string} - Sanitized phone number
 */
const sanitizePhone = (phone) => {
  if (typeof phone !== 'string') {
    return '';
  }

  // Remove all non-numeric characters
  return phone.replace(/[^0-9+\-() ]/g, '');
};

/**
 * Sanitizes general text input (names, descriptions, etc.)
 * @param {string} input - The input to sanitize
 * @returns {string} - Sanitized text
 */
const sanitizeText = (input) => {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove HTML tags
  let cleaned = removeHtmlTags(input);
  
  // Trim whitespace
  cleaned = cleaned.trim();
  
  // Remove control characters
  cleaned = cleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  
  return cleaned;
};

/**
 * Validates and sanitizes URL
 * @param {string} url - The URL to validate and sanitize
 * @returns {string|null} - Sanitized URL or null if invalid
 */
const sanitizeUrl = (url) => {
  if (typeof url !== 'string') {
    return null;
  }

  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return null;
    }
    return urlObj.toString();
  } catch (e) {
    return null;
  }
};

/**
 * Sanitizes numeric input
 * @param {*} input - The input to sanitize
 * @returns {number|null} - Sanitized number or null if invalid
 */
const sanitizeNumber = (input) => {
  const num = Number(input);
  return !isNaN(num) ? num : null;
};

/**
 * Sanitizes integer input
 * @param {*} input - The input to sanitize
 * @returns {number|null} - Sanitized integer or null if invalid
 */
const sanitizeInteger = (input) => {
  const num = parseInt(input, 10);
  return !isNaN(num) ? num : null;
};

/**
 * Sanitizes boolean input
 * @param {*} input - The input to sanitize
 * @returns {boolean} - Sanitized boolean
 */
const sanitizeBoolean = (input) => {
  return input === true || input === 'true' || input === 1 || input === '1';
};

/**
 * Sanitizes an object by sanitizing all string values
 * @param {object} obj - The object to sanitize
 * @param {boolean} deepClean - Whether to remove HTML tags
 * @returns {object} - Sanitized object
 */
const sanitizeObject = (obj, deepClean = true) => {
  if (!obj || typeof obj !== 'object') {
    return {};
  }

  const sanitized = {};
  const sanitizeFn = deepClean ? removeHtmlTags : sanitizeString;

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeFn(value);
    } else if (typeof value === 'number') {
      sanitized[key] = value;
    } else if (typeof value === 'boolean') {
      sanitized[key] = value;
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeFn(item) : item
      );
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value, deepClean);
    }
  }

  return sanitized;
};

/**
 * Validates against common SQL injection patterns
 * @param {string} input - The input to validate
 * @returns {boolean} - True if input appears safe, false if potentially malicious
 */
const checkForSqlInjection = (input) => {
  if (typeof input !== 'string') {
    return true;
  }

  const sqlPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|OR|AND)\b|--|;|\/\*|\*\/|xp_|sp_)/gi;
  return !sqlPattern.test(input);
};

/**
 * Validates against common XSS patterns
 * @param {string} input - The input to validate
 * @returns {boolean} - True if input appears safe, false if potentially malicious
 */
const checkForXSS = (input) => {
  if (typeof input !== 'string') {
    return true;
  }

  const xssPattern = /<script|javascript:|onerror=|onload=|onclick=|onmouseover=|onmouseenter=|<iframe|<img[^>]*on|eval\(|expression\(|<embed|<object|<link/gi;
  return !xssPattern.test(input);
};

module.exports = {
  sanitizeString,
  removeHtmlTags,
  sanitizeEmail,
  sanitizePhone,
  sanitizeText,
  sanitizeUrl,
  sanitizeNumber,
  sanitizeInteger,
  sanitizeBoolean,
  sanitizeObject,
  checkForSqlInjection,
  checkForXSS,
};
