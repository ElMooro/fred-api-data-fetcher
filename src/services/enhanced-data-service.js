// Enhanced data service with AWS API integration
import apiService from './aws-api-integration';
import webSocketService from './aws-websocket-service';

// Feature flags for graceful degradation
const FEATURES = {
  USE_API: true,           // Set to false to use only mock data
  USE_WEBSOCKET: true,     // Set to false to disable WebSocket live updates
  FALLBACK_TO_MOCK: true   // Set to false to throw errors instead of using mock data
};

const API_ENDPOINTS = {
  SERIES_DATA: '/series/data',
  SERIES_INFO: '/series/info',
  STATISTICS: '/statistics'
};

// This service aims to match the interface of your existing DataService
// while adding real API capabilities with fallback to mock data
const EnhancedDataService = (() => {
  // Keep a reference to your existing DataService for fallback
  // We'll assume it's imported as 'window.DataService' for this example
  const originalDataService = window.DataService;
  
  // Additional cache for API data
  // // const cache = new Map(); // Commented out until used // Commented out until used
  
  const findIndicatorDetails = async (seriesId) => {
    if (!seriesId) return null;
    
    // Try API first if enabled
    if (FEATURES.USE_API) {
      try {
        return await apiService.get(`${API_ENDPOINTS.SERIES_INFO}/${seriesId}`);
      } catch (error) {
        console.warn(`Failed to get details for ${seriesId} from API, falling back to local data`);
      }
    }
    
    // Fall back to original implementation
    return originalDataService.findIndicatorDetails?.(seriesId) || null;
  };
  
  const fetchData = async (seriesId, frequency, startDate, endDate) => {
    // Try API first if enabled
    if (FEATURES.USE_API) {
      try {
        const data = await apiService.get(`${API_ENDPOINTS.SERIES_DATA}/${seriesId}`, {
          frequency,
          startDate,
          endDate
        });
        return data;
      } catch (error) {
        console.warn(`API fetch failed for ${seriesId}, falling back to original implementation`);
        if (!FEATURES.FALLBACK_TO_MOCK) throw error;
      }
    }
    
    // Fall back to original implementation
    return originalDataService.fetchData?.(seriesId, frequency, startDate, endDate) || [];
  };
  
  const transformData = (data, transformationType) => {
    // Use original implementation for data transformation
    return originalDataService.transformData?.(data, transformationType) || data;
  };
  
  const calculateStatistics = (data) => {
    // Use original implementation for statistics calculation
    return originalDataService.calculateStatistics?.(data) || {
      min: 0, max: 0, mean: 0, median: 0, stdDev: 0, count: 0
    };
  };
  
  const subscribeToLiveUpdates = (indicators) => {
    if (!FEATURES.USE_WEBSOCKET) return;
    
    const indicatorList = Array.isArray(indicators) ? indicators : [indicators];
    webSocketService.subscribe(indicatorList);
  };
  
  const unsubscribeFromLiveUpdates = (indicators) => {
    if (!FEATURES.USE_WEBSOCKET) return;
    
    const indicatorList = Array.isArray(indicators) ? indicators : [indicators];
    webSocketService.unsubscribe(indicatorList);
  };
  
  const onLiveDataUpdate = (handler) => {
    if (!FEATURES.USE_WEBSOCKET) return () => {};
    
    return webSocketService.onMessage(handler);
  };
  
  const getLiveDataStatus = () => {
    if (!FEATURES.USE_WEBSOCKET) return 'disabled';
    
    return webSocketService.getStatus();
  };
  
  return {
    // Maintain the same interface as your original DataService
    fetchData,
    transformData,
    calculateStatistics,
    findIndicatorDetails,
    // Add new functions for WebSocket integration
    subscribeToLiveUpdates,
    unsubscribeFromLiveUpdates,
    onLiveDataUpdate,
    getLiveDataStatus
  };
})();

export default EnhancedDataService;
