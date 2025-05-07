import { ERROR_MESSAGES } from '../constants/financial';
import { ErrorType } from '../types';

/**
 * Custom error class with type for better error handling
 */
export class AppError extends Error {
  name: string;
  type: ErrorType;
  originalError: Error | null;

  constructor(type: ErrorType, message?: string, originalError: Error | null = null) {
    super(message || ERROR_MESSAGES[type] || 'Unknown error');
    this.name = 'AppError';
    this.type = type;
    this.originalError = originalError;
  }
}

/**
 * Create a retry wrapper for async functions with exponential backoff
 * @param fn - Async function to retry
 * @param options - Retry options
 * @returns Function with retry capability
 */
export const withRetry = <T extends (...args: any[]) => Promise<any>>(
  fn: T, 
  options: {
    maxAttempts?: number;
    backoffFactor?: number;
    initialDelay?: number;
  } = {}
) => {
  const {
    maxAttempts = 3,
    backoffFactor = 1.5,
    initialDelay = 1000
  } = options;
  
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn(...args);
      } catch (error: any) {
        lastError = error;
        
        // Don't retry if it's a validation error or we've reached max attempts
        if (error instanceof AppError || attempt === maxAttempts) {
          throw error;
        }
        
        // Wait before next attempt with exponential backoff
        const delay = initialDelay * Math.pow(backoffFactor, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // This should never execute due to the throw in the loop, but as a fallback
    throw lastError;
  };
};

/**
 * Debounce function to prevent excessive function calls
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T, 
  wait = 300
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
};
