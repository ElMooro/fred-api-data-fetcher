import axios from "axios";
import CONFIG from "../config";

// Generic API fetch function with caching
const cache = new Map();

const fetchWithCache = async (cacheKey: string, fetchFunction: () => Promise<any>) => {
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
  // FRED API
  fred: {
    fetchSeries: async (seriesId: string, startDate: string, endDate: string, frequency: string = "") => {
      const cacheKey = `fred_${seriesId}_${startDate}_${endDate}_${frequency}`;
      return fetchWithCache(cacheKey, async () => {
        const params: any = {
          series_id: seriesId,
          api_key: CONFIG.API_KEYS.FRED,
          file_type: "json",
          observation_start: startDate,
          observation_end: endDate,
        };
        
        if (frequency) {
          params.frequency = frequency;
        }
        
        const response = await axios.get(CONFIG.API_ENDPOINTS.FRED, { params });
        return response.data.observations;
      });
    }
  },
  
  // BEA API
  bea: {
    fetchData: async (datasetName: string, params: any) => {
      const cacheKey = `bea_${datasetName}_${JSON.stringify(params)}`;
      return fetchWithCache(cacheKey, async () => {
        const requestParams = {
          UserID: CONFIG.API_KEYS.BEA,
          method: "GetData",
          ResultFormat: "JSON",
          ...params
        };
        
        const response = await axios.get(CONFIG.API_ENDPOINTS.BEA, { params: requestParams });
        return response.data.BEAAPI.Results;
      });
    }
  },
  
  // BLS API
  bls: {
    fetchTimeSeries: async (seriesIds: string[], startYear: string, endYear: string) => {
      const cacheKey = `bls_${seriesIds.join("_")}_${startYear}_${endYear}`;
      return fetchWithCache(cacheKey, async () => {
        const requestBody = {
          seriesid: seriesIds,
          startyear: startYear,
          endyear: endYear,
          registrationkey: CONFIG.API_KEYS.BLS
        };
        
        const response = await axios.post(CONFIG.API_ENDPOINTS.BLS, requestBody);
        return response.data.Results?.series || [];
      });
    }
  },
  
  // Census API
  census: {
    fetchData: async (dataset: string, year: string, variables: string[]) => {
      const cacheKey = `census_${dataset}_${year}_${variables.join("_")}`;
      return fetchWithCache(cacheKey, async () => {
        const url = `${CONFIG.API_ENDPOINTS.CENSUS}/${year}/${dataset}?get=${variables.join(",")}&key=${CONFIG.API_KEYS.CENSUS}`;
        const response = await axios.get(url);
        return response.data;
      });
    }
  },
  
  // ECB API
  ecb: {
    fetchData: async (flowRef: string, key: string, params: any = {}) => {
      const cacheKey = `ecb_${flowRef}_${key}_${JSON.stringify(params)}`;
      return fetchWithCache(cacheKey, async () => {
        const url = `${CONFIG.API_ENDPOINTS.ECB}/${flowRef}/${key}`;
        const response = await axios.get(url, { 
          params,
          headers: {
            "Accept": "application/json"
          }
        });
        return response.data;
      });
    }
  },
  
  // BIS API
  bis: {
    fetchData: async (resource: string, params: any) => {
      const cacheKey = `bis_${resource}_${JSON.stringify(params)}`;
      return fetchWithCache(cacheKey, async () => {
        const url = `${CONFIG.API_ENDPOINTS.BIS}/${resource}`;
        const response = await axios.get(url, { params });
        return response.data;
      });
    }
  },
  
  // Treasury API - Average Interest Rates
  treasury: {
    fetchInterestRates: async (params: any = {}) => {
      const cacheKey = `treasury_rates_${JSON.stringify(params)}`;
      return fetchWithCache(cacheKey, async () => {
        const response = await axios.get(CONFIG.API_ENDPOINTS.TREASURY_RATES, { params });
        return response.data.data;
      });
    },
    
    fetchAuctions: async (params: any = {}) => {
      const cacheKey = `treasury_auctions_${JSON.stringify(params)}`;
      return fetchWithCache(cacheKey, async () => {
        const response = await axios.get(CONFIG.API_ENDPOINTS.TREASURY_AUCTIONS, { params });
        return response.data.data;
      });
    },
    
    fetchRecordAuctions: async (params: any = {}) => {
      const cacheKey = `treasury_record_auctions_${JSON.stringify(params)}`;
      return fetchWithCache(cacheKey, async () => {
        const response = await axios.get(CONFIG.API_ENDPOINTS.TREASURY_RECORD_AUCTIONS, { params });
        return response.data.data;
      });
    },
    
    fetchTreasuryDirectSecurities: async (params: any = {}) => {
      const cacheKey = `treasury_direct_securities_${JSON.stringify(params)}`;
      return fetchWithCache(cacheKey, async () => {
        const response = await axios.get(CONFIG.API_ENDPOINTS.TREASURY_DIRECT_SECURITIES, { params });
        return response.data.data;
      });
    },
    
    fetchBuybacks: async (params: any = {}) => {
      const cacheKey = `treasury_buybacks_${JSON.stringify(params)}`;
      return fetchWithCache(cacheKey, async () => {
        const response = await axios.get(CONFIG.API_ENDPOINTS.TREASURY_BUYBACKS, { params });
        return response.data.data;
      });
    }
  }
};

export default ApiService;
