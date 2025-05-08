// Application error handling
import { CONFIG } from './config';

export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    // Ensure the stack trace is captured
    Error.captureStackTrace(this, this.constructor);
  }
  
  static handleApiError(error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      return new AppError(
        error.response.data.message || 'API error',
        error.response.status,
        error.response.data
      );
    } else if (error.request) {
      // The request was made but no response was received
      return new AppError(
        'No response received from server',
        408,
        { request: error.request }
      );
    } else {
      // Something happened in setting up the request that triggered an Error
      return new AppError(
        error.message || 'Error processing request',
        500,
        { error }
      );
    }
  }
}

// Re-export CONFIG to fix the import issue
export { CONFIG } from './config';

export default AppError;
