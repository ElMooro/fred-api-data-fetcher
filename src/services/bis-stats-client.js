/**
 * BIS SDMX RESTful API Client
 * 
 * A client for accessing the Bank for International Settlements (BIS) statistical data
 * via their SDMX RESTful API (v1.4.0).
 * 
 * This client focuses on the working endpoints discovered through exploration:
 * - Metadata retrieval (dataflows, codelists, structures)
 * - Data retrieval with the correct format pattern
 * 
 * @version 2.0.0
 */

/**
 * BIS SDMX RESTful API Client
 */
class BisStatsClient {
  /**
   * Creates a new BIS Stats API client
   * 
   * @param {Object} options - Configuration options
   * @param {string} [options.baseUrl='https://stats.bis.org/api/v1'] - API base URL
   * @param {number} [options.timeout=30000] - Request timeout in milliseconds
   * @param {boolean} [options.enableCaching=true] - Enable response caching
   * @param {number} [options.cacheTTL=3600000] - Cache time-to-live in milliseconds (1 hour)
   */
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'https://stats.bis.org/api/v1';
    this.timeout = options.timeout || 30000;
    this.enableCaching = options.enableCaching !== false;
    this.cacheTTL = options.cacheTTL || 3600000; // 1 hour default
    
    // Internal cache store
    this.cache = new Map();
  }

  /**
   * Fetches data from the BIS SDMX API
   * 
   * @private
   * @param {string} endpoint - API endpoint path
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Result object with raw XML response and success status
   */
  async fetchData(endpoint, params = {}) {
    // Build the URL with query parameters
    const queryParams = new URLSearchParams();
    
    // Add parameters
    Object.entries(params).forEach(([key, value]) => {
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
          'Accept': 'application/xml',
          'User-Agent': 'BisStatsClient/2.0.0'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Get response as text
      const responseText = await response.text();
      
      // Check if response contains error message
      const isError = responseText.includes('ErrorMessage') || !response.ok;
      
      const result = {
        success: !isError,
        status: response.status,
        url,
        data: responseText,
        error: isError ? this.extractErrorMessage(responseText) : null
      };
      
      // Cache successful response if caching is enabled
      if (!isError && this.enableCaching) {
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
   * Extracts error message from error response
   * 
   * @private
   * @param {string} errorText - Error response text
   * @returns {string} Extracted error message
   */
  extractErrorMessage(errorText) {
    // Simple regex to extract error message and code
    const codeMatch = errorText.match(/code="(\d+)"/);
    const textMatch = errorText.match(/<com:Text>([^<]+)<\/com:Text>/);
    
    if (codeMatch && textMatch) {
      return `Error ${codeMatch[1]}: ${textMatch[1]}`;
    }
    
    return errorText;
  }

  /**
   * Gets a cached response if available and not expired
   * 
   * @private
   * @param {string} cacheKey - The cache key (URL)
   * @returns {Object|null} Cached response or null if not found/expired
   */
  getCachedResponse(cacheKey) {
    if (!this.enableCaching) return null;
    
    const cached = this.cache.get(cacheKey);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > this.cacheTTL) {
      // Cache expired, remove it
      this.cache.delete(cacheKey);
      return null;
    }
    
    return cached.data;
  }

  /**
   * Caches a response
   * 
   * @private
   * @param {string} cacheKey - The cache key (URL)
   * @param {Object} data - The response data to cache
   */
  cacheResponse(cacheKey, data) {
    if (!this.enableCaching) return;
    
    this.cache.set(cacheKey, {
      timestamp: Date.now(),
      data
    });
    
    // Implement cache size limits to prevent memory issues
    if (this.cache.size > 100) {
      // Remove oldest entries when cache gets too large
      const keysIterator = this.cache.keys();
      for (let i = 0; i < 20; i++) {
        const oldestKey = keysIterator.next().value;
        this.cache.delete(oldestKey);
      }
    }
  }

  // METADATA METHODS - These all work based on our exploration

  /**
   * Gets all available dataflows
   * 
   * @param {Object} [params={}] - Query parameters
   * @returns {Promise<Object>} Dataflow information
   */
  async getAllDataflows(params = {}) {
    const result = await this.fetchData('dataflow/BIS/all/latest', params);
    return result;
  }
  
  /**
   * Gets information about a specific dataflow
   * 
   * @param {string} dataflowId - Dataflow ID (e.g., 'CBS', 'LBS')
   * @param {Object} [params={}] - Query parameters
   * @returns {Promise<Object>} Specific dataflow information
   */
  async getDataflow(dataflowId, params = {}) {
    const result = await this.fetchData(`dataflow/BIS/${dataflowId}/latest`, params);
    return result;
  }
  
  /**
   * Gets all available codelists
   * 
   * @param {Object} [params={}] - Query parameters
   * @returns {Promise<Object>} Codelist information
   */
  async getAllCodelists(params = {}) {
    const result = await this.fetchData('codelist/BIS/all/latest', params);
    return result;
  }
  
  /**
   * Gets information about a specific codelist
   * 
   * @param {string} codelistId - Codelist ID (e.g., 'CL_FREQ')
   * @param {Object} [params={}] - Query parameters
   * @returns {Promise<Object>} Specific codelist information
   */
  async getCodelist(codelistId, params = {}) {
    const result = await this.fetchData(`codelist/BIS/${codelistId}/latest`, params);
    return result;
  }
  
  /**
   * Gets all available structures
   * 
   * @param {Object} [params={}] - Query parameters
   * @returns {Promise<Object>} Structure information
   */
  async getAllStructures(params = {}) {
    const result = await this.fetchData('structure/all/all/latest', params);
    return result;
  }

  // DATA METHODS - These use the format that appears valid based on our exploration

  /**
   * Gets data for a specific dataflow with frequency
   * 
   * @param {string} dataflowId - Dataflow ID (e.g., 'CBS', 'LBS')
   * @param {string} frequency - Frequency code (e.g., 'A', 'Q', 'M', 'D')
   * @param {Object} [params={}] - Additional query parameters
   * @param {string} [params.startPeriod] - Start period (e.g., '2020')
   * @param {string} [params.endPeriod] - End period (e.g., '2022')
   * @returns {Promise<Object>} Data result
   */
  async getData(dataflowId, frequency, params = {}) {
    // Format is data/BIS:DATAFLOW_ID/FREQUENCY/all based on our exploration
    const result = await this.fetchData(`data/BIS:${dataflowId}/${frequency}/all`, params);
    return result;
  }
  
  /**
   * Gets data for a specific dataflow with more detailed key
   * 
   * @param {string} dataflowId - Dataflow ID (e.g., 'CBS', 'LBS')
   * @param {string} key - Key string specifying dimensions
   * @param {Object} [params={}] - Additional query parameters
   * @returns {Promise<Object>} Data result
   */
  async getDataWithKey(dataflowId, key, params = {}) {
    // Uses more specific key pattern
    const result = await this.fetchData(`data/BIS:${dataflowId}/${key}/all`, params);
    return result;
  }

  // UTILITY METHODS

  /**
   * Extracts dataflow information from XML response
   * 
   * @param {Object} response - API response from getDataflow or getAllDataflows
   * @returns {Array<Object>} Extracted dataflow information
   */
  extractDataflows(response) {
    if (!response.success || !response.data) {
      return [];
    }
    
    const dataflows = [];
    const xml = response.data;
    
    // Use regex to extract dataflow information
    const dataflowRegex = /<str:Dataflow[^>]*id="([^"]*)"[^>]*agencyID="([^"]*)"[^>]*version="([^"]*)"[^>]*>/g;
    const nameRegex = /<com:Name[^>]*>([^<]*)<\/com:Name>/g;
    
    let dataflowMatch;
    const names = [];
    
    // Extract all names first
    let nameMatch;
    while ((nameMatch = nameRegex.exec(xml)) !== null) {
      names.push(nameMatch[1]);
    }
    
    // Then extract dataflows and match with names
    let nameIndex = 0;
    while ((dataflowMatch = dataflowRegex.exec(xml)) !== null) {
      dataflows.push({
        id: dataflowMatch[1],
        agency: dataflowMatch[2],
        version: dataflowMatch[3],
        name: nameIndex < names.length ? names[nameIndex] : dataflowMatch[1]
      });
      nameIndex++;
    }
    
    return dataflows;
  }
  
  /**
   * Extracts codelist information from XML response
   * 
   * @param {Object} response - API response from getCodelist or getAllCodelists
   * @returns {Array<Object>} Extracted codelist information
   */
  extractCodelists(response) {
    if (!response.success || !response.data) {
      return [];
    }
    
    const codelists = [];
    const xml = response.data;
    
    // Use regex to extract codelist information
    const codelistRegex = /<str:Codelist[^>]*id="([^"]*)"[^>]*agencyID="([^"]*)"[^>]*version="([^"]*)"[^>]*>/g;
    
    let codelistMatch;
    while ((codelistMatch = codelistRegex.exec(xml)) !== null) {
      const codelistId = codelistMatch[1];
      
      // Extract codes for this codelist
      const codeRegex = new RegExp(`<str:Code[^>]*id="([^"]*)"[^>]*>[\\s\\S]*?<com:Name[^>]*>([^<]*)<\\/com:Name>[\\s\\S]*?<\\/str:Code>`, 'g');
      const codes = [];
      
      let codeMatch;
      while ((codeMatch = codeRegex.exec(xml)) !== null) {
        codes.push({
          id: codeMatch[1],
          name: codeMatch[2]
        });
      }
      
      codelists.push({
        id: codelistId,
        agency: codelistMatch[2],
        version: codelistMatch[3],
        codes
      });
    }
    
    return codelists;
  }
  
  /**
   * Extracts data series from XML response
   * 
   * @param {Object} response - API response from getData or getDataWithKey
   * @returns {Array<Object>} Extracted data series
   */
  extractDataSeries(response) {
    if (!response.success || !response.data) {
      return [];
    }
    
    const series = [];
    const xml = response.data;
    
    // This is a simplified extraction that may need to be adjusted based on actual data format
    // Based on common SDMX XML data formats
    
    // Extract Series elements
    const seriesRegex = /<(gen|data):Series[^>]*>[\s\S]*?<\/(gen|data):Series>/g;
    
    let seriesMatch;
    while ((seriesMatch = seriesRegex.exec(xml)) !== null) {
      const seriesXml = seriesMatch[0];
      
      // Extract dimensions (key values)
      const dimensions = {};
      const dimensionRegex = /<(gen|data):Value[^>]*concept="([^"]*)"[^>]*value="([^"]*)"[^>]*>/g;
      
      let dimensionMatch;
      while ((dimensionMatch = dimensionRegex.exec(seriesXml)) !== null) {
        dimensions[dimensionMatch[2]] = dimensionMatch[3];
      }
      
      // Extract observations
      const observations = [];
      const obsRegex = /<(gen|data):Obs[^>]*>[\s\S]*?<(gen|data):ObsDimension[^>]*value="([^"]*)"[^>]*>[\s\S]*?<(gen|data):ObsValue[^>]*value="([^"]*)"[^>]*>[\s\S]*?<\/(gen|data):Obs>/g;
      
      let obsMatch;
      while ((obsMatch = obsRegex.exec(seriesXml)) !== null) {
        observations.push({
          period: obsMatch[3],
          value: parseFloat(obsMatch[5])
        });
      }
      
      // Add to series list
      series.push({
        dimensions,
        observations
      });
    }
    
    return series;
  }
}

/**
 * Test method for the BIS Stats client
 */
async function testBisStatsClient() {
  const client = new BisStatsClient();
  
  try {
    console.log('Testing BIS SDMX RESTful API...');
    
    // First, get all dataflows to see what's available
    console.log('\nFetching available dataflows...');
    const dataflowsResponse = await client.getAllDataflows();
    
    if (dataflowsResponse.success) {
      console.log('Successfully fetched dataflows');
      
      // Extract dataflows from XML
      const dataflows = client.extractDataflows(dataflowsResponse);
      
      console.log(`\nFound ${dataflows.length} dataflows:`);
      dataflows.slice(0, 10).forEach((flow, index) => {
        console.log(`${index + 1}. ${flow.id} - ${flow.name} (${flow.agency} v${flow.version})`);
      });
      
      if (dataflows.length > 10) {
        console.log(`... and ${dataflows.length - 10} more`);
      }
      
      // Get frequency codelist
      console.log('\nFetching frequency codelist...');
      const freqCodelistResponse = await client.getCodelist('CL_FREQ');
      
      if (freqCodelistResponse.success) {
        console.log('Successfully fetched frequency codelist');
        
        // Extract codes
        const codelists = client.extractCodelists(freqCodelistResponse);
        
        if (codelists.length > 0) {
          const frequencies = codelists[0].codes;
          
          console.log(`\nAvailable frequencies (${frequencies.length}):`);
          frequencies.forEach(freq => {
            console.log(`- ${freq.id}: ${freq.name}`);
          });
          
          // Try to get data for the first dataflow with annual frequency
          if (dataflows.length > 0) {
            const testDataflow = dataflows[0];
            console.log(`\nTrying to get annual data for ${testDataflow.id}...`);
            
            const dataResponse = await client.getData(testDataflow.id, 'A', {
              // Add any parameters if needed
            });
            
            if (dataResponse.success) {
              console.log('Successfully fetched data');
              
              // Try to extract series
              const series = client.extractDataSeries(dataResponse);
              console.log(`Extracted ${series.length} data series`);
              
              if (series.length > 0) {
                console.log('\nSample data series:');
                console.log('- Dimensions:', series[0].dimensions);
                console.log('- Observations:', series[0].observations.length);
                
                if (series[0].observations.length > 0) {
                  console.log('- Sample observations:');
                  series[0].observations.slice(0, 5).forEach(obs => {
                    console.log(`  ${obs.period}: ${obs.value}`);
                  });
                }
              } else {
                console.log('No data series found in response');
              }
            } else {
              console.log(`Failed to fetch data: ${dataResponse.error}`);
              console.log('This is expected based on our exploration - endpoint exists but might not have data');
            }
          }
        }
      } else {
        console.log(`Failed to fetch frequency codelist: ${freqCodelistResponse.error}`);
      }
    } else {
      console.log(`Failed to fetch dataflows: ${dataflowsResponse.error}`);
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
