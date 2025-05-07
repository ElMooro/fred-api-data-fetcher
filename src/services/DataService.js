/**
 * DataService.js
 * Handles data fetching, caching, and transformation for financial indicators
 */

import { ERROR_TYPES, AppError } from '../utils/AppError';
import { Logger } from '../utils/Logger';
import { DATA_SOURCES } from '../constants/dataSources';
import { validateDateRange } from '../utils/dateUtils';
import { withRetry } from '../utils/withRetry';

/**
 * Data Service for financial indicators
 * Implements a hybrid approach with API calls and fallback to mock data
 */
const DataService = (() => {
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
   * Primary data fetching function that tries the API first,
   * then falls back to mock data generation if needed
   */
  const fetchData = async (seriesId, frequency, startDate, endDate) => {
    try {
      // Input validation
      if (!seriesId) {
        throw new AppError(ERROR_TYPES.GENERAL_ERROR, "Missing series ID parameter");
      }
      
      // Validate date range
      validateDateRange(startDate, endDate);
      
      // Check cache first
      const cacheKey = getCacheKey(seriesId, frequency, startDate, endDate);
      if (cache.has(cacheKey)) {
        Logger.debug("Cache hit", { cacheKey });
        return cache.get(cacheKey);
      }
      
      // Try fetching from API first
      try {
        Logger.info("Fetching from API Gateway", { seriesId, startDate, endDate });
        
        // Build the API URL with query parameters
        const apiUrl = `https://i3y8tfdp1k.execute-api.us-east-1.amazonaws.com/prod/indicators?indicator=${seriesId}&startDate=${startDate}&endDate=${endDate}`;
        
        // Make the API request with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Check if the request was successful
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }
        
        // Parse the JSON response
        const result = await response.json();
        
        // Validate the response data
        if (!result.data || !Array.isArray(result.data) || result.data.length === 0) {
          throw new Error("No data returned from API");
        }
        
        // Store in cache
        cache.set(cacheKey, result.data);
        Logger.info("Successfully fetched from API", { dataPoints: result.data.length });
        
        return result.data;
      } catch (apiError) {
        // Log API error and fall back to mock data
        Logger.warn("API request failed, falling back to mock data", { 
          error: apiError.message, 
          seriesId, 
          startDate, 
          endDate 
        });
        
        // Generate mock data as fallback
        const mockData = await generateMockData(seriesId, frequency, startDate, endDate);
        return mockData;
      }
    } catch (error) {
      // Convert to AppError if it's not already
      if (!(error instanceof AppError)) {
        error = new AppError(
          ERROR_TYPES.DATA_SOURCE_ERROR,
          `Error fetching data for ${seriesId}`,
          error
        );
      }
      
      Logger.error("Data fetching error", error, {
        seriesId,
        frequency,
        startDate,
        endDate
      });
      
      throw error;
    }
  };

  /**
   * Generates mock financial data with realistic patterns as a fallback
   * [Keep your original generateMockData implementation here]
   */
  const generateMockData = async (seriesId, frequency, startDate, endDate) => {
    // Your existing mock data generator code
    // This provides fallback data if the API isn't available
  };

  /**
   * Transform data based on selected transformation type
   * [Keep your original transformData implementation here]
   */
  const transformData = (data, transformationType) => {
    // Your existing transformData implementation
  };

  /**
   * Calculate statistics for a dataset
   * [Keep your original calculateStatistics implementation here]
   */
  const calculateStatistics = (data) => {
    // Your existing calculateStatistics implementation
  };

  // Wrap data fetching with retry capability
  const fetchDataWithRetry = withRetry(fetchData);

  // Expose public API
  return {
    fetchData: fetchDataWithRetry,
    transformData,
    calculateStatistics,
    findIndicatorDetails
  };
})();

export default DataService;
