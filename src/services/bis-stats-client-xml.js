/**
 * BIS SDMX RESTful API XML Client
 * 
 * A client for accessing the Bank for International Settlements (BIS) statistical data
 * via their SDMX RESTful API v2 using XML format.
 * 
 * @version 1.0.0
 */

class BisStatsXmlClient {
  /**
   * Creates a new BIS Stats API XML client
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
   * Fetches data from the BIS API in XML format
   * 
   * @private
   * @param {string} endpoint - API endpoint path
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Result object with XML response and success status
   */
  async fetchData(endpoint, params = {}) {
    // Build the URL with query parameters
    const queryParams = new URLSearchParams();
    
    // Add parameters (but do NOT add format=json)
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
          'User-Agent': 'BisStatsClient/1.0.0'
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
   * @returns {Promise<Object>} Data result
   */
  async getDataset(datasetId, params = {}) {
    return await this.fetchData(`data/BIS/BIS/${datasetId}/latest/all`, params);
  }
  
  /**
   * Gets structure information for a specific dataset
   * 
   * @param {string} datasetId - Dataset ID
   * @param {Object} [params={}] - Additional query parameters
   * @returns {Promise<Object>} Structure information
   */
  async getDatasetStructure(datasetId, params = {}) {
    return await this.fetchData(`structure/datastructure/BIS/${datasetId}/latest`, params);
  }
  
  /**
   * Gets availability information for a dataset
   * 
   * @param {string} datasetId - Dataset ID
   * @param {string} [dimensionId='all'] - Dimension ID
   * @param {Object} [params={}] - Additional query parameters
   * @returns {Promise<Object>} Availability information
   */
  async getDatasetAvailability(datasetId, dimensionId = 'all', params = {}) {
    return await this.fetchData(`availability/BIS/BIS/${datasetId}/latest/all/${dimensionId}`, params);
  }
  
  /**
   * Gets data for BIS Effective Exchange Rates dataset
   * 
   * @param {Object} [params={}] - Additional query parameters
   * @returns {Promise<Object>} EER data
   */
  async getEffectiveExchangeRates(params = {}) {
    return await this.getDataset('WS_EER', params);
  }
  
  /**
   * Gets data for BIS Property Prices dataset
   * 
   * @param {Object} [params={}] - Additional query parameters
   * @returns {Promise<Object>} Property prices data
   */
  async getPropertyPrices(params = {}) {
    return await this.getDataset('WS_SPP', params);
  }
  
  /**
   * Gets data for BIS Total Credit dataset
   * 
   * @param {Object} [params={}] - Additional query parameters
   * @returns {Promise<Object>} Total credit data
   */
  async getTotalCredit(params = {}) {
    return await this.getDataset('WS_TC', params);
  }
  
  /**
   * Gets data for BIS Locational Banking Statistics dataset
   * 
   * @param {Object} [params={}] - Additional query parameters
   * @returns {Promise<Object>} LBS data
   */
  async getLocationalBankingStats(params = {}) {
    return await this.getDataset('WS_LBS_D_PUB', params);
  }
  
  /**
   * Extracts series data from XML response
   * 
   * @param {Object} response - API response from getDataset or similar methods
   * @returns {Array<Object>} Array of series objects with dimensions and observations
   */
  extractDataSeries(response) {
    if (!response.success || !response.data) {
      return [];
    }
    
    const series = [];
    const xml = response.data;
    
    // Extract Series elements
    const seriesRegex = /<(gen|data):Series[^>]*>([\s\S]*?)<\/(gen|data):Series>/g;
    
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
 * Test method for the BIS Stats XML client
 */
async function testBisStatsXmlClient() {
  const client = new BisStatsXmlClient();
  
  try {
    console.log('Testing BIS SDMX RESTful API with XML format...');
    
    // List available datasets
    console.log('\nAvailable datasets:');
    const datasets = client.listDatasets();
    console.log(`Found ${datasets.length} known datasets`);
    
    // Show first few datasets
    datasets.slice(0, 5).forEach((ds, index) => {
      console.log(`${index + 1}. ${ds.id} - ${ds.description}`);
    });
    
    // Test the main datasets
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
        console.log('Data size (bytes):', dataResponse.data.length);
        
        // Try to extract series
        const series = client.extractDataSeries(dataResponse);
        console.log(`Extracted ${series.length} data series`);
        
        if (series.length > 0) {
          // Show first series details
          console.log('\nFirst series dimensions:');
          console.log(series[0].dimensions);
          
          console.log(`First series has ${series[0].observations.length} observations`);
          
          if (series[0].observations.length > 0) {
            console.log('\nFirst few observations:');
            series[0].observations.slice(0, 3).forEach(obs => {
              console.log(`${obs.period}: ${obs.value}`);
            });
          }
        }
        
        // Try to get structure
        console.log(`\nFetching structure for ${datasetId}...`);
        const structureResponse = await client.getDatasetStructure(datasetId);
        
        console.log('Structure request success:', structureResponse.success);
        console.log('Structure status code:', structureResponse.status);
      } else {
        console.log('Data retrieval error:', dataResponse.error);
      }
    }
    
    return {
      success: true,
      message: 'BIS SDMX API XML client test completed'
    };
  } catch (error) {
    console.error('Error in BIS Stats XML client test:', error.message);
    throw error;
  }
}

module.exports = {
  BisStatsXmlClient,
  testBisStatsXmlClient
};
