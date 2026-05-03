/**
 * Pre-Assessment Input Sanitization Module
 * Validates and sanitizes all pre-assessment form inputs
 */

const { sanitizeText, sanitizeInteger, checkForSqlInjection, checkForXSS } = require('../sanitizer');

/**
 * Validates questionnaire answer input
 * @param {object} input - { questionId, answer, answerType }
 * @returns {object} - { isValid: boolean, errors: array, sanitized: object }
 */
const validateQuestionnaireAnswer = (input) => {
  const errors = [];
  const sanitized = {};

  // Validate question ID
  if (!input.questionId) {
    errors.push('Question ID is required');
  } else {
    const cleanId = sanitizeInteger(input.questionId);
    if (cleanId === null) {
      errors.push('Invalid question ID');
    } else {
      sanitized.questionId = cleanId;
    }
  }

  // Validate answer based on type
  if (!input.answer && input.answer !== 0 && input.answer !== false) {
    errors.push('Answer is required');
    return { isValid: false, errors, sanitized: {} };
  }

  switch (input.answerType) {
    case 'text':
      sanitized.answer = validateTextAnswer(input.answer, errors);
      break;
    case 'multiline':
      sanitized.answer = validateMultilineAnswer(input.answer, errors);
      break;
    case 'option':
      sanitized.answer = validateOptionAnswer(input.answer, errors);
      break;
    case 'boolean':
      sanitized.answer = validateBooleanAnswer(input.answer, errors);
      break;
    case 'number':
      sanitized.answer = validateNumberAnswer(input.answer, errors);
      break;
    case 'rating':
      sanitized.answer = validateRatingAnswer(input.answer, errors);
      break;
    case 'multiple':
      sanitized.answer = validateMultipleAnswer(input.answer, errors);
      break;
    default:
      errors.push('Invalid answer type');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : {},
  };
};

/**
 * Validates text answer
 * @param {*} answer - The answer value
 * @param {array} errors - Error array to populate
 * @returns {string} - Sanitized answer
 */
const validateTextAnswer = (answer, errors) => {
  if (typeof answer !== 'string') {
    errors.push('Answer must be text');
    return '';
  }

  const cleaned = sanitizeText(answer);

  if (cleaned.length === 0) {
    errors.push('Answer cannot be empty');
    return '';
  }

  if (cleaned.length > 200) {
    errors.push('Answer cannot exceed 200 characters');
    return '';
  }

  if (!checkForSqlInjection(answer)) {
    errors.push('Answer contains suspicious characters');
    return '';
  }

  if (!checkForXSS(answer)) {
    errors.push('Answer contains potentially dangerous characters');
    return '';
  }

  return cleaned;
};

/**
 * Validates multiline answer
 * @param {*} answer - The answer value
 * @param {array} errors - Error array to populate
 * @returns {string} - Sanitized answer
 */
const validateMultilineAnswer = (answer, errors) => {
  if (typeof answer !== 'string') {
    errors.push('Answer must be text');
    return '';
  }

  const cleaned = sanitizeText(answer);

  if (cleaned.length === 0) {
    errors.push('Answer cannot be empty');
    return '';
  }

  if (cleaned.length > 1000) {
    errors.push('Answer cannot exceed 1000 characters');
    return '';
  }

  if (!checkForSqlInjection(answer)) {
    errors.push('Answer contains suspicious characters');
    return '';
  }

  if (!checkForXSS(answer)) {
    errors.push('Answer contains potentially dangerous characters');
    return '';
  }

  return cleaned;
};

/**
 * Validates option answer (single choice)
 * @param {*} answer - The answer value
 * @param {array} errors - Error array to populate
 * @returns {string} - Sanitized answer
 */
const validateOptionAnswer = (answer, errors) => {
  if (typeof answer !== 'string') {
    errors.push('Answer must be a valid option');
    return '';
  }

  const cleaned = sanitizeText(answer);

  if (cleaned.length === 0) {
    errors.push('Please select an option');
    return '';
  }

  if (!checkForSqlInjection(answer)) {
    errors.push('Answer contains suspicious characters');
    return '';
  }

  return cleaned;
};

/**
 * Validates boolean answer
 * @param {*} answer - The answer value
 * @param {array} errors - Error array to populate
 * @returns {boolean} - Sanitized answer
 */
const validateBooleanAnswer = (answer, errors) => {
  if (typeof answer !== 'boolean') {
    errors.push('Answer must be true or false');
    return false;
  }

  return answer;
};

/**
 * Validates numeric answer
 * @param {*} answer - The answer value
 * @param {array} errors - Error array to populate
 * @returns {number} - Sanitized answer
 */
const validateNumberAnswer = (answer, errors) => {
  const num = Number(answer);

  if (isNaN(num)) {
    errors.push('Answer must be a valid number');
    return 0;
  }

  if (num < 0) {
    errors.push('Answer must be a positive number');
    return 0;
  }

  return num;
};

/**
 * Validates rating answer (1-5 or similar scale)
 * @param {*} answer - The answer value
 * @param {array} errors - Error array to populate
 * @returns {number} - Sanitized answer
 */
const validateRatingAnswer = (answer, errors) => {
  const num = Number(answer);

  if (isNaN(num)) {
    errors.push('Rating must be a valid number');
    return 0;
  }

  if (num < 1 || num > 5) {
    errors.push('Rating must be between 1 and 5');
    return 0;
  }

  return Math.round(num);
};

/**
 * Validates multiple choice answer (array of options)
 * @param {*} answer - The answer value
 * @param {array} errors - Error array to populate
 * @returns {array} - Sanitized answers
 */
const validateMultipleAnswer = (answer, errors) => {
  if (!Array.isArray(answer)) {
    errors.push('Answer must be an array of options');
    return [];
  }

  if (answer.length === 0) {
    errors.push('Please select at least one option');
    return [];
  }

  const sanitized = answer.map(item => {
    if (typeof item !== 'string') {
      return '';
    }
    return sanitizeText(item);
  }).filter(item => {
    if (!checkForSqlInjection(item)) {
      errors.push('One or more answers contain suspicious characters');
      return false;
    }
    return item.length > 0;
  });

  if (sanitized.length === 0) {
    errors.push('No valid options selected');
    return [];
  }

  return sanitized;
};

/**
 * Validates complete pre-assessment submission
 * @param {array} answers - Array of answers: { questionId, answer, answerType }
 * @returns {object} - { isValid: boolean, errors: array, sanitized: array }
 */
const validatePreAssessmentSubmission = (answers) => {
  const errors = [];
  const sanitized = [];

  if (!Array.isArray(answers)) {
    return {
      isValid: false,
      errors: ['Answers must be an array'],
      sanitized: [],
    };
  }

  if (answers.length === 0) {
    return {
      isValid: false,
      errors: ['At least one answer is required'],
      sanitized: [],
    };
  }

  answers.forEach((answerObj, index) => {
    const validation = validateQuestionnaireAnswer(answerObj);
    
    if (!validation.isValid) {
      errors.push(...validation.errors.map(err => `Question ${index + 1}: ${err}`));
    } else {
      sanitized.push(validation.sanitized);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : [],
  };
};

/**
 * Validates medical history input
 * @param {object} input - Medical history object
 * @returns {object} - { isValid: boolean, errors: array, sanitized: object }
 */
const validateMedicalHistory = (input) => {
  const errors = [];
  const sanitized = {};

  const fields = [
    { key: 'allergies', maxLength: 500 },
    { key: 'medications', maxLength: 500 },
    { key: 'surgeries', maxLength: 500 },
    { key: 'dentalHistory', maxLength: 1000 },
    { key: 'otherConditions', maxLength: 1000 },
  ];

  fields.forEach(field => {
    if (input[field.key]) {
      const cleaned = sanitizeText(input[field.key]);

      if (cleaned.length > field.maxLength) {
        errors.push(`${field.key} cannot exceed ${field.maxLength} characters`);
      } else if (!checkForSqlInjection(input[field.key])) {
        errors.push(`${field.key} contains suspicious characters`);
      } else if (!checkForXSS(input[field.key])) {
        errors.push(`${field.key} contains potentially dangerous characters`);
      } else {
        sanitized[field.key] = cleaned;
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : {},
  };
};

/**
 * Validates symptom description input
 * @param {string} symptoms - Symptom description
 * @returns {object} - { isValid: boolean, errors: array, sanitized: string }
 */
const validateSymptomDescription = (symptoms) => {
  const errors = [];
  const sanitized = sanitizeText(symptoms);

  if (!sanitized || sanitized.length === 0) {
    errors.push('Symptom description is required');
  } else if (sanitized.length < 10) {
    errors.push('Please provide more detail about your symptoms');
  } else if (sanitized.length > 2000) {
    errors.push('Symptom description cannot exceed 2000 characters');
  } else if (!checkForSqlInjection(symptoms)) {
    errors.push('Description contains suspicious characters');
  } else if (!checkForXSS(symptoms)) {
    errors.push('Description contains potentially dangerous characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : '',
  };
};

module.exports = {
  validateQuestionnaireAnswer,
  validatePreAssessmentSubmission,
  validateMedicalHistory,
  validateSymptomDescription,
};
