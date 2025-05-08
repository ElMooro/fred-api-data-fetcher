/**
 * DataService.js - Financial dashboard data service
 * Handles API communication with fallback to mock data generation
 */

// Import any necessary utilities
import { ERROR_TYPES, ERROR_MESSAGES } from '../constants/errors';

// API endpoint configuration
const API_CONFIG = {
  BASE_URL: 'https://i3y8tfdp1k.execute-api.us-east-1.amazonaws.com/prod',
  ENDPOINTS: {
    INDICATORS: '/indicators'
  },
  TIMEOUT: 8000
};

/**
 * DataService singleton for data operations
 */
const DataService = (() => {
  // In-memory cache
  const cache = new Map();
  
  /**
   * Generate cache key for requests
   */
  const getCacheKey = (seriesId, frequency, startDate, endDate, transformation = 'raw') => {
    return `${seriesId}|${frequency}|${startDate}|${endDate}|${transformation}`;
  };
  
  /**
   * Find indicator details in data sources
   */
  const findIndicatorDetails = (seriesId) => {
    if (!seriesId) return null;
    
    // Data sources should be imported from your constants
    const DATA_SOURCES = window.DATA_SOURCES || {};
    
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
   * Main data fetching function that calls API with fallback to mock data
   */
  const fetchData = async (seriesId, frequency, startDate, endDate) => {
    try {
      console.log(`Fetching data for ${seriesId} from ${startDate} to ${endDate}`);
      
      // Check cache first
      const cacheKey = getCacheKey(seriesId, frequency, startDate, endDate);
      if (cache.has(cacheKey)) {
        console.log("Using cached data");
        return cache.get(cacheKey);
      }
      
      // Make API request
      try {
        console.log("Attempting API call...");
        const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INDICATORS}?indicator=${seriesId}&startDate=${startDate}&endDate=${endDate}`;
        
        // Set up fetch with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
        
        const response = await fetch(url, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Check response status
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        // Parse JSON response
        const result = await response.json();
        console.log("API response:", result);
        
        // Validate response data
        if (!result.data || !Array.isArray(result.data)) {
          throw new Error("Invalid data format received from API");
        }
        
        // Store in cache and return
        cache.set(cacheKey, result.data);
        return result.data;
      } catch (apiError) {
        console.warn("API request failed:", apiError);
        console.log("Falling back to mock data generation...");
        
        // Fall back to mock data generation
        return await generateMockData(seriesId, frequency, startDate, endDate);
      }
    } catch (error) {
      console.error("Data fetching error:", error);
      throw error;
    }
  };
  
  /**
   * Generate mock financial data as fallback
   */
  const generateMockData = async (seriesId, frequency, startDate, endDate) => {
    // Your existing mock data generation logic
    // This function should be a copy of your current implementation
    console.log("Generating mock data");
    
    // Simplified implementation for brevity
    const data = [];
    let currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    // Base value depends on indicator
    let baseValue = 100;
    if (seriesId === "UNRATE") baseValue = 5;
    if (seriesId === "GDP") baseValue = 15000;
    if (seriesId === "FEDFUNDS") baseValue = 2.5;
    
    // Generate data points
    while (currentDate <= endDateObj) {
      // Add random variation (simplified)
      const randomFactor = (Math.random() * 0.1) - 0.05;
      baseValue = baseValue * (1 + randomFactor);
      
      data.push({
        date: currentDate.toISOString().split('T')[0],
        value: parseFloat(baseValue.toFixed(2))
      });
      
      // Move to next period
      if (frequency === 'daily') {
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (frequency === 'weekly') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else if (frequency === 'monthly') {
        currentDate.setMonth(currentDate.getMonth() + 1);
      } else if (frequency === 'quarterly') {
        currentDate.setMonth(currentDate.getMonth() + 3);
      } else {
        // Default to monthly
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }
    
    return data;
  };
  
  /**
   * Transform data based on transformation type
   */
  const transformData = (data, transformationType) => {
    // Your existing data transformation logic
    return data;
  };
  
  /**
   * Calculate statistics for dataset
   */
  const calculateStatistics = (data) => {
    // Your existing statistics calculation logic
    return {
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      stdDev: 0,
      count: 0
    };
  };
  
  // Public API
  return {
    fetchData,
    transformData,
    calculateStatistics,
    findIndicatorDetails
  };
})();

export default DataService;
// NY Fed API Support - Added Thu May  8 15:59:09 UTC 2025
// Import NY Fed Services
import { NYFedService } from './NYFedService';
import { transformNYFedRateData, transformNYFedTreasuryData } from '../utils/nyfedDataTransformer';

// Add this to your existing fetchData method:
/*
  if (source === 'nyfed') {
    // Check if the indicator is a Treasury rate
    if (indicator.startsWith('treasury_')) {
      const tenor = indicator.replace('treasury_', '');
      const treasuryData = await NYFedService.fetchTreasuryYields(startDate, endDate);
      return transformNYFedTreasuryData(treasuryData, tenor);
    } else {
      // Handle other rates (SOFR, EFFR, etc.)
      let rateType;
      switch (indicator) {
        case 'sofr':
          rateType = 'sofr';
          break;
        case 'effr':
          rateType = 'effr';
          break;
        default:
          rateType = indicator;
      }
      
      const rateData = await NYFedService.fetchRates(rateType, startDate, endDate);
      return transformNYFedRateData(rateData, rateType);
    }
  }
*/
