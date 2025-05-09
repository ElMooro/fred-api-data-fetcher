import axios from "axios";
import CONFIG from "../config";

// Base URL for the proxy server
const API_BASE_URL = "http://localhost:5000/api";

// Generic API fetch function with caching
const cache = new Map();

const fetchWithCache = async (cacheKey, fetchFunction) => {
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  
  try {
    const data = await fetchFunction();
    cache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error(`Error fetching ${cacheKey}:`, error);
    throw error;
  }
};

// Create API service for all the requested data sources
const ApiService = {
  // Check API status
  checkStatus: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/status`);
      console.log("API Status:", response.data);
      return response.data;
    } catch (error) {
      console.error("Failed to check API status:", error);
      return { status: "offline", error: error.message };
    }
  },
  
  // FRED API
  fred: {
    fetchSeries: async (seriesId, startDate, endDate, frequency = "") => {
      const cacheKey = `fred_${seriesId}_${startDate}_${endDate}_${frequency}`;
      return fetchWithCache(cacheKey, async () => {
        try {
          // Use the proxy server
          const response = await axios.get(`${API_BASE_URL}/fred/${seriesId}`, {
            params: {
              start_date: startDate,
              end_date: endDate,
              frequency: frequency
            }
          });
          
          // Log successful response
          console.log(`FRED API response for ${seriesId}:`, response.data);
          return response.data.observations;
        } catch (error) {
          console.error(`Error fetching FRED data for ${seriesId}:`, error);
          // For debugging - fall back to mock data
          return [
            { date: "2023-01-01", value: "24103.372" },
            { date: "2023-04-01", value: "24368.627" },
            { date: "2023-07-01", value: "24752.365" },
            { date: "2023-10-01", value: "25200.922" },
            { date: "2024-01-01", value: "25515.1" }
          ];
        }
      });
    }
  },
  
  // BEA API
  bea: {
    fetchData: async (datasetName, params) => {
      const cacheKey = `bea_${datasetName}_${JSON.stringify(params)}`;
      return fetchWithCache(cacheKey, async () => {
        try {
          // Use the proxy server
          const response = await axios.get(`${API_BASE_URL}/bea`, { 
            params: {
              TableName: params.TableName,
              Frequency: params.Frequency,
              Year: params.Year
            }
          });
          
          console.log(`BEA API response for ${datasetName}:`, response.data);
          return response.data.BEAAPI.Results;
        } catch (error) {
          console.error(`Error fetching BEA data for ${datasetName}:`, error);
          // Return mock data for visualization testing
          return {
            Data: [
              { TimePeriod: "2023-01-01", DataValue: "24103.372" },
              { TimePeriod: "2023-04-01", DataValue: "24368.627" },
              { TimePeriod: "2023-07-01", DataValue: "24752.365" },
              { TimePeriod: "2023-10-01", DataValue: "25200.922" },
              { TimePeriod: "2024-01-01", DataValue: "25515.1" }
            ]
          };
        }
      });
    }
  },
  
  // BLS API
  bls: {
    fetchTimeSeries: async (seriesIds, startYear, endYear) => {
      const cacheKey = `bls_${seriesIds.join("_")}_${startYear}_${endYear}`;
      return fetchWithCache(cacheKey, async () => {
        try {
          // Use the proxy server
          const response = await axios.post(`${API_BASE_URL}/bls`, {
            seriesid: seriesIds,
            startyear: startYear,
            endyear: endYear
          });
          
          console.log(`BLS API response for ${seriesIds}:`, response.data);
          return response.data.Results?.series || [];
        } catch (error) {
          console.error(`Error fetching BLS data for ${seriesIds}:`, error);
          // Return mock data
          return [{
            data: [
              { year: "2023", period: "M01", value: "3.4" },
              { year: "2023", period: "M02", value: "3.6" },
              { year: "2023", period: "M03", value: "3.5" },
              { year: "2023", period: "M04", value: "3.4" },
              { year: "2023", period: "M05", value: "3.7" }
            ]
          }];
        }
      });
    }
  },
  
  // Census API
  census: {
    fetchData: async (dataset, year, variables) => {
      const cacheKey = `census_${dataset}_${year}_${variables.join("_")}`;
      return fetchWithCache(cacheKey, async () => {
        try {
          // Use the proxy server
          const response = await axios.get(`${API_BASE_URL}/census/${year}/${dataset}`, {
            params: {
              get: variables.join(",")
            }
          });
          
          console.log(`Census API response for ${dataset} ${year}:`, response.data);
          return response.data;
        } catch (error) {
          console.error(`Error fetching Census data for ${dataset}:`, error);
          // Return mock data
          return [
            ["NAME", "POP"],
            ["United States", "331449281"]
          ];
        }
      });
    }
  },
  
  // Other API implementations remain the same...
  treasury: {
    fetchInterestRates: async (params = {}) => {
      const cacheKey = `treasury_rates_${JSON.stringify(params)}`;
      return fetchWithCache(cacheKey, async () => {
        try {
          const response = await axios.get(CONFIG.API_ENDPOINTS.TREASURY_RATES, { params });
          return response.data.data;
        } catch (error) {
          console.error("Error fetching Treasury rates:", error);
          // Return mock data
          return [
            { record_date: "2023-05-01", avg_interest_rate_amt: "4.36", security_type_desc: "Treasury Bills" },
            { record_date: "2023-06-01", avg_interest_rate_amt: "4.38", security_type_desc: "Treasury Bills" },
            { record_date: "2023-07-01", avg_interest_rate_amt: "4.40", security_type_desc: "Treasury Bills" }
          ];
        }
      });
    }
  }
};

export default ApiService;
