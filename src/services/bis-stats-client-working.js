/**
 * BIS SDMX RESTful API Client - Working Version
 * 
 * A client for accessing the Bank for International Settlements (BIS) statistical data
 * via their SDMX RESTful API v2, focusing on endpoints that are confirmed to work.
 * 
 * @version 1.0.0
 */

class BisStatsClient {
  /**
   * Creates a new BIS Stats API client
   * 
   * @param {Object} options - Configuration options
   * @param {string} [options.baseUrl='https://stats.bis.org/api/v2'] - API base URL
   * @param {number} [options.timeout=30000] - Request timeout in milliseconds
   * @param {boolean} [options.enableCaching=true] - Enable response caching
   * @param {number} [options.cacheTTL=3600000] - Cache time-to-live in milliseconds (1 hour)
   * @param {string} [options.fallbackUrl='https://stats.bis.org/statsweb/rest'] - Fallback URL for data retrieval
   */
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'https://stats.bis.org/api/v2';
    this.fallbackUrl = options.fallbackUrl || 'https://stats.bis.org/statsweb/rest';
    this.timeout = options.timeout || 30000;
    this.enableCaching = options.enableCaching !== false;
    this.cacheTTL = options.cacheTTL || 3600000; // 1 hour default
    
    // Internal cache store
    this.cache = new Map();
    
    // Known datasets from BIS
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
    // Add format parameter if specified and not already included in params
    const requestParams = { 
      ...params
    };
    
    if (format && !params.format) {
      requestParams.format = format;
    }
    
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
      
      const headers = { 'User-Agent': 'BisStatsClient/1.0.0' };
      
      // Set Accept header based on format
      if (format === 'json') {
        headers['Accept'] = 'application/json';
      } else if (format === 'xml') {
        headers['Accept'] = 'application/xml';
      } else if (format === 'csv') {
        headers['Accept'] = 'text/csv';
      }
      
      const response = await fetch(url, { 
        method: 'GET',
        headers,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      let data;
      let contentType = response.headers.get('content-type') || '';
      
      // Parse response based on content type
      if (contentType.includes('json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      const result = {
        success: response.ok,
        status: response.status,
        url,
        contentType,
        data,
        error: response.ok ? null : this.extractErrorMessage(data)
      };
      
      // Cache successful response if caching is enabled
      if (response.ok && this.enableCaching) {
        this.cacheResponse(url, result);
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        status: 0,
        url,
        contentType: '',
        data: null,
        error: error.message
      };
    }
  }
  
  /**
   * Extracts error message from error response
   * 
   * @private
   * @param {string|Object} errorData - Error response data
   * @returns {string} Extracted error message
   */
  extractErrorMessage(errorData) {
    if (typeof errorData === 'string') {
      // Try to extract error from XML
      const codeMatch = errorData.match(/code="(\d+)"/);
      const textMatch = errorData.match(/<com:Text>([^<]+)<\/com:Text>/);
      
      if (codeMatch && textMatch) {
        return `Error ${codeMatch[1]}: ${textMatch[1]}`;
      }
      
      return errorData;
    } else if (errorData && errorData.error) {
      return errorData.error;
    }
    
    return 'Unknown error';
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

  /**
   * Lists all known datasets
   * 
   * @returns {Array<string>} Array of dataset IDs
   */
  listDatasets() {
    return [...this.knownDatasets];
  }
  
  /**
   * Gets structure information
   * 
   * @param {Object} [params={}] - Additional query parameters
   * @returns {Promise<Object>} Structure information
   */
  async getStructure(params = {}) {
    return await this.fetchData('structure', params, 'json');
  }
  
  /**
   * Gets all structures
   * 
   * @param {Object} [params={}] - Additional query parameters
   * @returns {Promise<Object>} All structure information
   */
  async getAllStructures(params = {}) {
    return await this.fetchData('structure/all', params, 'json');
  }
  
  /**
   * Gets all dataflow structures
   * 
   * @param {Object} [params={}] - Additional query parameters
   * @returns {Promise<Object>} Dataflow structure information
   */
  async getDataflowStructures(params = {}) {
    return await this.fetchData('structure/dataflow/BIS/all/latest', params, 'json');
  }
  
  /**
   * Gets data for a specific dataset using fallback URL
   * 
   * @param {string} datasetId - Dataset ID (e.g., 'WS_EER', 'WS_SPP')
   * @param {string} [format='csv'] - Response format (json, xml, csv)
   * @param {Object} [params={}] - Additional query parameters
   * @returns {Promise<Object>} Dataset data
   */
  async getDataset(datasetId, format = 'csv', params = {}) {
    // Use the fallback URL pattern for data retrieval
    const requestParams = { ...params, format };
    const queryParams = new URLSearchParams();
    
    Object.entries(requestParams).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value);
      }
    });
    
    const queryString = queryParams.toString();
    const url = `${this.fallbackUrl}/data/${datasetId}${queryString ? `?${queryString}` : ''}`;
    
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
      
      const headers = { 'User-Agent': 'BisStatsClient/1.0.0' };
      
      // Set Accept header based on format
      if (format === 'json') {
        headers['Accept'] = 'application/json';
      } else if (format === 'xml') {
        headers['Accept'] = 'application/xml';
      } else if (format === 'csv') {
        headers['Accept'] = 'text/csv';
      }
      
      const response = await fetch(url, { 
        method: 'GET',
        headers,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      let data;
      let contentType = response.headers.get('content-type') || '';
      
      // Parse response based on content type
      if (contentType.includes('json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      const result = {
        success: response.ok,
        status: response.status,
        url,
        contentType,
        data,
        error: response.ok ? null : this.extractErrorMessage(data)
      };
      
      // Cache successful response if caching is enabled
      if (response.ok && this.enableCaching) {
        this.cacheResponse(url, result);
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        status: 0,
        url,
        contentType: '',
        data: null,
        error: error.message
      };
    }
  }
  
  /**
   * Gets data for BIS Effective Exchange Rates dataset
   * 
   * @param {string} [format='csv'] - Response format
   * @param {Object} [params={}] - Additional query parameters
   * @returns {Promise<Object>} EER data
   */
  async getEffectiveExchangeRates(format = 'csv', params = {}) {
    return await this.getDataset('WS_EER', format, params);
  }
  
  /**
   * Gets data for BIS Property Prices dataset
   * 
   * @param {string} [format='csv'] - Response format
   * @param {Object} [params={}] - Additional query parameters
   * @returns {Promise<Object>} Property prices data
   */
  async getPropertyPrices(format = 'csv', params = {}) {
    return await this.getDataset('WS_SPP', format, params);
  }
  
  /**
   * Gets data for BIS Total Credit dataset
   * 
   * @param {string} [format='csv'] - Response format
   * @param {Object} [params={}] - Additional query parameters
   * @returns {Promise<Object>} Total credit data
   */
  async getTotalCredit(format = 'csv', params = {}) {
    return await this.getDataset('WS_TC', format, params);
  }
  
  /**
   * Gets data for BIS Locational Banking Statistics dataset
   * 
   * @param {string} [format='csv'] - Response format
   * @param {Object} [params={}] - Additional query parameters
   * @returns {Promise<Object>} LBS data
   */
  async getLocationalBankingStats(format = 'csv', params = {}) {
    return await this.getDataset('WS_LBS_D_PUB', format, params);
  }
  
  /**
   * Extracts dataflows from JSON response
   * 
   * @param {Object} response - API response from getDataflowStructures
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
  
  /**
   * Parse CSV data into an array of objects
   * 
   * @param {string} csvString - CSV string data
   * @param {Object} [options={}] - Parsing options
   * @returns {Array<Object>} Parsed data as array of objects
   */
  parseCSV(csvString, options = {}) {
    if (!csvString) return [];
    
    // Split into lines
    const lines = csvString.split(/\r?\n/);
    if (lines.length === 0) return [];
    
    // Extract header line
    const headerLine = lines[0];
    const headers = headerLine.split(',').map(h => h.trim().replace(/^"(.*)"$/, '$1'));
    
    // Parse data lines
    const result = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Split values handling quoted values with commas
      const values = [];
      let inQuotes = false;
      let currentValue = '';
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(currentValue.replace(/^"(.*)"$/, '$1'));
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      
      // Add the last value
      values.push(currentValue.replace(/^"(.*)"$/, '$1'));
      
      // Create object from headers and values
      if (values.length === headers.length) {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = values[index];
        });
        result.push(obj);
      }
    }
    
    return result;
  }
}

/**
 * Test method for the BIS Stats client
 */
async function testBisStatsClient() {
  const client = new BisStatsClient();
  
  try {
    console.log('Testing BIS SDMX RESTful API client (Working Version)...');
    
    // Test structure endpoints
    console.log('\nGetting dataflow structures...');
    const dataflowsResponse = await client.getDataflowStructures();
    
    console.log('Dataflow structures request success:', dataflowsResponse.success);
    console.log('Dataflow structures status code:', dataflowsResponse.status);
    
    if (dataflowsResponse.success) {
      console.log('Successfully retrieved dataflow structures');
      
      // Extract dataflows
      const dataflows = client.extractDataflows(dataflowsResponse);
      console.log(`Found ${dataflows.length} dataflows`);
      
      if (dataflows.length > 0) {
        console.log('\nSample dataflows:');
        dataflows.slice(0, 5).forEach((flow, index) => {
          console.log(`${index + 1}. ${flow.id} - ${flow.name || 'No name'}`);
        });
      }
    } else {
      console.log('Failed to retrieve dataflow structures:', dataflowsResponse.error);
    }
    
    // Test data retrieval using fallback URL
    console.log('\nTesting data retrieval with fallback URL...');
    const testDatasets = ['WS_EER', 'WS_SPP', 'WS_TC'];
    
    for (const datasetId of testDatasets) {
      console.log(`\nTesting dataset: ${datasetId}`);
      
      // Get data in CSV format
      console.log(`Fetching data for ${datasetId}...`);
      const dataResponse = await client.getDataset(datasetId, 'csv');
      
      console.log('Data request success:', dataResponse.success);
      console.log('Data status code:', dataResponse.status);
      console.log('Content-Type:', dataResponse.contentType);
      
      if (dataResponse.success) {
        console.log('Successfully retrieved data');
        
        // Check data
        if (typeof dataResponse.data === 'string') {
          const lines = dataResponse.data.split('\n');
          console.log(`Data contains ${lines.length} lines`);
          
          if (lines.length > 0) {
            console.log('\nFirst few lines:');
            lines.slice(0, 3).forEach(line => {
              console.log(`> ${line}`);
            });
            
            // Try to parse CSV
            console.log('\nParsing CSV data...');
            const parsedData = client.parseCSV(dataResponse.data);
            console.log(`Parsed ${parsedData.length} records`);
            
            if (parsedData.length > 0) {
              console.log('\nSample record:');
              console.log(parsedData[0]);
            }
          }
        } else {
          console.log('Data is not in string format');
        }
      } else {
        console.log('Data retrieval error:', dataResponse.error);
      }
    }
    
    return {
      success: true,
      message: 'BIS SDMX API client test completed'
    };
  } catch (error) {
    console.error('Error in BIS Stats client test:', error.message);
    throw error;
  }
}

module.exports = {
  BisStatsClient,
  testBisStatsClient
};
