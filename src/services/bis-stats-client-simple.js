/**
 * BIS Stats Simple Client
 * 
 * A simplified client for accessing Bank for International Settlements (BIS) statistical data
 * using the available APIs and endpoints that actually work.
 * 
 * @version 1.0.0
 */

class BisStatsSimpleClient {
  /**
   * Creates a new BIS Stats Simple client
   * 
   * @param {Object} options - Configuration options
   * @param {string} [options.baseUrl='https://stats.bis.org'] - Base URL for BIS website
   * @param {string} [options.apiUrl='https://stats.bis.org/api/v2'] - API URL for structure data
   * @param {string} [options.dataUrl='https://stats.bis.org/api/v1'] - API URL for actual data
   * @param {number} [options.timeout=30000] - Request timeout in milliseconds
   */
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'https://stats.bis.org';
    this.apiUrl = options.apiUrl || 'https://stats.bis.org/api/v2';
    this.dataUrl = options.dataUrl || 'https://stats.bis.org/api/v1';
    this.timeout = options.timeout || 30000;
    
    // Common dataset codes and descriptions
    this.datasets = {
      'WS_EER': 'BIS effective exchange rates',
      'WS_SPP': 'Selected residential property prices',
      'WS_TC': 'BIS long series on total credit',
      'WS_LBS_D_PUB': 'BIS locational banking',
      'WS_CBS_PUB': 'BIS consolidated banking',
      'WS_DEBT_SEC2_PUB': 'BIS international debt securities',
      'WS_LONG_CPI': 'BIS long consumer prices',
      'WS_GLI': 'Global liquidity indicators',
      'WS_DSR': 'BIS debt service ratio',
      'WS_CREDIT_GAP': 'BIS credit-to-GDP gaps',
      'WS_CPP': 'Commercial property prices',
      'WS_DPP': 'Detailed residential property prices'
    };
    
    // Frequency codes
    this.frequencies = {
      'A': 'Annual',
      'Q': 'Quarterly',
      'M': 'Monthly',
      'D': 'Daily'
    };
  }
  
  /**
   * Performs a fetch request with timeout
   * 
   * @private
   * @param {string} url - URL to fetch
   * @param {Object} options - Fetch options
   * @returns {Promise<Response>} Fetch response
   */
  async fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }
  
  /**
   * Lists available datasets
   * 
   * @returns {Array<Object>} Array of dataset objects with id and name
   */
  listDatasets() {
    return Object.entries(this.datasets).map(([id, name]) => ({ id, name }));
  }
  
  /**
   * Gets data from the BIS API using v1 format (which works)
   * 
   * @param {string} datasetId - Dataset ID (e.g., 'WS_EER', 'WS_SPP')
   * @param {string} [frequency='A'] - Frequency code (A=Annual, Q=Quarterly, M=Monthly, D=Daily)
   * @param {Object} [params={}] - Additional parameters
   * @returns {Promise<Object>} Data response
   */
  async getData(datasetId, frequency = 'A', params = {}) {
    try {
      // Format URL according to v1 API pattern
      const url = `${this.dataUrl}/data/BIS:${datasetId}/${frequency}/all`;
      
      // Add parameters if provided
      const queryParams = new URLSearchParams(params);
      const queryString = queryParams.toString();
      const fullUrl = queryString ? `${url}?${queryString}` : url;
      
      // Make request
      const response = await this.fetchWithTimeout(fullUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/xml',
          'User-Agent': 'BisStatsClient/1.0.0'
        }
      });
      
      // Get response as text
      const data = await response.text();
      
      return {
        success: response.ok,
        status: response.status,
        url: fullUrl,
        contentType: response.headers.get('content-type'),
        data,
        error: response.ok ? null : `Error ${response.status}: ${response.statusText}`
      };
    } catch (error) {
      return {
        success: false,
        status: 0,
        url: `${this.dataUrl}/data/BIS:${datasetId}/${frequency}/all`,
        contentType: null,
        data: null,
        error: error.message
      };
    }
  }
  
  /**
   * Gets BIS effective exchange rates data
   * 
   * @param {string} [frequency='M'] - Frequency (A=Annual, Q=Quarterly, M=Monthly, D=Daily)
   * @param {Object} [params={}] - Additional parameters
   * @returns {Promise<Object>} Exchange rates data
   */
  async getExchangeRates(frequency = 'M', params = {}) {
    return this.getData('WS_EER', frequency, params);
  }
  
  /**
   * Gets BIS property prices data
   * 
   * @param {string} [frequency='Q'] - Frequency (A=Annual, Q=Quarterly)
   * @param {Object} [params={}] - Additional parameters
   * @returns {Promise<Object>} Property prices data
   */
  async getPropertyPrices(frequency = 'Q', params = {}) {
    return this.getData('WS_SPP', frequency, params);
  }
  
  /**
   * Gets BIS total credit data
   * 
   * @param {string} [frequency='Q'] - Frequency (A=Annual, Q=Quarterly)
   * @param {Object} [params={}] - Additional parameters
   * @returns {Promise<Object>} Total credit data
   */
  async getTotalCredit(frequency = 'Q', params = {}) {
    return this.getData('WS_TC', frequency, params);
  }
  
  /**
   * Gets BIS locational banking statistics
   * 
   * @param {string} [frequency='Q'] - Frequency (A=Annual, Q=Quarterly)
   * @param {Object} [params={}] - Additional parameters
   * @returns {Promise<Object>} LBS data
   */
  async getLocationalBankingStats(frequency = 'Q', params = {}) {
    return this.getData('WS_LBS_D_PUB', frequency, params);
  }
  
  /**
   * Extracts data series from XML response
   * 
   * @param {Object} response - Response from getData method
   * @returns {Array<Object>} Extracted data series
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
  
  /**
   * Get dataset release schedule information
   * 
   * @returns {Promise<Object>} Release schedule data
   */
  async getReleaseSchedule() {
    try {
      const url = `${this.baseUrl}/api/calendarReleasesData`;
      
      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'BisStatsClient/1.0.0'
        }
      });
      
      if (!response.ok) {
        return {
          success: false,
          status: response.status,
          data: null,
          error: `Error ${response.status}: ${response.statusText}`
        };
      }
      
      const data = await response.json();
      
      return {
        success: true,
        status: response.status,
        data,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        status: 0,
        data: null,
        error: error.message
      };
    }
  }
  
  /**
   * Get category information
   * 
   * @returns {Promise<Object>} Category information
   */
  async getCategories() {
    try {
      const url = `${this.baseUrl}/api/v0/categories/highlights`;
      
      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'BisStatsClient/1.0.0'
        }
      });
      
      if (!response.ok) {
        return {
          success: false,
          status: response.status,
          data: null,
          error: `Error ${response.status}: ${response.statusText}`
        };
      }
      
      const data = await response.json();
      
      return {
        success: true,
        status: response.status,
        data,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        status: 0,
        data: null,
        error: error.message
      };
    }
  }
}

/**
 * Test method for the BIS Stats Simple client
 */
async function testBisStatsSimpleClient() {
  const client = new BisStatsSimpleClient();
  
  try {
    console.log('Testing BIS Stats Simple Client...');
    
    // List available datasets
    console.log('\nAvailable datasets:');
    const datasets = client.listDatasets();
    datasets.forEach(ds => {
      console.log(`- ${ds.id}: ${ds.name}`);
    });
    
    // Test exchange rates dataset
    console.log('\nTesting exchange rates dataset...');
    const eerResponse = await client.getExchangeRates('M');
    
    console.log('Exchange rates request success:', eerResponse.success);
    console.log('Exchange rates status code:', eerResponse.status);
    console.log('Content-Type:', eerResponse.contentType);
    
    if (eerResponse.success) {
      console.log('Successfully retrieved exchange rates data');
      console.log('Data size (bytes):', eerResponse.data.length);
      
      // Extract series
      const series = client.extractDataSeries(eerResponse);
      console.log(`Extracted ${series.length} exchange rate series`);
      
      if (series.length > 0) {
        console.log('\nFirst series dimensions:');
        console.log(series[0].dimensions);
        
        console.log(`First series has ${series[0].observations.length} observations`);
        
        if (series[0].observations.length > 0) {
          console.log('\nRecent observations:');
          series[0].observations.slice(-3).forEach(obs => {
            console.log(`${obs.period}: ${obs.value}`);
          });
        }
      }
    } else {
      console.log('Exchange rates data retrieval error:', eerResponse.error);
    }
    
    // Test property prices dataset
    console.log('\nTesting property prices dataset...');
    const ppResponse = await client.getPropertyPrices('Q');
    
    console.log('Property prices request success:', ppResponse.success);
    console.log('Property prices status code:', ppResponse.status);
    
    if (ppResponse.success) {
      console.log('Successfully retrieved property prices data');
      
      // Extract series
      const series = client.extractDataSeries(ppResponse);
      console.log(`Extracted ${series.length} property price series`);
    } else {
      console.log('Property prices data retrieval error:', ppResponse.error);
    }
    
    // Get release schedule
    console.log('\nGetting release schedule...');
    const scheduleResponse = await client.getReleaseSchedule();
    
    console.log('Release schedule request success:', scheduleResponse.success);
    console.log('Release schedule status code:', scheduleResponse.status);
    
    if (scheduleResponse.success) {
      console.log('Successfully retrieved release schedule');
      
      // Show some upcoming releases
      if (scheduleResponse.data && Array.isArray(scheduleResponse.data)) {
        const upcomingReleases = scheduleResponse.data
          .filter(r => new Date(r.release_date.replace(/\//g, '-')) > new Date())
          .slice(0, 5);
        
        if (upcomingReleases.length > 0) {
          console.log('\nUpcoming releases:');
          upcomingReleases.forEach(release => {
            console.log(`- ${release.category_name} (${release.release_type}): ${release.release_date}`);
          });
        }
      }
    } else {
      console.log('Release schedule retrieval error:', scheduleResponse.error);
    }
    
    // Get categories
    console.log('\nGetting categories...');
    const categoriesResponse = await client.getCategories();
    
    console.log('Categories request success:', categoriesResponse.success);
    console.log('Categories status code:', categoriesResponse.status);
    
    if (categoriesResponse.success) {
      console.log('Successfully retrieved categories');
      
      // Show some categories
      if (categoriesResponse.data && Array.isArray(categoriesResponse.data)) {
        const categories = categoriesResponse.data.slice(0, 5);
        
        if (categories.length > 0) {
          console.log('\nTop categories:');
          categories.forEach(cat => {
            console.log(`- ${cat.id}: ${cat.name} - ${cat.intro}`);
          });
        }
      }
    } else {
      console.log('Categories retrieval error:', categoriesResponse.error);
    }
    
    return {
      success: true,
      message: 'BIS Stats Simple client test completed'
    };
  } catch (error) {
    console.error('Error in BIS Stats Simple client test:', error.message);
    throw error;
  }
}

module.exports = {
  BisStatsSimpleClient,
  testBisStatsSimpleClient
};
