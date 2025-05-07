// DataService.js
import * as math from 'mathjs';
import _ from 'lodash';

// Constants needed by the service
const ERROR_TYPES = {
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

// Error messages 
const ERROR_MESSAGES = {
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

// Configuration
const CONFIG = {
  RETRY: {
    MAX_ATTEMPTS: 3,
    BACKOFF_FACTOR: 1.5,
    INITIAL_DELAY: 1000, // ms
  }
};

// Financial Crisis events for the mock data generator
const FINANCIAL_CRISES = [
  { 
    name: "Black Monday", 
    date: "1987-10-19", 
    description: "Stock market crash where Dow Jones fell by 22.6%",
    severity: "high" 
  },
  { 
    name: "Dot-com Bubble", 
    startDate: "2000-03-10", 
    endDate: "2002-10-09", 
    description: "Tech stock bubble burst",
    severity: "high" 
  },
  { 
    name: "Global Financial Crisis", 
    startDate: "2007-12-01", 
    endDate: "2009-06-01", 
    description: "Subprime mortgage crisis",
    severity: "extreme" 
  },
  { 
    name: "Flash Crash", 
    date: "2010-05-06", 
    description: "Brief stock market crash with trillion-dollar losses",
    severity: "medium" 
  },
  { 
    name: "European Debt Crisis", 
    startDate: "2010-04-01", 
    endDate: "2012-07-26", 
    description: "Sovereign debt crisis in Europe",
    severity: "high" 
  },
  { 
    name: "COVID-19 Crash", 
    date: "2020-03-16", 
    description: "Pandemic-induced market crash",
    severity: "high" 
  }
];

// Data sources 
const DATA_SOURCES = {
  FRED: [
    { 
      id: "GDP", 
      name: "Gross Domestic Product", 
      frequency: "quarterly",
      unit: "Billions of USD",
      description: "Total value of goods and services produced",
      baseValue: 15000,
      volatility: 0.01,
      trend: 0.005
    },
    { 
      id: "UNRATE", 
      name: "Unemployment Rate", 
      frequency: "monthly",
      unit: "Percent",
      description: "Percentage of labor force unemployed",
      baseValue: 5,
      volatility: 0.03,
      trend: 0
    },
    { 
      id: "FEDFUNDS", 
      name: "Federal Funds Rate", 
      frequency: "monthly",
      unit: "Percent",
      description: "Interest rate at which banks lend to each other overnight",
      baseValue: 2.5,
      volatility: 0.02,
      trend: 0
    }
  ],
  // Other data sources can be added here
};

// Transformations
const TRANSFORMATIONS = [
  { 
    id: "raw", 
    name: "Raw Data (No Transformation)", 
    description: "Original data without any mathematical transformation",
    requiresHistory: false 
  },
  { 
    id: "mom", 
    name: "Month-over-Month Change", 
    description: "Absolute change from previous month",
    requiresHistory: true,
    historyPeriod: "month"
  },
  { 
    id: "mom_pct", 
    name: "Month-over-Month % Change", 
    description: "Percentage change from previous month",
    requiresHistory: true,
    historyPeriod: "month",
    resultUnit: "percent"
  },
  { 
    id: "qoq", 
    name: "Quarter-over-Quarter Change", 
    description: "Absolute change from previous quarter",
    requiresHistory: true,
    historyPeriod: "quarter"
  },
  { 
    id: "qoq_pct", 
    name: "Quarter-over-Quarter % Change", 
    description: "Percentage change from previous quarter",
    requiresHistory: true,
    historyPeriod: "quarter",
    resultUnit: "percent"
  },
  { 
    id: "yoy", 
    name: "Year-over-Year % Change", 
    description: "Percentage change from same period previous year",
    requiresHistory: true,
    historyPeriod: "year",
    resultUnit: "percent"
  }
];

/**
 * Custom error class with type for better error handling
 */
class AppError extends Error {
  constructor(type, message, originalError = null) {
    super(message || ERROR_MESSAGES[type] || 'Unknown error');
    this.name = 'AppError';
    this.type = type;
    this.originalError = originalError;
  }
}

/**
 * Safely parse a date string and validate it
 */
const parseDate = (dateString) => {
  try {
    if (!dateString || typeof dateString !== 'string') {
      return null;
    }
    
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    console.error("Date parsing error:", error);
    return null;
  }
};

/**
 * Validates a date range
 */
const validateDateRange = (startDateStr, endDateStr) => {
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
 */
const isSameMonth = (date1, date2) => {
  if (!date1 || !date2) return false;
  return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth();
};

/**
 * Check if two dates are in the same quarter
 */
const isSameQuarter = (date1, date2) => {
  if (!date1 || !date2) return false;
  const getQuarter = (date) => Math.floor(date.getMonth() / 3);
  return date1.getFullYear() === date2.getFullYear() && getQuarter(date1) === getQuarter(date2);
};

/**
 * Create a retry wrapper for async functions with exponential backoff
 */
const withRetry = (fn, options = {}) => {
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
        console.warn(`Retry attempt ${attempt}/${maxAttempts}`, { 
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

// In-memory cache for data
const cache = new Map();

/**
 * Generate a cache key for data requests
 */
const getCacheKey = (seriesId, frequency, startDate, endDate) => {
  return `${seriesId}|${frequency}|${startDate}|${endDate}`;
};

/**
 * Find indicator details across all sources
 */
const findIndicatorDetails = (seriesId) => {
  if (!seriesId) return null;
  
  let indicatorDetails = null;
  Object.values(DATA_SOURCES).some(sourceData => {
    const found = sourceData.find(item => item.id === seriesId);
    if (found) {
      indicatorDetails = found;
      return true;
    }
    return false;
  });
  
  return indicatorDetails;
};

/**
 * Generates mock financial data with realistic patterns and proper error handling
 */
const generateMockData = async (seriesId, frequency, startDate, endDate) => {
  try {
    // Input validation
    if (!seriesId) {
      throw new AppError(ERROR_TYPES.GENERAL_ERROR, "Missing series ID parameter");
    }
    
    if (!frequency) {
      throw new AppError(ERROR_TYPES.GENERAL_ERROR, "Missing frequency parameter");
    }
    
    // Validate date range
    const { startDate: start, endDate: end } = validateDateRange(startDate, endDate);
    
    // Check cache first
    const cacheKey = getCacheKey(seriesId, frequency, startDate, endDate);
    if (cache.has(cacheKey)) {
      console.debug("Cache hit", { cacheKey });
      return cache.get(cacheKey);
    }
    
    // Find indicator details
    const indicatorDetails = findIndicatorDetails(seriesId);
    
    // Default values if indicator not found
    const baseValue = indicatorDetails?.baseValue || 100;
    const volatilityFactor = indicatorDetails?.volatility || 0.03;
    const trendFactor = indicatorDetails?.trend || 0;
    
    // Generate data
    const data = [];
    let currentDate = new Date(start);
    
    // Economic cycle simulation (approximates ~8 year business cycle)
    const cycleDays = 365 * 8;
    let cyclePosition = 0;
    let value = baseValue;
    
    while (currentDate <= end) {
      try {
        // Combine random volatility, trend, and cyclical components
        const randomComponent = (Math.random() * volatilityFactor * 2) - volatilityFactor;
        const trendComponent = trendFactor;
        
        // Cyclical component - sinusoidal wave with ~8 year period
        let cyclicalComponent = 0;
        if (seriesId === "GDP" || seriesId === "UNRATE") {
          cyclicalComponent = Math.sin(2 * Math.PI * cyclePosition / cycleDays) * volatilityFactor;
          
          // Unemployment is countercyclical
          if (seriesId === "UNRATE") {
            cyclicalComponent *= -1;
          }
        }
        
        // Crisis impacts
        let crisisComponent = 0;
        FINANCIAL_CRISES.forEach(crisis => {
          const crisisDate = crisis.date ? new Date(crisis.date) : null;
          const crisisStartDate = crisis.startDate ? new Date(crisis.startDate) : null;
          const crisisEndDate = crisis.endDate ? new Date(crisis.endDate) : null;
          
          // For single-day crisis events
          if (crisisDate) {
            const daysSinceCrisis = Math.abs((currentDate - crisisDate) / (24 * 60 * 60 * 1000));
            if (daysSinceCrisis <= 30) { // Impact most pronounced within 30 days
              const severityMultiplier = crisis.severity === "extreme" ? 2 : 
                                      crisis.severity === "high" ? 1 : 0.5;
                                      
              // Different impact based on indicator type
              if (seriesId === "FSI" || seriesId === "UNRATE") {
                // Stress index and unemployment spike up during crises
                crisisComponent += (0.2 * severityMultiplier) * Math.exp(-daysSinceCrisis / 15);
              } else if (seriesId === "GDP") {
                // GDP drops during crises
                crisisComponent -= (0.15 * severityMultiplier) * Math.exp(-daysSinceCrisis / 20);
              }
            }
          }
          
          // For crisis periods
          if (crisisStartDate && crisisEndDate) {
            if (currentDate >= crisisStartDate && currentDate <= crisisEndDate) {
              const severityMultiplier = crisis.severity === "extreme" ? 2 : 
                                      crisis.severity === "high" ? 1 : 0.5;
              
              // Position within crisis period (0 to 1)
              const crisisDuration = (crisisEndDate - crisisStartDate) / (24 * 60 * 60 * 1000);
              const daysIntoCrisis = (currentDate - crisisStartDate) / (24 * 60 * 60 * 1000);
              const crisisPosition = daysIntoCrisis / crisisDuration;
              
              // Different impact patterns based on indicator and position in crisis
              if (seriesId === "FSI") {
                // Stress index rises quickly, stays high, falls at end
                crisisComponent += (0.15 * severityMultiplier) * 
                                  (crisisPosition < 0.2 ? crisisPosition * 5 : 
                                  crisisPosition > 0.8 ? (1 - crisisPosition) * 5 : 1);
              } else if (seriesId === "UNRATE") {
                // Unemployment rises throughout crisis
                crisisComponent += (0.1 * severityMultiplier) * Math.min(1, crisisPosition * 2);
              } else if (seriesId === "GDP") {
                // GDP falls, then slowly recovers
                crisisComponent -= (0.1 * severityMultiplier) * (1 - Math.min(1, crisisPosition * 3));
              }
            }
          }
        });
        
        // Combine all components
        const totalChange = randomComponent + trendComponent + cyclicalComponent + crisisComponent;
        
        // For percentage indicators, use additive
        if (seriesId === "UNRATE" || seriesId === "FEDFUNDS") {
          value += value * totalChange;
        } else {
          // For index values, use multiplicative
          value = value * (1 + totalChange);
        }
        
        // Ensure no negative values for certain indicators
        if ((seriesId === "UNRATE" || seriesId === "FEDFUNDS" || seriesId === "GDP") && value < 0) {
          value = Math.abs(value * 0.1); // Small positive value
        }
        
        // Ensure realistic ranges for specific indicators
        if (seriesId === "UNRATE" && value > 25) value = 25;
        if (seriesId === "FEDFUNDS" && value > 20) value = 20;
        
        data.push({
          date: currentDate.toISOString().split('T')[0],
          value: parseFloat(value.toFixed(2)),
          rawValue: parseFloat(value.toFixed(2)) // Keep original for reference
        });
      } catch (innerError) {
        console.error("Error generating data point", innerError);
      }
      
      // Increment cycle position
      cyclePosition++;
      
      // Move to next period based on frequency
      if (frequency === 'daily') {
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (frequency === 'weekly') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else if (frequency === 'monthly') {
        currentDate.setMonth(currentDate.getMonth() + 1);
      } else if (frequency === 'quarterly') {
        currentDate.setMonth(currentDate.getMonth() + 3);
      } else if (frequency === 'semiannual') {
        currentDate.setMonth(currentDate.getMonth() + 6);
      } else if (frequency === 'annual') {
        currentDate.setFullYear(currentDate.getFullYear() + 1);
      } else {
        // Default to monthly if frequency is unknown
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }
    
    if (data.length === 0) {
      throw new AppError(ERROR_TYPES.NO_DATA_RETURNED);
    }
    
    // Store in cache
    cache.set(cacheKey, data);
    
    return data;
  } catch (error) {
    // Convert to AppError if it's not already
    if (!(error instanceof AppError)) {
      // Fix to avoid the ESLint error
      const appError = new AppError(
        ERROR_TYPES.DATA_SOURCE_ERROR,
        `Error generating data for ${seriesId}`,
        error
      );
      throw appError;
    }
    
    console.error("Data generation error", error);
    
    throw error;
  }
};

/**
 * Transform data based on selected transformation type with robust error handling
 */
const transformData = (data, transformationType) => {
  try {
    // Early exit for raw data or invalid inputs
    if (!data || data.length === 0) {
      return [];
    }
    
    if (!transformationType || transformationType === 'raw') {
      return [...data]; // Return a copy of the original data
    }

    // Create a deep copy to avoid mutating the original data
    const sortedData = _.cloneDeep(data).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Get transformation details
    const transformInfo = TRANSFORMATIONS.find(t => t.id === transformationType);
    if (!transformInfo) {
      console.warn(`Unknown transformation type: ${transformationType}`);
      return [...data]; // Return original data if transformation not found
    }
    
    switch (transformationType) {
      case 'mom': // Month-over-Month absolute change
        return sortedData.map((item, index) => {
          if (index === 0) return { ...item, value: 0 };
          
          const currentDate = parseDate(item.date);
          const prevDate = parseDate(sortedData[index - 1].date);
          
          // Only calculate changes between different months
          if (currentDate && prevDate && !isSameMonth(currentDate, prevDate)) {
            return {
              ...item,
              value: parseFloat((item.value - sortedData[index - 1].value).toFixed(2))
            };
          }
          
          return item;
        });
        
      case 'mom_pct': // Month-over-Month percentage change
        return sortedData.map((item, index) => {
          if (index === 0) return { ...item, value: 0 };
          
          const currentDate = parseDate(item.date);
          const prevDate = parseDate(sortedData[index - 1].date);
          
          // Only calculate changes between different months
          if (currentDate && prevDate && !isSameMonth(currentDate, prevDate)) {
            const prevValue = sortedData[index - 1].value;
            
            if (prevValue === 0) {
              return { ...item, value: 0 }; // Avoid division by zero
            }
            
            return {
              ...item,
              value: parseFloat(((item.value - prevValue) / Math.abs(prevValue) * 100).toFixed(2))
            };
          }
          
          return item;
        });
        
      case 'qoq': // Quarter-over-Quarter absolute change
        return sortedData.map((item, index) => {
          if (index === 0) return { ...item, value: 0 };
          
          const currentDate = parseDate(item.date);
          const prevDate = parseDate(sortedData[index - 1].date);
          
          // Only calculate changes between different quarters
          if (currentDate && prevDate && !isSameQuarter(currentDate, prevDate)) {
            return {
              ...item,
              value: parseFloat((item.value - sortedData[index - 1].value).toFixed(2))
            };
          }
          
          return item;
        });
        
      case 'qoq_pct': // Quarter-over-Quarter percentage change
        return sortedData.map((item, index) => {
          if (index === 0) return { ...item, value: 0 };
          
          const currentDate = parseDate(item.date);
          const prevDate = parseDate(sortedData[index - 1].date);
          
          // Only calculate changes between different quarters
          if (currentDate && prevDate && !isSameQuarter(currentDate, prevDate)) {
            const prevValue = sortedData[index - 1].value;
            
            if (prevValue === 0) {
              return { ...item, value: 0 }; // Avoid division by zero
            }
            
            return {
              ...item,
              value: parseFloat(((item.value - prevValue) / Math.abs(prevValue) * 100).toFixed(2))
            };
          }
          
          return item;
        });
        
      case 'yoy': // Year-over-Year percentage change
        return sortedData.map((item) => {
          const currentDate = parseDate(item.date);
          if (!currentDate) return { ...item, value: null };
          
          // Find data from approximately one year ago
          const yearAgoTarget = new Date(currentDate);
          yearAgoTarget.setFullYear(yearAgoTarget.getFullYear() - 1);
          
          // Find the closest matching data point from a year ago
          const yearAgoData = sortedData.find(d => {
            const dataDate = parseDate(d.date);
            return dataDate && Math.abs(dataDate - yearAgoTarget) < 16 * 24 * 60 * 60 * 1000; // Within ~15 days
          });
          
          if (!yearAgoData) {
            return { ...item, value: null }; // No year-ago data available
          }
          
          if (yearAgoData.value === 0) {
            return { ...item, value: null }; // Avoid division by zero
          }
          
          return {
            ...item,
            value: parseFloat(((item.value - yearAgoData.value) / Math.abs(yearAgoData.value) * 100).toFixed(2))
          };
        }).filter(item => item.value !== null); // Remove null values
        
      default:
        console.warn(`Transformation type '${transformationType}' not implemented, returning raw data`);
        return [...data];
    }
  } catch (error) {
    console.error("Error transforming data:", error);
    // Return original data on error
    return [...data];
  }
};

/**
 * Calculate statistics for a dataset with error handling
 */
const calculateStatistics = (data) => {
  if (!data || data.length === 0) {
    return {
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      stdDev: 0,
      count: 0
    };
  }
  
  try {
    const values = data.map(d => d.value).filter(v => v !== null && !isNaN(v));
    
    if (values.length === 0) {
      return {
        min: 0,
        max: 0,
        mean: 0,
        median: 0,
        stdDev: 0,
        count: 0
      };
    }
    
    return {
      min: math.min(values),
      max: math.max(values),
      mean: math.mean(values),
      median: math.median(values),
      stdDev: math.std(values),
      count: values.length
    };
  } catch (error) {
    console.error("Error calculating statistics:", error);
    return {
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      stdDev: 0,
      count: 0,
      error: error.message
    };
  }
};

// Wrap data fetching with retry capability
const fetchDataWithRetry = withRetry(generateMockData);

// Create the DataService object
export const DataService = {
  fetchData: fetchDataWithRetry,
  transformData,
  calculateStatistics,
  findIndicatorDetails
};

// Also export as default for modules that use default import
export default DataService;