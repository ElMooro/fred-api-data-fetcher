/**
 * BIS Stats Client - Clean Version
 * 
 * A simplified client for accessing Bank for International Settlements (BIS) statistical data
 * using the verified working API endpoints.
 * 
 * @version 1.0.0
 */

class BisStatsClient {
  /**
   * Creates a new BIS Stats client
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
   * Lists available datasets
   * 
   * @returns {Array<Object>} Array of dataset objects with id and name
   */
  listDatasets() {
    return Object.entries(this.datasets).map(([id, name]) => ({ id, name }));
  }
  
  /**
   * Lists available frequencies
   * 
   * @returns {Array<Object>} Array of frequency objects with code and name
   */
  listFrequencies() {
    return Object.entries(this.frequencies).map(([code, name]) => ({ code, name }));
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
   * Gets data from the BIS API
   * 
   * @param {string} datasetId - Dataset ID (e.g., 'WS_EER', 'WS_SPP')
   * @param {string} [frequency='A'] - Frequency code (A=Annual, Q=Quarterly, M=Monthly, D=Daily)
   * @param {Object} [params={}] - Additional parameters
   * @returns {Promise<Object>} Data response
   */
  async getData(datasetId, frequency = 'A', params = {}) {
    try {
      // Create URL using the pattern that works
      const url = `${this.baseUrl}/data/${datasetId}/${frequency}/all`;
      
      // Add parameters if provided
      const queryParams = new URLSearchParams(params);
      const queryString = queryParams.toString();
      const fullUrl = queryString ? `${url}?${queryString}` : url;
      
      // Check cache first if enabled
      if (this.enableCaching) {
        const cachedResponse = this.getCachedResponse(fullUrl);
        if (cachedResponse) {
          return cachedResponse;
        }
      }
      
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
      
      const result = {
        success: response.ok,
        status: response.status,
        url: fullUrl,
        contentType: response.headers.get('content-type'),
        data,
        error: response.ok ? null : `Error ${response.status}: ${response.statusText}`
      };
      
      // Cache successful response if caching is enabled
      if (response.ok && this.enableCaching) {
        this.cacheResponse(fullUrl, result);
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        status: 0,
        url: `${this.baseUrl}/data/${datasetId}/${frequency}/all`,
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
   * Gets BIS consumer prices data
   * 
   * @param {string} [frequency='M'] - Frequency (A=Annual, Q=Quarterly, M=Monthly)
   * @param {Object} [params={}] - Additional parameters
   * @returns {Promise<Object>} CPI data
   */
  async getConsumerPrices(frequency = 'M', params = {}) {
    return this.getData('WS_LONG_CPI', frequency, params);
  }
  
  /**
   * Gets BIS debt service ratio data
   * 
   * @param {string} [frequency='Q'] - Frequency (A=Annual, Q=Quarterly)
   * @param {Object} [params={}] - Additional parameters
   * @returns {Promise<Object>} DSR data
   */
  async getDebtServiceRatio(frequency = 'Q', params = {}) {
    return this.getData('WS_DSR', frequency, params);
  }
  
  /**
   * Gets BIS credit gap data
   * 
   * @param {string} [frequency='Q'] - Frequency (Q=Quarterly)
   * @param {Object} [params={}] - Additional parameters
   * @returns {Promise<Object>} Credit gap data
   */
  async getCreditGap(frequency = 'Q', params = {}) {
    return this.getData('WS_CREDIT_GAP', frequency, params);
  }
  
  /**
   * Cache implementation
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
   * Filters series data by country
   * 
   * @param {Array<Object>} series - Extracted series data 
   * @param {string} countryCode - ISO country code
   * @returns {Array<Object>} Filtered series data
   */
  filterByCountry(series, countryCode) {
    if (!series || !Array.isArray(series)) {
      return [];
    }
    
    // Normalize country code
    const normalizedCode = countryCode.toUpperCase();
    
    // Filter series that have COUNTRY_CODE or REF_AREA dimension matching the country code
    return series.filter(s => 
      (s.dimensions.COUNTRY_CODE === normalizedCode) ||
      (s.dimensions.REF_AREA === normalizedCode)
    );
  }
  
  /**
   * Filters series data by date range
   * 
   * @param {Array<Object>} series - Extracted series data
   * @param {string} startDate - Start date (YYYY-MM or YYYY-QQ)
   * @param {string} [endDate] - End date (YYYY-MM or YYYY-QQ)
   * @returns {Array<Object>} Filtered series data
   */
  filterByDateRange(series, startDate, endDate = null) {
    if (!series || !Array.isArray(series)) {
      return [];
    }
    
    // Return a new series array with filtered observations
    return series.map(s => {
      const filteredObs = s.observations.filter(obs => {
        if (startDate && obs.period < startDate) {
          return false;
        }
        
        if (endDate && obs.period > endDate) {
          return false;
        }
        
        return true;
      });
      
      return {
        dimensions: s.dimensions,
        observations: filteredObs
      };
    }).filter(s => s.observations.length > 0); // Remove series that have no observations after filtering
  }
  
  /**
   * Converts series data to CSV format
   * 
   * @param {Array<Object>} series - Extracted series data
   * @returns {string} CSV formatted data
   */
  convertToCSV(series) {
    if (!series || !Array.isArray(series) || series.length === 0) {
      return '';
    }
    
    // Get all periods (sorted)
    const allPeriods = new Set();
    series.forEach(s => {
      s.observations.forEach(obs => {
        allPeriods.add(obs.period);
      });
    });
    
    const periods = [...allPeriods].sort();
    
    // Create CSV header
    let csv = 'Series ID,';
    
    // Add dimension columns
    if (series[0].dimensions) {
      const dimensionKeys = Object.keys(series[0].dimensions);
      dimensionKeys.forEach(key => {
        csv += `${key},`;
      });
    }
    
    // Add period columns
    csv += periods.join(',') + '\n';
    
    // Add data rows
    series.forEach((s, index) => {
      // Add series ID
      csv += `Series_${index + 1},`;
      
      // Add dimension values
      if (s.dimensions) {
        const dimensionKeys = Object.keys(s.dimensions);
        dimensionKeys.forEach(key => {
          csv += `${s.dimensions[key]},`;
        });
      }
      
      // Create a map of period to value for quick lookup
      const periodMap = {};
      s.observations.forEach(obs => {
        periodMap[obs.period] = obs.value;
      });
      
      // Add values for each period
      const valueEntries = periods.map(period => 
        periodMap[period] !== undefined ? periodMap[period] : ''
      );
      
      csv += valueEntries.join(',') + '\n';
    });
    
    return csv;
  }
}

/**
 * Test method for the BIS Stats client
 */
async function testBisStatsClient() {
  const client = new BisStatsClient();
  
  try {
    console.log('Testing BIS Stats Client...');
    
    // List available datasets
    console.log('\nAvailable datasets:');
    const datasets = client.listDatasets();
    
    // Show datasets
    datasets.forEach(ds => {
      console.log(`- ${ds.id}: ${ds.name}`);
    });
    
    // List frequencies
    console.log('\nAvailable frequencies:');
    const frequencies = client.listFrequencies();
    
    // Show frequencies
    frequencies.forEach(freq => {
      console.log(`- ${freq.code}: ${freq.name}`);
    });
    
    // Test exchange rates dataset
    console.log('\nTesting exchange rates dataset...');
    const eerResponse = await client.getExchangeRates('M');
    
    console.log('Exchange rates request success:', eerResponse.success);
    console.log('Exchange rates URL:', eerResponse.url);
    
    if (eerResponse.success) {
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
        
        // Filter by country (if dimensions contain country codes)
        if (series[0].dimensions.COUNTRY_CODE || series[0].dimensions.REF_AREA) {
          const countryCode = series[0].dimensions.COUNTRY_CODE || series[0].dimensions.REF_AREA;
          console.log(`\nFiltering for country: ${countryCode}`);
          
          const filteredBySeries = client.filterByCountry(series, countryCode);
          console.log(`Found ${filteredBySeries.length} series for country ${countryCode}`);
        }
        
        // Filter by date range
        console.log('\nFiltering for recent data (last 3 years)');
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 3);
        
        // Format date as YYYY-MM
        const startDate = `${twoYearsAgo.getFullYear()}-${String(twoYearsAgo.getMonth() + 1).padStart(2, '0')}`;
        
        const filteredByDate = client.filterByDateRange(series, startDate);
        console.log(`Found ${filteredByDate.length} series with data since ${startDate}`);
        
        // Convert to CSV
        console.log('\nConverting to CSV...');
        const csv = client.convertToCSV(filteredByDate.slice(0, 2)); // Just use first 2 series for demo
        console.log(`Generated CSV data (${csv.length} bytes)`);
        console.log(csv.split('\n').slice(0, 3).join('\n') + '\n...');
      }
    } else {
      console.log('Exchange rates data retrieval error:', eerResponse.error);
    }
    
    // Test property prices dataset
    console.log('\nTesting property prices dataset...');
    const ppResponse = await client.getPropertyPrices('Q');
    
    console.log('Property prices request success:', ppResponse.success);
    console.log('Property prices URL:', ppResponse.url);
    
    if (ppResponse.success) {
      // Extract series
      const series = client.extractDataSeries(ppResponse);
      console.log(`Extracted ${series.length} property price series`);
    } else {
      console.log('Property prices data retrieval error:', ppResponse.error);
    }
    
    return {
      success: true,
      message: 'BIS Stats client test completed'
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
