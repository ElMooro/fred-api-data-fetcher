export const APP_VERSION = '2.0.0';

export const CONFIG = {
  DATES: {
    DEFAULT_START_DATE: '2000-01-01',
    DEFAULT_END_DATE: '2025-04-30',
    DATE_FORMAT: 'YYYY-MM-DD'
  },
  RETRY: {
    MAX_ATTEMPTS: 3,
    BACKOFF_FACTOR: 1.5,
    INITIAL_DELAY: 1000, // ms
  },
  UI: {
    LOADING_TIMEOUT: 500, // ms
    DEBOUNCE_DELAY: 300, // ms
    CHART_HEIGHT: 96, // percentage
  },
  API: {
    DEFAULT_TIMEOUT: 5000 // ms
  },
  WEBSOCKET: {
    URL: process.env.REACT_APP_WEBSOCKET_URL || 'wss://your-aws-api-gateway-id.execute-api.region.amazonaws.com/production',
    RECONNECT_INTERVAL: 2000,
    RECONNECT_ATTEMPTS: 5,
    CONNECTION_TIMEOUT: 5000,
    HEARTBEAT_INTERVAL: 30000
  }
};

export const ERROR_TYPES = {
  INVALID_DATE_RANGE: 'INVALID_DATE_RANGE',
  INVALID_DATE_FORMAT: 'INVALID_DATE_FORMAT',
  NO_DATA_RETURNED: 'NO_DATA_RETURNED',
  DUPLICATE_WATCHLIST: 'DUPLICATE_WATCHLIST',
  TRANSFORMATION_ERROR: 'TRANSFORMATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',
  GENERAL_ERROR: 'GENERAL_ERROR',
  DATA_SOURCE_ERROR: 'DATA_SOURCE_ERROR',
  WEBSOCKET_ERROR: 'WEBSOCKET_ERROR'
};

export const ERROR_MESSAGES = {
  [ERROR_TYPES.INVALID_DATE_RANGE]: "Invalid date range. Please ensure start date is before end date.",
  [ERROR_TYPES.INVALID_DATE_FORMAT]: "Invalid date format. Please use YYYY-MM-DD format.",
  [ERROR_TYPES.NO_DATA_RETURNED]: "No data available for the selected parameters.",
  [ERROR_TYPES.DUPLICATE_WATCHLIST]: "This indicator is already in your watchlist.",
  [ERROR_TYPES.TRANSFORMATION_ERROR]: "Error applying transformation. Reverting to raw data.",
  [ERROR_TYPES.NETWORK_ERROR]: "Network connection error. Please try again.",
  [ERROR_TYPES.API_ERROR]: "API error. Some data sources may be unavailable.",
  [ERROR_TYPES.GENERAL_ERROR]: "An error occurred. Please try again.",
  [ERROR_TYPES.DATA_SOURCE_ERROR]: "Error with data source. Some indicators may be unavailable.",
  [ERROR_TYPES.WEBSOCKET_ERROR]: "WebSocket connection error. Real-time updates may be unavailable."
};

export class AppError extends Error {
  constructor(type, message, originalError = null) {
    super(message || ERROR_MESSAGES[type] || 'Unknown error');
    this.name = 'AppError';
    this.type = type;
    this.originalError = originalError;
  }
}
