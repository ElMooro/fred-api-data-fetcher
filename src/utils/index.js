/**
 * Utility functions for date manipulation and error handling
 */

// Error types for better error handling and localization
export const ERROR_TYPES = {
  INVALID_DATE_RANGE: 'INVALID_DATE_RANGE',
  INVALID_DATE_FORMAT: 'INVALID_DATE_FORMAT',
  NO_DATA_RETURNED: 'NO_DATA_RETURNED',
  DUPLICATE_WATCHLIST: 'DUPLICATE_WATCHLIST',
  TRANSFORMATION_ERROR: 'TRANSFORMATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',
  GENERAL_ERROR: 'GENERAL_ERROR',
  DATA_SOURCE_ERROR: 'DATA_SOURCE_ERROR'
};

// Error messages - centralized for easier localization
export const ERROR_MESSAGES = {
  [ERROR_TYPES.INVALID_DATE_RANGE]: "Invalid date range. Please ensure start date is before end date.",
  [ERROR_TYPES.INVALID_DATE_FORMAT]: "Invalid date format. Please use YYYY-MM-DD format.",
  [ERROR_TYPES.NO_DATA_RETURNED]: "No data available for the selected parameters.",
  [ERROR_TYPES.DUPLICATE_WATCHLIST]: "This indicator is already in your watchlist.",
  [ERROR_TYPES.TRANSFORMATION_ERROR]: "Error applying transformation. Reverting to raw data.",
  [ERROR_TYPES.NETWORK_ERROR]: "Network connection error. Please try again.",
  [ERROR_TYPES.API_ERROR]: "API error. Some data sources may be unavailable.",
  [ERROR_TYPES.GENERAL_ERROR]: "An error occurred. Please try again.",
  [ERROR_TYPES.DATA_SOURCE_ERROR]: "Error with data source. Some indicators may be unavailable."
};

/**
 * Custom error class with type for better error handling
 */
export class AppError extends Error {
  constructor(type, message, originalError = null) {
    super(message || ERROR_MESSAGES[type] || 'Unknown error');
    this.name = 'AppError';
    this.type = type;
    this.originalError = originalError;
  }
}

/**
 * Logger utility with multiple log levels
 */
export const Logger = {
  debug: (message, data) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(message, data);
    }
  },
  
  info: (message, data) => {
    console.info(message, data);
  },
  
  warn: (message, data) => {
    console.warn(message, data);
  },
  
  error: (message, error, extraData) => {
    console.error(message, error, extraData);
  }
};

/**
 * Safely parse a date string and validate it
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {Date|null} Parsed Date object or null if invalid
 */
export const parseDate = (dateString) => {
  try {
    if (!dateString || typeof dateString !== 'string') {
      return null;
    }
    
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    Logger.error("Date parsing error:", error);
    return null;
  }
};

/**
 * Validates a date range
 * @param {string} startDateStr - Start date in YYYY-MM-DD format
 * @param {string} endDateStr - End date in YYYY-MM-DD format
 * @throws {AppError} If dates are invalid or start date is after end date
 */
export const validateDateRange = (startDateStr, endDateStr) => {
  const startDate = parseDate(startDateStr);
  const endDate = parseDate(endDateStr);
  
  if (!startDate || !endDate) {
    throw new AppError(ERROR_TYPES.INVALID_DATE_FORMAT);
  }
  
  if (startDate > endDate) {
    throw new AppError(ERROR_TYPES.INVALID_DATE_RANGE);
  }
  
  return { startDate, endDate };
};

/**
 * Check if two dates are in the same month
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {boolean} True if dates are in the same month
 */
export const isSameMonth = (date1, date2) => {
  if (!date1 || !date2) return false;
  return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth();
};

/**
 * Check if two dates are in the same quarter
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {boolean} True if dates are in the same quarter
 */
export const isSameQuarter = (date1, date2) => {
  if (!date1 || !date2) return false;
  const getQuarter = (date) => Math.floor(date.getMonth() / 3);
  return date1.getFullYear() === date2.getFullYear() && getQuarter(date1) === getQuarter(date2);
};

/**
 * Check if two dates are in the same year
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {boolean} True if dates are in the same year
 */
export const isSameYear = (date1, date2) => {
  if (!date1 || !date2) return false;
  return date1.getFullYear() === date2.getFullYear();
};

/**
 * Format a number based on transformation type
 * @param {number} value - The value to format
 * @param {string} transformationType - The transformation type
 * @param {number} precision - Decimal precision (default: 2)
 * @returns {string} Formatted number as string
 */
export const formatValue = (value, transformationType, precision = 2) => {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  
  const isPercentage = transformationType?.includes('pct') || transformationType === 'yoy';
  return `${value.toFixed(precision)}${isPercentage ? '%' : ''}`;
};

/**
 * Debounce function to prevent excessive function calls
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
