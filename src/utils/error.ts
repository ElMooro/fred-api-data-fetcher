import { ERROR_MESSAGES } from '../constants/financial';
import { ErrorType } from '../types';

/**
 * Custom error class with type for better error handling
 */
export class AppError extends Error {
  type: ErrorType;
  
  constructor(message: string, type: ErrorType = 'UNKNOWN_ERROR' as ErrorType) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }
  
  /**
   * Factory method to create an API error
   */
  static createApiError(message?: string): AppError {
    return new AppError(
      message || ERROR_MESSAGES.API_ERROR,
      'API_ERROR'
    );
  }
  
  /**
   * Factory method to create a network error
   */
  static createNetworkError(message?: string): AppError {
    return new AppError(
      message || ERROR_MESSAGES.NETWORK_ERROR,
      'NETWORK_ERROR'
    );
  }
  
  /**
   * Factory method to create a fetch error
   */
  static createFetchError(message?: string): AppError {
    return new AppError(
      message || ERROR_MESSAGES.FETCH_ERROR,
      'FETCH_ERROR'
    );
  }
  
  /**
   * Factory method to create a parse error
   */
  static createParseError(message?: string): AppError {
    return new AppError(
      message || ERROR_MESSAGES.PARSE_ERROR,
      'PARSE_ERROR'
    );
  }
}

/**
 * Utility function to handle errors and convert them to AppError instances
 */
export const handleError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }
  
  if (error instanceof Error) {
    // Check if it's a network error
    if (error.message.toLowerCase().includes('network') || 
        error.message.toLowerCase().includes('connection')) {
      return AppError.createNetworkError(error.message);
    }
    
    // Check if it's a parsing error
    if (error.message.toLowerCase().includes('parse') || 
        error.message.toLowerCase().includes('json')) {
      return AppError.createParseError(error.message);
    }
    
    return new AppError(error.message);
  }
  
  // For unknown error types
  return new AppError(
    typeof error === 'string' ? error : ERROR_MESSAGES.GENERAL_ERROR
  );
};
