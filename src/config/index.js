// Application configuration

const CONFIG = {
  API: {
    FRED: {
      BASE_URL: 'https://api.stlouisfed.org/fred',
      TIMEOUT: 30000,
      RETRY_ATTEMPTS: 3
    },
    CENSUS: {
      BASE_URL: 'https://api.census.gov/data',
      TIMEOUT: 30000
    },
    BLS: {
      BASE_URL: 'https://api.bls.gov/publicAPI/v2',
      TIMEOUT: 30000
    },
    BEA: {
      BASE_URL: 'https://apps.bea.gov/api/data',
      TIMEOUT: 30000
    },
    ECB: {
      BASE_URL: 'https://sdw-wsrest.ecb.europa.eu/service',
      TIMEOUT: 30000
    }
  },
  UI: {
    DEBOUNCE_DELAY: 500,
    ANIMATION_DURATION: 300,
    PAGE_SIZE: 10,
    DATE_FORMAT: 'YYYY-MM-DD',
    THEME: {
      PRIMARY_COLOR: '#0066cc',
      SECONDARY_COLOR: '#f5f5f5',
      SUCCESS_COLOR: '#4caf50',
      ERROR_COLOR: '#f44336',
      WARNING_COLOR: '#ff9800'
    }
  },
  FEATURES: {
    ENABLE_CACHING: true,
    CACHE_DURATION: 3600000 // 1 hour in milliseconds
  }
};

export default CONFIG;
