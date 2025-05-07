// Error types and messages
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

export const ERROR_MESSAGES = {
  [ERROR_TYPES.INVALID_DATE_RANGE]: 'Invalid date range. Please ensure start date is before end date.',
  [ERROR_TYPES.INVALID_DATE_FORMAT]: 'Invalid date format. Please use YYYY-MM-DD format.',
  [ERROR_TYPES.NO_DATA_RETURNED]: 'No data available for the selected parameters.',
  [ERROR_TYPES.DUPLICATE_WATCHLIST]: 'This indicator is already in your watchlist.',
  [ERROR_TYPES.TRANSFORMATION_ERROR]: 'Error applying transformation. Reverting to raw data.',
  [ERROR_TYPES.NETWORK_ERROR]: 'Network connection error. Please try again.',
  [ERROR_TYPES.API_ERROR]: 'API error. Some data sources may be unavailable.',
  [ERROR_TYPES.GENERAL_ERROR]: 'An error occurred. Please try again.',
  [ERROR_TYPES.DATA_SOURCE_ERROR]: 'Error with data source. Some indicators may be unavailable.'
};
