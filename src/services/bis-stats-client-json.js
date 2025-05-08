/**
 * BIS SDMX RESTful API Client (JSON format)
 * 
 * A client for accessing the Bank for International Settlements (BIS) statistical data
 * via their SDMX RESTful API v2 using JSON format.
 * 
 * @version 1.0.0
 */

class BisStatsClientJson {
  /**
   * Creates a new BIS Stats API JSON client
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
  }

  /**
   * Fetches data from the BIS SDMX API in JSON format
   * 
   * @private
   * @param {string} endpoint - API endpoint path
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Result object with JSON response and success status
   */
  async fetchData(endpoint, params = {}) {
    // Ensure format=json is included in params
    const jsonParams = { 
      ...params,
      format: 'json'  // Request JSON format explicitly
    };
    
    // Build the URL with query parameters
    const queryParams = new URLSearchParams();
    
    // Add parameters
    Object.entries(jsonParams).forEach(([key, value]) => {
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
          'Accept': 'application/json',
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
      
      // Parse response as JSON
      const data = await response.json();
      
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

  // BIS SDMX API methods

  /**
   * Gets all dataflows
   * 
   * @param {Object} [params={}] - Additional query parameters
   * @returns {Promise<Object>} Dataflow information
   */
  async getDataflows(params = {}) {
    return await this.fetchData('dataflow/BIS/all/latest', params);
  }
  
  /**
   * Gets data for a specific dataflow
   * 
   * @param {string} dataflowId - Dataflow ID (e.g., 'WS_EER', 'WS_SPP')
   * @param {Object} [params={}] - Additional query parameters
   * @returns {Promise<Object>} Data result
   */
  async getData(dataflowId, params = {}) {
    return await this.fetchData(`data/BIS/BIS/${dataflowId}/latest/all`, params);
  }
  
  /**
   * Gets structure for a specific dataflow
   * 
   * @param {string} dataflowId - Dataflow ID (e.g., 'WS_EER', 'WS_SPP')
   * @param {Object} [params={}] - Additional query parameters
   * @returns {Promise<Object>} Structure information
   */
  async getDataflowStructure(dataflowId, params = {}) {
    return await this.fetchData(`structure/dataflow/BIS/${dataflowId}/latest`, params);
  }
  
  /**
   * Gets all codelists
   * 
   * @param {Object} [params={}] - Additional query parameters
   * @returns {Promise<Object>} Codelist information
   */
  async getCodelists(params = {}) {
    return await this.fetchData('structure/codelist/BIS/all/latest', params);
  }
  
  /**
   * Gets a specific codelist
   * 
   * @param {string} codelistId - Codelist ID
   * @param {Object} [params={}] - Additional query parameters
   * @returns {Promise<Object>} Specific codelist information
   */
  async getCodelist(codelistId, params = {}) {
    return await this.fetchData(`structure/codelist/BIS/${codelistId}/latest`, params);
  }
  
  /**
   * Gets data structure definitions
   * 
   * @param {Object} [params={}] - Additional query parameters
   * @returns {Promise<Object>} Data structure definitions
   */
  async getDataStructures(params = {}) {
    return await this.fetchData('structure/datastructure/BIS/all/latest', params);
  }
  
  /**
   * Gets a specific data structure definition
   * 
   * @param {string} dsdId - Data structure definition ID
   * @param {Object} [params={}] - Additional query parameters
   * @returns {Promise<Object>} Specific data structure definition
   */
  async getDataStructure(dsdId, params = {}) {
    return await this.fetchData(`structure/datastructure/BIS/${dsdId}/latest`, params);
  }

  /**
   * Extracts dataflow information from JSON response
   * 
   * @param {Object} response - API response from getDataflows
   * @returns {Array<Object>} Array of dataflow objects
   */
  extractDataflows(response) {
    if (!response.success || !response.data) {
      return [];
    }
    
    try {
      // Navigate the JSON structure to get to dataflows
      const dataflows = response.data.data?.dataflows || [];
      
      // Map to a more convenient structure
      return dataflows.map(df => ({
        id: df.id,
        name: df.name,
        names: df.names,
        description: df.description,
        version: df.version,
        agencyID: df.agencyID
      }));
    } catch (error) {
      console.error('Error extracting dataflows:', error);
      return [];
    }
  }
}

/**
 * Test method for the BIS Stats JSON client
 */
async function testBisStatsClientJson() {
  const client = new BisStatsClientJson();
  
  try {
    console.log('Testing BIS SDMX RESTful API with JSON format...');
    
    // Test dataflows
    console.log('\nFetching available dataflows...');
    const dataflowsResponse = await client.getDataflows();
    
    console.log('Dataflows request success:', dataflowsResponse.success);
    console.log('Dataflows status code:', dataflowsResponse.status);
    
    if (dataflowsResponse.success) {
      // Extract dataflows
      const dataflows = client.extractDataflows(dataflowsResponse);
      console.log(`Found ${dataflows.length} dataflows`);
      
      // Show first few dataflows
      if (dataflows.length > 0) {
        console.log('\nSample dataflows:');
        dataflows.slice(0, 5).forEach((flow, index) => {
          console.log(`${index + 1}. ${flow.id} - ${flow.name || 'No name'}`);
        });
        
        // Try to get data for a sample dataflow
        const testDataflowId = dataflows[0].id;
        console.log(`\nFetching data for dataflow: ${testDataflowId}`);
        const dataResponse = await client.getData(testDataflowId);
        
        console.log('Data request success:', dataResponse.success);
        console.log('Data status code:', dataResponse.status);
        
        if (dataResponse.success) {
          console.log('Successfully retrieved data');
          
          // Print a small sample of the data
          if (dataResponse.data) {
            console.log('\nData structure:');
            console.log(JSON.stringify(Object.keys(dataResponse.data), null, 2));
            
            // Try to extract actual data points
            const datasets = dataResponse.data.data?.dataSets || [];
            console.log(`Data contains ${datasets.length} datasets`);
            
            if (datasets.length > 0) {
              const observations = datasets[0].observations || {};
              const obsCount = Object.keys(observations).length;
              console.log(`First dataset contains ${obsCount} observations`);
            }
          }
        } else {
          console.log('Data retrieval error:', dataResponse.error);
        }
        
        // Try to get structure for a sample dataflow
        console.log(`\nFetching structure for dataflow: ${testDataflowId}`);
        const structureResponse = await client.getDataflowStructure(testDataflowId);
        
        console.log('Structure request success:', structureResponse.success);
        console.log('Structure status code:', structureResponse.status);
        
        if (structureResponse.success) {
          console.log('Successfully retrieved structure');
        } else {
          console.log('Structure retrieval error:', structureResponse.error);
        }
      }
    } else {
      console.log('Dataflows retrieval error:', dataflowsResponse.error);
    }
    
    return {
      success: true,
      message: 'BIS SDMX API JSON client test completed'
    };
  } catch (error) {
    console.error('Error in BIS Stats JSON client test:', error.message);
    throw error;
  }
}

module.exports = {
  BisStatsClientJson,
  testBisStatsClientJson
};
