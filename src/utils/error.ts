import { ERROR_MESSAGES } from '../constants/financial';
import { ErrorType } from '../types';

/**
 * Custom error class with type for better error handling
 */
export class AppError extends Error {
  type: ErrorType;
  details?: any;
  
  constructor(message: string, type: ErrorType = 'UNKNOWN', details?: any) {
    super(message);
    this.type = type;
    this.details = details;
    this.name = 'AppError';
    
    // Ensure the stack trace is preserved
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
  
  /**
   * Helper method to get a standardized error message based on error type
   */
  static getErrorMessage(type: ErrorType): string {
    return ERROR_MESSAGES[type] || ERROR_MESSAGES.UNKNOWN;
  }
  
  /**
   * Convert API errors to AppError instances
   */
  static fromApiError(error: any): AppError {
    if (error.response) {
      // The request was made and the server responded with an error status
      const status = error.response.status;
      
      if (status === 401 || status === 403) {
        return new AppError(ERROR_MESSAGES.AUTHORIZATION, 'AUTHORIZATION', error.response.data);
      } else if (status === 404) {
        return new AppError(ERROR_MESSAGES.NOT_FOUND, 'NOT_FOUND', error.response.data);
      } else {
        return new AppError(ERROR_MESSAGES.API, 'API', {
          status,
          data: error.response.data
        });
      }
    } else if (error.request) {
      // The request was made but no response was received
      if (error.code === 'ECONNABORTED') {
        return new AppError(ERROR_MESSAGES.TIMEOUT, 'TIMEOUT', error.request);
      }
      return new AppError(ERROR_MESSAGES.NETWORK, 'NETWORK', error.request);
    }
    
    // Something happened in setting up the request
    return new AppError(ERROR_MESSAGES.UNKNOWN, 'UNKNOWN', error);
  }
}

export default AppError;
