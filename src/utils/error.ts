/**
 * Application error handling
 */

// Add import statement to make this a proper module
import { ErrorType } from '../types';

const ERROR_MESSAGES = {
  Network: 'Network error occurred. Please check your internet connection.',
  Api: 'API request failed. Please try again later.',
  Authorization: 'You do not have permission to access this resource.',
  NotFound: 'The requested resource was not found.',
  Timeout: 'Request timed out. Please try again later.',
  Unknown: 'An unexpected error occurred. Please try again.'
};

export class AppError extends Error {
  type: ErrorType;
  details?: any;
  
  constructor(message: string, type: ErrorType = 'Unknown', details?: any) {
    super(message);
    this.type = type;
    this.details = details;
    this.name = 'AppError';
    
    // This is needed to make instanceof work correctly in TypeScript
    Object.setPrototypeOf(this, AppError.prototype);
  }
  
  /**
   * Get a user-friendly error message based on the error type
   */
  static getErrorMessage(type: ErrorType): string {
    return ERROR_MESSAGES[type] || ERROR_MESSAGES.Unknown;
  }
  
  /**
   * Convert an Axios error to an AppError
   */
  static fromAxiosError(error: any): AppError {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const status = error.response.status;
      
      if (status === 401 || status === 403) {
        return new AppError(ERROR_MESSAGES.Authorization, 'Authorization', error.response.data);
      } else if (status === 404) {
        return new AppError(ERROR_MESSAGES.NotFound, 'NotFound', error.response.data);
      } else {
        return new AppError(ERROR_MESSAGES.Api, 'Api', {
          status,
          data: error.response.data
        });
      }
    } else if (error.request) {
      // The request was made but no response was received
      if (error.code === 'ECONNABORTED') {
        return new AppError(ERROR_MESSAGES.Timeout, 'Timeout', error.request);
      }
      return new AppError(ERROR_MESSAGES.Network, 'Network', error.request);
    }
    
    // Something happened in setting up the request
    return new AppError(ERROR_MESSAGES.Unknown, 'Unknown', error);
  }
}
