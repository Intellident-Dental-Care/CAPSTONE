/**
 * Password Validation Module
 * Ensures passwords meet security requirements
 */

/**
 * Validates password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 * 
 * @param {string} password - The password to validate
 * @returns {object} - { isValid: boolean, errors: array, strength: string }
 */
const validatePassword = (password) => {
  const errors = [];
  let strengthScore = 0;

  // Check if password exists
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      errors: ['Password is required'],
      strength: 'invalid',
    };
  }

  // Check minimum length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else if (password.length >= 8 && password.length < 12) {
    strengthScore += 1;
  } else if (password.length >= 12) {
    strengthScore += 2;
  }

  // Check for uppercase letters
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least 1 uppercase letter (A-Z)');
  } else {
    strengthScore += 1;
  }

  // Check for lowercase letters
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least 1 lowercase letter (a-z)');
  } else {
    strengthScore += 1;
  }

  // Check for numbers
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least 1 number (0-9)');
  } else {
    strengthScore += 1;
  }

  // Check for special characters
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least 1 special character (!@#$%^&* etc.)');
  } else {
    strengthScore += 1;
  }

  // Check for common weak passwords
  const commonPasswords = [
    'password', 'password123', 'admin', 'admin123', '12345678',
    'qwerty', 'qwerty123', 'abc123', 'letmein', 'welcome',
    'monkey', 'dragon', 'master', 'sunshine', 'princess'
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a more unique password');
    strengthScore = Math.max(0, strengthScore - 2);
  }

  // Determine strength level
  let strength = 'invalid';
  if (errors.length === 0) {
    if (strengthScore >= 5) {
      strength = 'strong';
    } else if (strengthScore >= 3) {
      strength = 'medium';
    } else {
      strength = 'weak';
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    strengthScore: errors.length === 0 ? strengthScore : 0,
  };
};

/**
 * Validates that two passwords match
 * @param {string} password - The password
 * @param {string} confirmPassword - The confirmation password
 * @returns {object} - { isValid: boolean, message: string }
 */
const validatePasswordMatch = (password, confirmPassword) => {
  if (password !== confirmPassword) {
    return {
      isValid: false,
      message: 'Passwords do not match',
    };
  }

  return {
    isValid: true,
    message: 'Passwords match',
  };
};

/**
 * Validates password change (requires old password to be different from new)
 * @param {string} oldPassword - The old password
 * @param {string} newPassword - The new password
 * @returns {object} - { isValid: boolean, message: string }
 */
const validatePasswordChange = (oldPassword, newPassword) => {
  if (oldPassword === newPassword) {
    return {
      isValid: false,
      message: 'New password must be different from current password',
    };
  }

  return {
    isValid: true,
    message: 'Password change is valid',
  };
};

/**
 * Get password strength requirements text
 * @returns {string} - Formatted requirements text
 */
const getPasswordRequirements = () => {
  return `
Password must meet the following requirements:
- At least 8 characters long
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- At least 1 special character (!@#$%^&* etc.)
- Not a common password
  `.trim();
};

/**
 * Get password strength meter (1-5 scale)
 * @param {string} password - The password to evaluate
 * @returns {object} - { score: number, label: string, color: string }
 */
const getPasswordStrengthMeter = (password) => {
  const validation = validatePassword(password);

  const meters = {
    0: { score: 0, label: 'Invalid', color: '#d32f2f' },     // Red
    1: { score: 1, label: 'Very Weak', color: '#f57c00' },   // Deep Orange
    2: { score: 2, label: 'Weak', color: '#fbc02d' },         // Amber
    3: { score: 3, label: 'Fair', color: '#fdd835' },         // Yellow
    4: { score: 4, label: 'Good', color: '#9ccc65' },         // Light Green
    5: { score: 5, label: 'Strong', color: '#4caf50' },       // Green
  };

  const score = validation.isValid ? validation.strengthScore : 0;
  return {
    ...meters[Math.min(score, 5)],
    validation,
  };
};

/**
 * Format password error messages for display
 * @param {array} errors - Array of error messages
 * @returns {string} - Formatted error string
 */
const formatPasswordErrors = (errors) => {
  if (!Array.isArray(errors) || errors.length === 0) {
    return '';
  }

  return errors.map(error => `• ${error}`).join('\n');
};

module.exports = {
  validatePassword,
  validatePasswordMatch,
  validatePasswordChange,
  getPasswordRequirements,
  getPasswordStrengthMeter,
  formatPasswordErrors,
};
