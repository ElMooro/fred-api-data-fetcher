// Application configuration
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
