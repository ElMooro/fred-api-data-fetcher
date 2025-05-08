import { useCallback } from 'react';

/**
 * Custom hook for data service operations
 */
export const useDataService = () => {
  /**
   * Get indicator details from various data sources
   */
  const getIndicatorDetails = useCallback(async (indicator, startDate, endDate) => {
    // In a real application, this would make API calls to fetch data
    // For now, we'll return mock data
    console.log(`Fetching data for ${indicator} from ${startDate} to ${endDate}`);
    
    // Mock data
    const mockData = {
      fred: Array.from({ length: 20 }, (_, i) => ({
        date: new Date(new Date(startDate).getTime() + i * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        value: 100 + Math.random() * 20
      })),
      bea: Array.from({ length: 8 }, (_, i) => ({
        date: new Date(new Date(startDate).getTime() + i * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        value: 200 + Math.random() * 30
      }))
    };
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return mockData;
  }, []);

  return {
    getIndicatorDetails
  };
};

export default useDataService;
