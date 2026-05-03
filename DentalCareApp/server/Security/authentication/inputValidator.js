/**
 * Authentication Input Validation Module
 * Validates and sanitizes all authentication-related inputs
 */

const { sanitizeEmail, sanitizeText, sanitizeString, checkForSqlInjection, checkForXSS } = require('../sanitizer');
const { validatePassword, validatePasswordMatch } = require('./passwordValidator');

/**
 * Validates signup input
 * @param {object} input - { email, password, confirmPassword, fullName }
 * @returns {object} - { isValid: boolean, errors: array, sanitized: object }
 */
const validateSignupInput = (input) => {
  const errors = [];
  const sanitized = {};

  // Validate and sanitize email
  if (!input.email || typeof input.email !== 'string') {
    errors.push('Email is required');
  } else {
    const cleanEmail = sanitizeEmail(input.email);
    
    if (!cleanEmail) {
      errors.push('Email format is invalid');
    } else if (!isValidEmail(cleanEmail)) {
      errors.push('Please enter a valid email address');
    } else if (!checkForSqlInjection(input.email)) {
      errors.push('Email contains suspicious characters');
    } else if (!checkForXSS(input.email)) {
      errors.push('Email contains potentially dangerous characters');
    } else {
      sanitized.email = cleanEmail;
    }
  }

  // Validate and sanitize full name
  if (!input.fullName || typeof input.fullName !== 'string') {
    errors.push('Full name is required');
  } else {
    const cleanName = sanitizeText(input.fullName);
    
    if (cleanName.length < 2) {
      errors.push('Full name must be at least 2 characters long');
    } else if (cleanName.length > 100) {
      errors.push('Full name cannot exceed 100 characters');
    } else if (!checkForSqlInjection(input.fullName)) {
      errors.push('Full name contains suspicious characters');
    } else if (!checkForXSS(input.fullName)) {
      errors.push('Full name contains potentially dangerous characters');
    } else {
      sanitized.fullName = cleanName;
    }
  }

  // Validate password
  if (!input.password) {
    errors.push('Password is required');
  } else {
    const passwordValidation = validatePassword(input.password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    } else {
      sanitized.password = input.password; // Don't sanitize password, keep as is
    }
  }

  // Validate confirm password
  if (!input.confirmPassword) {
    errors.push('Please confirm your password');
  } else {
    const matchValidation = validatePasswordMatch(input.password, input.confirmPassword);
    if (!matchValidation.isValid) {
      errors.push(matchValidation.message);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : {},
  };
};

/**
 * Validates login input
 * @param {object} input - { email, password }
 * @returns {object} - { isValid: boolean, errors: array, sanitized: object }
 */
const validateLoginInput = (input) => {
  const errors = [];
  const sanitized = {};

  // Validate and sanitize email
  if (!input.email || typeof input.email !== 'string') {
    errors.push('Email is required');
  } else {
    const cleanEmail = sanitizeEmail(input.email);
    
    if (!cleanEmail) {
      errors.push('Email format is invalid');
    } else if (!isValidEmail(cleanEmail)) {
      errors.push('Invalid email address');
    } else if (!checkForSqlInjection(input.email)) {
      errors.push('Email contains suspicious characters');
    } else {
      sanitized.email = cleanEmail;
    }
  }

  // Validate password
  if (!input.password || typeof input.password !== 'string') {
    errors.push('Password is required');
  } else if (input.password.length < 8) {
    errors.push('Invalid email or password');
  } else {
    sanitized.password = input.password;
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : {},
  };
};

/**
 * Validates password reset input
 * @param {object} input - { email, oldPassword, newPassword, confirmPassword }
 * @returns {object} - { isValid: boolean, errors: array, sanitized: object }
 */
const validatePasswordResetInput = (input) => {
  const errors = [];
  const sanitized = {};

  // Validate email
  if (input.email) {
    const cleanEmail = sanitizeEmail(input.email);
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      errors.push('Invalid email address');
    } else {
      sanitized.email = cleanEmail;
    }
  }

  // Validate old password (if provided)
  if (input.oldPassword && input.oldPassword.length < 8) {
    errors.push('Old password is incorrect');
  } else if (input.oldPassword) {
    sanitized.oldPassword = input.oldPassword;
  }

  // Validate new password
  if (!input.newPassword) {
    errors.push('New password is required');
  } else {
    const passwordValidation = validatePassword(input.newPassword);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    } else {
      sanitized.newPassword = input.newPassword;
    }
  }

  // Validate confirm password
  if (input.newPassword && input.confirmPassword) {
    const matchValidation = validatePasswordMatch(input.newPassword, input.confirmPassword);
    if (!matchValidation.isValid) {
      errors.push(matchValidation.message);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : {},
  };
};

/**
 * Validates OTP input
 * @param {object} input - { email, otp }
 * @returns {object} - { isValid: boolean, errors: array, sanitized: object }
 */
const validateOtpInput = (input) => {
  const errors = [];
  const sanitized = {};

  // Validate email
  if (!input.email || typeof input.email !== 'string') {
    errors.push('Email is required');
  } else {
    const cleanEmail = sanitizeEmail(input.email);
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      errors.push('Invalid email address');
    } else {
      sanitized.email = cleanEmail;
    }
  }

  // Validate OTP
  if (!input.otp || typeof input.otp !== 'string') {
    errors.push('OTP is required');
  } else {
    const cleanOtp = input.otp.trim().replace(/[^0-9]/g, '');
    if (cleanOtp.length !== 6) {
      errors.push('OTP must be 6 digits');
    } else {
      sanitized.otp = cleanOtp;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : {},
  };
};

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates profile update input
 * @param {object} input - Profile fields to validate
 * @returns {object} - { isValid: boolean, errors: array, sanitized: object }
 */
const validateProfileUpdateInput = (input) => {
  const errors = [];
  const sanitized = {};

  // Validate full name if provided
  if (input.fullName) {
    const cleanName = sanitizeText(input.fullName);
    if (cleanName.length < 2) {
      errors.push('Full name must be at least 2 characters');
    } else if (cleanName.length > 100) {
      errors.push('Full name cannot exceed 100 characters');
    } else {
      sanitized.fullName = cleanName;
    }
  }

  // Validate phone if provided
  if (input.phone) {
    const cleanPhone = input.phone.replace(/[^0-9+\-() ]/g, '');
    if (cleanPhone.length < 7 || cleanPhone.length > 20) {
      errors.push('Phone number format is invalid');
    } else {
      sanitized.phone = cleanPhone;
    }
  }

  // Validate bio if provided
  if (input.bio) {
    const cleanBio = sanitizeText(input.bio);
    if (cleanBio.length > 500) {
      errors.push('Bio cannot exceed 500 characters');
    } else {
      sanitized.bio = cleanBio;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : {},
  };
};

module.exports = {
  validateSignupInput,
  validateLoginInput,
  validatePasswordResetInput,
  validateOtpInput,
  validateProfileUpdateInput,
  isValidEmail,
};
