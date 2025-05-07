import { CONFIG } from '../constants';
import { Logger } from './Logger';
import { AppError, ERROR_TYPES } from '../constants';

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
    Logger.error("Date parsing error:", error, { dateString });
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
 * Safely get month difference between two dates
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {number} Number of months between dates
 */
export const getMonthDifference = (date1, date2) => {
  if (!date1 || !date2) return 0;
  return (date2.getFullYear() - date1.getFullYear()) * 12 + date2.getMonth() - date1.getMonth();
};

/**
 * Safely get quarter difference between two dates
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {number} Number of quarters between dates
 */
export const getQuarterDifference = (date1, date2) => {
  if (!date1 || !date2) return 0;
  const getQuarter = (date) => Math.floor(date.getMonth() / 3);
  return (date2.getFullYear() - date1.getFullYear()) * 4 + getQuarter(date2) - getQuarter(date1);
};

/**
 * Safely get year difference between two dates
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {number} Number of years between dates
 */
export const getYearDifference = (date1, date2) => {
  if (!date1 || !date2) return 0;
  return date2.getFullYear() - date1.getFullYear();
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
 * Create a retry wrapper for async functions with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxAttempts - Maximum number of attempts
 * @param {number} options.backoffFactor - Multiplier for delay between attempts
 * @param {number} options.initialDelay - Initial delay in ms
 * @returns {Function} Function with retry capability
 */
export const withRetry = (fn, options = {}) => {
  const {
    maxAttempts = CONFIG.RETRY.MAX_ATTEMPTS,
    backoffFactor = CONFIG.RETRY.BACKOFF_FACTOR,
    initialDelay = CONFIG.RETRY.INITIAL_DELAY
  } = options;
  
  return async (...args) => {
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;
        
        // Don't retry if it's a validation error or we've reached max attempts
        if (error instanceof AppError || attempt === maxAttempts) {
          throw error;
        }
        
        // Log retry attempt
        Logger.warn(`Retry attempt ${attempt}/${maxAttempts}`, { 
          function: fn.name, 
          error: error.message 
        });
        
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
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait = CONFIG.UI.DEBOUNCE_DELAY) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
