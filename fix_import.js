#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// 1. Check if the utils directory exists and create it if needed
const utilsDir = path.join(process.cwd(), 'src/utils');
if (!fs.existsSync(utilsDir)) {
  console.log('Creating utils directory...');
  fs.mkdirSync(utilsDir, { recursive: true });
}

// 2. Create a config.js file with the necessary UI configuration
const configPath = path.join(utilsDir, 'config.js');
fs.writeFileSync(configPath, `// Application configuration
export const CONFIG = {
  UI: {
    DEBOUNCE_DELAY: 500,  // Default debounce delay for user inputs in milliseconds
    AUTO_REFRESH_INTERVAL: 60000,  // Auto-refresh interval in milliseconds (1 minute)
    DEFAULT_CHART_HEIGHT: 400,  // Default chart height in pixels
    MOBILE_BREAKPOINT: 768,  // Mobile breakpoint in pixels
    ANIMATION_DURATION: 300,  // Animation duration in milliseconds
    DATE_FORMAT: 'YYYY-MM-DD',  // Default date format
    THEME_COLORS: {
      PRIMARY: '#1976d2',
      SECONDARY: '#dc004e',
      SUCCESS: '#4caf50',
      WARNING: '#ff9800',
      ERROR: '#f44336',
      INFO: '#2196f3',
    }
  },
  API: {
    BASE_URL: process.env.REACT_APP_API_BASE_URL || 'https://api.stlouisfed.org/fred',
    TIMEOUT: parseInt(process.env.API_TIMEOUT || '30000', 10),
    RETRY_ATTEMPTS: parseInt(process.env.RETRY_ATTEMPTS || '3', 10),
  }
};

export default CONFIG;
`);
console.log('Created config.js with necessary configuration');

// 3. Create or update the AppError.js file
const appErrorPath = path.join(utilsDir, 'AppError.js');
fs.writeFileSync(appErrorPath, `// Application error handling
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
`);
console.log('Created/updated AppError.js with CONFIG export');

// 4. Now fix the Dashboard.js file to use the correct import
const dashboardPath = path.join(process.cwd(), 'src/components/Dashboard.js');
if (fs.existsSync(dashboardPath)) {
  let dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
  
  // Replace the incorrect import with the correct one
  const updatedContent = dashboardContent.replace(
    /import.*CONFIG.*from ['"]\.\.\/utils\/AppError['"]/,
    "import CONFIG from '../utils/config'"
  );
  
  fs.writeFileSync(dashboardPath, updatedContent);
  console.log('Updated Dashboard.js to use the correct import');
} else {
  console.log('Warning: Dashboard.js not found. Make sure to update the imports manually.');
}
