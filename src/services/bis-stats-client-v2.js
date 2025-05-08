/**
 * BIS SDMX RESTful API Client (V2)
 * 
 * A client for accessing the Bank for International Settlements (BIS) statistical data
 * via their SDMX RESTful API (v2).
 * 
 * This client aligns with the BIS SDMX v2 API specification.
 * 
 * @version 1.0.0
 */

class BisStatsClientV2 {
  /**
   * Creates a new BIS Stats API v2 client
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
    // Cache implementation (same as original)
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
    // Cache implementation (same as original)
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

  // ---- V2 API IMPLEMENTATION ----

  /**
   * Gets structure data
   * 
   * @param {string} structureType - Structure type (e.g., 'dataflow', 'codelist', 'datastructure')
   * @param {string} agencyID - Agency ID (e.g., 'BIS')
   * @param {string} resourceID - Resource ID (e.g., 'CBS', 'LBS', 'all')
   * @param {string} version - Version (e.g., 'latest', '1.0')
   * @param {Object} [params={}] - Additional query parameters
   * @returns {Promise<Object>} Structure data
   */
  async getStructure(structureType, agencyID, resourceID, version, params = {}) {
    const endpoint = `structure/${structureType}/${agencyID}/${resourceID}/${version}`;
    return await this.fetchData(endpoint, params);
  }

  /**
   * Gets all dataflows
   * 
   * @param {string} [agencyID='BIS'] - Agency ID
   * @param {string} [version='latest'] - Version
   * @param {Object} [params={}] - Additional query parameters
   * @returns {Promise<Object>} Dataflow data
   */
  async getDataflows(agencyID = 'BIS', version = 'latest', params = {}) {
    return await this.getStructure('dataflow', agencyID, 'all', version, params);
  }

  /**
   * Gets a specific dataflow
   * 
   * @param {string} dataflowID - Dataflow ID
   * @param {string} [agencyID='BIS'] - Agency ID
   * @param {string} [version='latest'] - Version
   * @param {Object} [params={}] - Additional query parameters
   * @returns {Promise<Object>} Dataflow data
   */
  async getDataflow(dataflowID, agencyID = 'BIS', version = 'latest', params = {}) {
    return await this.getStructure('dataflow', agencyID, dataflowID, version, params);
  }

  /**
   * Gets all codelists
   * 
   * @param {string} [agencyID='BIS'] - Agency ID
   * @param {string} [version='latest'] - Version
   * @param {Object} [params={}] - Additional query parameters
   * @returns {Promise<Object>} Codelist data
   */
  async getCodelists(agencyID = 'BIS', version = 'latest', params = {}) {
    return await this.getStructure('codelist', agencyID, 'all', version, params);
  }

  /**
   * Gets a specific codelist
   * 
   * @param {string} codelistID - Codelist ID
   * @param {string} [agencyID='BIS'] - Agency ID
   * @param {string} [version='latest'] - Version
   * @param {Object} [params={}] - Additional query parameters
   * @returns {Promise<Object>} Codelist data
   */
  async getCodelist(codelistID, agencyID = 'BIS', version = 'latest', params = {}) {
    return await this.getStructure('codelist', agencyID, codelistID, version, params);
  }

  /**
   * Gets data for a specific dataflow
   * 
   * @param {string} context - Context (e.g., 'BIS')
   * @param {string} agencyID - Agency ID (e.g., 'BIS')
   * @param {string} resourceID - Resource ID (dataflow ID, e.g., 'CBS')
   * @param {string} version - Version (e.g., 'latest', '1.0')
   * @param {string} key - Key for data dimensions (e.g., 'all' or specific key)
   * @param {Object} [params={}] - Additional query parameters
   * @returns {Promise<Object>} Data result
   */
  async getData(context, agencyID, resourceID, version, key, params = {}) {
    const endpoint = `data/${context}/${agencyID}/${resourceID}/${version}/${key}`;
    return await this.fetchData(endpoint, params);
  }

  /**
   * Gets BIS statistics data
   * 
   * @param {string} resourceID - Resource ID (dataflow ID, e.g., 'CBS')
   * @param {string} [key='all'] - Key for data dimensions
   * @param {Object} [params={}] - Additional query parameters
   * @returns {Promise<Object>} Data result
   */
  async getBisData(resourceID, key = 'all', params = {}) {
    return await this.getData('BIS', 'BIS', resourceID, 'latest', key, params);
  }

  /**
   * Extracts dataflows from XML response
   * 
   * @param {Object} response - API response from getDataflows
   * @returns {Array<Object>} Extracted dataflow information
   */
  extractDataflows(response) {
    if (!response.success || !response.data) {
      return [];
    }
    
    const dataflows = [];
    const xml = response.data;
    
    // Updated regex pattern for SDMX v2 format dataflows
    const dataflowRegex = /<(str|structure):Dataflow[^>]*id="([^"]*)"[^>]*agencyID="([^"]*)"[^>]*version="([^"]*)"[^>]*>/g;
    const nameRegex = /<(com|common):Name[^>]*>([^<]*)<\/(com|common):Name>/g;
    
    let dataflowMatches = [...xml.matchAll(dataflowRegex)];
    let nameMatches = [...xml.matchAll(nameRegex)];
    
    // Extract dataflows
    for (let i = 0; i < dataflowMatches.length; i++) {
      const match = dataflowMatches[i];
      const name = i < nameMatches.length ? nameMatches[i][2] : match[2];
      
      dataflows.push({
        id: match[2],
        agency: match[3],
        version: match[4],
        name: name
      });
    }
    
    return dataflows;
  }
  
  /**
   * Extracts codelist information from XML response
   * 
   * @param {Object} response - API response from getCodelist
   * @returns {Array<Object>} Extracted codelist information
   */
  extractCodelists(response) {
    if (!response.success || !response.data) {
      return [];
    }
    
    const codelists = [];
    const xml = response.data;
    
    // Updated regex for SDMX v2 format codelists
    const codelistRegex = /<(str|structure):Codelist[^>]*id="([^"]*)"[^>]*agencyID="([^"]*)"[^>]*version="([^"]*)"[^>]*>/g;
    
    let codelistMatches = [...xml.matchAll(codelistRegex)];
    
    for (const match of codelistMatches) {
      const codelistId = match[2];
      
      // Extract codes for this codelist
      // The pattern might need adjustment based on actual XML structure
      const codeRegex = new RegExp(`<(str|structure):Code[^>]*id="([^"]*)"[^>]*>[\\s\\S]*?<(com|common):Name[^>]*>([^<]*)<\\/(com|common):Name>[\\s\\S]*?<\\/(str|structure):Code>`, 'g');
      const codes = [];
      
      let codeMatches = [...xml.matchAll(codeRegex)];
      for (const codeMatch of codeMatches) {
        codes.push({
          id: codeMatch[2],
          name: codeMatch[4]
        });
      }
      
      codelists.push({
        id: codelistId,
        agency: match[3],
        version: match[4],
        codes
      });
    }
    
    return codelists;
  }
}

/**
 * Test method for the BIS Stats v2 client
 */
async function testBisStatsClientV2() {
  const client = new BisStatsClientV2();
  
  try {
    console.log('Testing BIS SDMX RESTful API v2...');
    
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
        console.log('Sample dataflows:');
        dataflows.slice(0, 5).forEach((flow, index) => {
          console.log(`${index + 1}. ${flow.id} - ${flow.name}`);
        });
      }
      
      // Try to get a specific dataflow if any were found
      if (dataflows.length > 0) {
        const testDataflowId = dataflows[0].id;
        console.log(`\nFetching specific dataflow: ${testDataflowId}`);
        const specificDataflow = await client.getDataflow(testDataflowId);
        console.log('Specific dataflow request success:', specificDataflow.success);
      }
    }
    
    // Test codelists
    console.log('\nFetching available codelists...');
    const codelistsResponse = await client.getCodelists();
    
    console.log('Codelists request success:', codelistsResponse.success);
    console.log('Codelists status code:', codelistsResponse.status);
    
    if (codelistsResponse.success) {
      console.log('Successfully fetched codelists');
      
      // Try to get the frequency codelist
      console.log('\nFetching frequency codelist (CL_FREQ)...');
      const freqCodelistResponse = await client.getCodelist('CL_FREQ');
      
      console.log('CL_FREQ request success:', freqCodelistResponse.success);
      
      if (freqCodelistResponse.success) {
        // Extract frequencies
        const codelists = client.extractCodelists(freqCodelistResponse);
        
        if (codelists.length > 0) {
          const frequencies = codelists[0].codes;
          console.log(`Found ${frequencies.length} frequency codes`);
          
          if (frequencies.length > 0) {
            console.log('Sample frequencies:');
            frequencies.slice(0, 5).forEach(freq => {
              console.log(`- ${freq.id}: ${freq.name}`);
            });
          }
        }
      }
    }
    
    // Test data retrieval if we have dataflows
    const dataflowsForTest = client.extractDataflows(dataflowsResponse);
    if (dataflowsForTest.length > 0) {
      const testDataflowId = dataflowsForTest[0].id;
      console.log(`\nTesting data retrieval for ${testDataflowId}...`);
      
      const dataResponse = await client.getBisData(testDataflowId);
      console.log('Data request success:', dataResponse.success);
      console.log('Data status code:', dataResponse.status);
      
      if (dataResponse.success) {
        console.log('Successfully retrieved data');
        console.log('Data size (bytes):', dataResponse.data.length);
      } else {
        console.log('Data retrieval error:', dataResponse.error);
      }
    }
    
    return {
      success: true,
      message: 'BIS SDMX API v2 client test completed'
    };
  } catch (error) {
    console.error('Error in BIS Stats v2 client test:', error.message);
    throw error;
  }
}

module.exports = {
  BisStatsClientV2,
  testBisStatsClientV2
};
