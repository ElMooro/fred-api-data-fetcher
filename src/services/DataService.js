import * as math from 'mathjs';
import _ from 'lodash';
import { TRANSFORMATIONS, DATA_SOURCES, FINANCIAL_CRISES } from '../constants/dataConstants';
import { CONFIG, AppError, ERROR_TYPES, ERROR_MESSAGES } from '../constants';
import { withRetry, parseDate, isSameMonth, isSameQuarter, isSameYear, validateDateRange } from '../utils';
import { Logger } from '../utils/Logger';

/**
 * DATA SERVICE
 * Handles all data fetching, transformation, and caching
 */
export const DataService = (() => {
  // In-memory cache for data
  const cache = new Map();
  
  /**
   * Generate a cache key for data requests
   * @param {string} seriesId - Indicator ID
   * @param {string} frequency - Data frequency
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {string} Cache key
   */
  const getCacheKey = (seriesId, frequency, startDate, endDate) => {
    return `${seriesId}|${frequency}|${startDate}|${endDate}`;
  };

  /**
   * Find indicator details across all sources
   * @param {string} seriesId - Indicator ID to find
   * @returns {Object|null} Indicator details or null if not found
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
   * @param {string} seriesId - Identifier for the data series
   * @param {string} frequency - Data frequency (daily, weekly, monthly, etc.)
   * @param {string} startDate - Start date in ISO format
   * @param {string} endDate - End date in ISO format
   * @returns {Promise<Array>} Array of data points with date and value properties
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
        Logger.debug("Cache hit", { cacheKey });
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
          // Log error but continue with data generation
          Logger.error("Error generating data point", innerError, {
            seriesId,
            date: currentDate.toISOString()
          });
          // Skip this data point but continue with the next one
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
        error = new AppError(
          ERROR_TYPES.DATA_SOURCE_ERROR,
          `Error generating data for ${seriesId}`,
          error
        );
      }
      
      Logger.error("Data generation error", error, {
        seriesId,
        frequency,
        startDate,
        endDate
      });
      
      throw error;
    }
  };

  /**
   * Transform data based on selected transformation type with robust error handling
   * @param {Array} data - Array of data points with date and value properties
   * @param {string} transformationType - Type of transformation to apply
   * @returns {Array} Transformed data
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
        Logger.warn(`Unknown transformation type: ${transformationType}`);
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
          Logger.warn(`Transformation type '${transformationType}' not implemented, returning raw data`);
          return [...data];
      }
    } catch (error) {
      Logger.error("Error transforming data:", error, { transformationType });
      // Return original data on error
      return [...data];
    }
  };

  /**
   * Calculate statistics for a dataset with error handling
   * @param {Array} data - Array of data points
   * @returns {Object} Statistics object with min, max, mean, median, stdDev properties
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
      Logger.error("Error calculating statistics:", error);
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

  // Expose public API
  return {
    fetchData: fetchDataWithRetry,
    transformData,
    calculateStatistics,
    findIndicatorDetails
  };
})();
