/**
 * BIS SDMX RESTful API Direct Client
 * 
 * A client for directly accessing the Bank for International Settlements (BIS) 
 * statistical datasets via their API.
 * 
 * This client bypasses standard SDMX navigation and directly accesses known datasets.
 * 
 * @version 1.0.0
 */

class BisStatsDirectClient {
  /**
   * Creates a new BIS Stats Direct client
   * 
   * @param {Object} options - Configuration options
   * @param {string} [options.baseUrl='https://stats.bis.org/api/v2'] - API base URL
   * @param {number} [options.timeout=30000] - Request timeout in milliseconds
   * @param {boolean} [options.enableCaching=true] - Enable response caching
   * @param {number} [options.cacheTTL=3600000] - Cache time-to-live in milliseconds (1 hour)
   */
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'https://stats.bis.org/api/v2';
    this.timeout = options.timeout || 30000;
    this.enableCaching = options.enableCaching !== false;
    this.cacheTTL = options.cacheTTL || 3600000; // 1 hour default
    
    // Internal cache store
    this.cache = new Map();
    
    // Known datasets based on BIS documentation and exploration
    this.knownDatasets = [
      'WS_CPMI_CT2',
      'WS_CPMI_DEVICES',
      'WS_CPMI_INSTITUT',
      'WS_CPMI_MACRO',
      'WS_CPMI_PARTICIP',
      'WS_CPMI_SYSTEMS',
      'WS_CPP',
      'WS_CREDIT_GAP',
      'WS_DEBT_SEC2_PUB',
      'WS_DER_OTC_TOV',
      'WS_DPP',
      'WS_DSR',
      'WS_EER',
      'WS_GLI',
      'WS_LBS_D_PUB',
      'WS_LONG_CPI',
      'WS_NA_SEC_C3',
      'WS_NA_SEC_DSS',
      'WS_OTC_DERIV2',
      'WS_SPP',
      'WS_TC',
      'WS_XRU',
      'WS_XTD_DERIV'
    ];
    
    // Dataset descriptions
    this.datasetDescriptions = {
      'WS_CPMI_CT2': 'CPMI comparative tables type 2',
      'WS_CPMI_DEVICES': 'CPMI payment devices (T4)',
      'WS_CPMI_INSTITUT': 'CPMI institutions (T3)',
      'WS_CPMI_MACRO': 'CPMI macro (T1,T2)',
      'WS_CPMI_PARTICIP': 'CPMI participants (T7,T10,T12,T15)',
      'WS_CPMI_SYSTEMS': 'CPMI systems (T8,T9,T11,T13,T14,T16,T17,T18,T19)',
      'WS_CPP': 'Commercial property prices',
      'WS_CREDIT_GAP': 'BIS credit-to-GDP gaps',
      'WS_DEBT_SEC2_PUB': 'BIS international debt securities (BIS-compiled)',
      'WS_DER_OTC_TOV': 'OTC derivatives turnover',
      'WS_DPP': 'Detailed residential property prices',
      'WS_DSR': 'BIS debt service ratio',
      'WS_EER': 'BIS effective exchange rates',
      'WS_GLI': 'Global liquidity indicators',
      'WS_LBS_D_PUB': 'BIS locational banking',
      'WS_LONG_CPI': 'BIS long consumer prices',
      'WS_NA_SEC_C3': 'BIS debt securities statistics',
      'WS_NA_SEC_DSS': 'BIS Debt securities statistics',
      'WS_OTC_DERIV2': 'OTC derivatives outstanding',
      'WS_SPP': 'Selected residential property prices',
      'WS_TC': 'BIS long series on total credit',
      'WS_XRU': 'US dollar exchange rates',
      'WS_XTD_DERIV': 'Exchange traded derivatives'
    };
  }

  /**
   * Fetches data from the BIS API
   * 
   * @private
   * @param {string} endpoint - API endpoint path
   * @param {Object} params - Query parameters
   * @param {string} [format='json'] - Response format (json, xml, csv)
   * @returns {Promise<Object>} Result object with response and success status
   */
  async fetchData(endpoint, params = {}, format = 'json') {
    // Add format parameter
    const requestParams = { 
      ...params,
      format  // Request format explicitly
    };
    
    // Build the URL with query parameters
    const queryParams = new URLSearchParams();
    
    // Add parameters
    Object.entries(requestParams).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value);
      }
    });
    
    const queryString = queryParams.toString();
    const url = `${this.baseUrl}/${endpoint}${queryString ? `?${queryString}` : ''}`;
    
    // Check cache first if enabled
    if (this.enableCaching) {
      const cachedResponse = this.getCachedResponse(url);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const response = await fetch(url, { 
        method: 'GET',
        headers: { 
          'Accept': format === 'json' ? 'application/json' : 
                    format === 'xml' ? 'application/xml' : 'text/csv',
          'User-Agent': 'BisStatsClient/1.0.0'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Check if response is OK
      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          status: response.status,
          url,
          data: null,
          error: errorText || `HTTP Error ${response.status}: ${response.statusText}`
        };
      }
      
      let data;
      if (format === 'json') {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      const result = {
        success: true,
        status: response.status,
        url,
        data,
        error: null
      };
      
      // Cache successful response if caching is enabled
      if (this.enableCaching) {
        this.cacheResponse(url, result);
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        status: 0,
        url,
        data: null,
        error: error.message
      };
    }
  }

  /**
   * Cache implementation (similar to previous versions)
   */
  getCachedResponse(cacheKey) {
    if (!this.enableCaching) return null;
    
    const cached = this.cache.get(cacheKey);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > this.cacheTTL) {
      this.cache.delete(cacheKey);
      return null;
    }
    
    return cached.data;
  }
  
  cacheResponse(cacheKey, data) {
    if (!this.enableCaching) return;
    
    this.cache.set(cacheKey, {
      timestamp: Date.now(),
      data
    });
    
    if (this.cache.size > 100) {
      const keysIterator = this.cache.keys();
      for (let i = 0; i < 20; i++) {
        const oldestKey = keysIterator.next().value;
        this.cache.delete(oldestKey);
      }
    }
  }

  // BIS API methods

  /**
   * Lists all available datasets
   * 
   * @returns {Array<Object>} Array of dataset objects with id and description
   */
  listDatasets() {
    return this.knownDatasets.map(id => ({
      id,
      description: this.datasetDescriptions[id] || id
    }));
  }
  
  /**
   * Gets data for a specific dataset
   * 
   * @param {string} datasetId - Dataset ID (e.g., 'WS_EER', 'WS_SPP')
   * @param {Object} [params={}] - Additional query parameters
   * @param {string} [format='json'] - Response format (json, xml, csv)
   * @returns {Promise<Object>} Data result
   */
  async getDataset(datasetId, params = {}, format = 'json') {
    // To account for the actual BIS API structure, use 'data' endpoint
    return await this.fetchData(`data/BIS/BIS/${datasetId}/latest/all`, params, format);
  }
  
  /**
   * Tries to get metadata for a dataset (structure, dimensions, etc.)
   * 
   * @param {string} datasetId - Dataset ID
   * @param {Object} [params={}] - Additional query parameters
   * @returns {Promise<Object>} Metadata result
   */
  async getDatasetMetadata(datasetId, params = {}) {
    // First try the standard SDMX metadata endpoint
    const result = await this.fetchData(`structure/datastructure/BIS/${datasetId}/latest`, params);
    
    // If that fails, try schema endpoint
    if (!result.success) {
      return await this.fetchData(`schema/BIS/BIS/${datasetId}/latest`, params);
    }
    
    return result;
  }
  
  /**
   * Gets data availability information for a dataset
   * 
   * @param {string} datasetId - Dataset ID
   * @param {string} [dimensionId='all'] - Dimension ID to check availability for
   * @param {Object} [params={}] - Additional query parameters
   * @returns {Promise<Object>} Availability information
   */
  async getDatasetAvailability(datasetId, dimensionId = 'all', params = {}) {
    return await this.fetchData(`availability/BIS/BIS/${datasetId}/latest/all/${dimensionId}`, params);
  }
}

/**
 * Test method for the BIS Stats Direct client
 */
async function testBisStatsDirectClient() {
  const client = new BisStatsDirectClient();
  
  try {
    console.log('Testing BIS SDMX RESTful API Direct Client...');
    
    // List available datasets
    console.log('\nAvailable datasets:');
    const datasets = client.listDatasets();
    console.log(`Found ${datasets.length} known datasets`);
    
    // Show first few datasets
    datasets.slice(0, 5).forEach((ds, index) => {
      console.log(`${index + 1}. ${ds.id} - ${ds.description}`);
    });
    
    // Test a few known datasets
    const testDatasets = ['WS_EER', 'WS_SPP', 'WS_TC'];
    
    for (const datasetId of testDatasets) {
      console.log(`\nTesting dataset: ${datasetId}`);
      
      // Get data
      console.log(`Fetching data for ${datasetId}...`);
      const dataResponse = await client.getDataset(datasetId);
      
      console.log('Data request success:', dataResponse.success);
      console.log('Data status code:', dataResponse.status);
      
      if (dataResponse.success) {
        console.log('Successfully retrieved data');
        
        // Check data structure
        if (dataResponse.data && dataResponse.data.data) {
          const dataSets = dataResponse.data.data.dataSets || [];
          console.log(`Data contains ${dataSets.length} datasets`);
          
          if (dataSets.length > 0) {
            const observations = dataSets[0].observations || {};
            const obsCount = Object.keys(observations).length;
            console.log(`First dataset contains ${obsCount} observations`);
            
            // Show structure of first few observations
            const obsKeys = Object.keys(observations).slice(0, 3);
            if (obsKeys.length > 0) {
              console.log('Sample observation keys:', obsKeys);
            }
          }
        }
        
        // Try to get metadata
        console.log(`\nFetching metadata for ${datasetId}...`);
        const metadataResponse = await client.getDatasetMetadata(datasetId);
        
        console.log('Metadata request success:', metadataResponse.success);
        console.log('Metadata status code:', metadataResponse.status);
        
        if (metadataResponse.success) {
          console.log('Successfully retrieved metadata');
        } else {
          console.log('Metadata retrieval error:', metadataResponse.error);
        }
        
        // Try to get availability
        console.log(`\nFetching availability for ${datasetId}...`);
        const availabilityResponse = await client.getDatasetAvailability(datasetId);
        
        console.log('Availability request success:', availabilityResponse.success);
        console.log('Availability status code:', availabilityResponse.status);
        
        if (availabilityResponse.success) {
          console.log('Successfully retrieved availability information');
        } else {
          console.log('Availability retrieval error:', availabilityResponse.error);
        }
      } else {
        console.log('Data retrieval error:', dataResponse.error);
      }
    }
    
    return {
      success: true,
      message: 'BIS SDMX API Direct client test completed'
    };
  } catch (error) {
    console.error('Error in BIS Stats Direct client test:', error.message);
    throw error;
  }
}

module.exports = {
  BisStatsDirectClient,
  testBisStatsDirectClient
};
