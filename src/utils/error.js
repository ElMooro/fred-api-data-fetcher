import { ERROR_MESSAGES } from '../constants/financial';

/**
 * Custom error class with type for better error handling
 */
export class AppError extends Error {
  constructor(message, type = 'UNKNOWN_ERROR') {
    super(message);
    this.name = 'AppError';
    this.type = type;
  }
  
  static getErrorMessage(code) {
    return ERROR_MESSAGES[code] || 'An unknown error occurred';
  }
}
