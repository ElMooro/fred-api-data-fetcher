/**
 * BIS Stats Client - Final Version
 * 
 * A robust client for accessing Bank for International Settlements (BIS) statistical data
 * using the verified working API endpoints with improved XML parsing.
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
   * @param {boolean} [options.debug=false] - Enable debug logging
   */
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'https://stats.bis.org/api/v1';
    this.timeout = options.timeout || 30000;
    this.enableCaching = options.enableCaching !== false;
    this.cacheTTL = options.cacheTTL || 3600000; // 1 hour default
    this.debug = options.debug || false;
    
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
   * Debug log function that only logs when debug is enabled
   * 
   * @private
   * @param {...any} args - Arguments to log
   */
  log(...args) {
    if (this.debug) {
      console.log(...args);
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
      
      this.log(`Fetching data from: ${fullUrl}`);
      
      // Check cache first if enabled
      if (this.enableCaching) {
        const cachedResponse = this.getCachedResponse(fullUrl);
        if (cachedResponse) {
          this.log('Using cached response');
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
      
      this.log(`Response status: ${response.status}`);
      this.log(`Content-Type: ${response.headers.get('content-type')}`);
      
      // Get response as text
      const data = await response.text();
      
      // Log the first 100 characters of the response for debugging
      if (this.debug && data) {
        this.log(`Response data (first 100 chars): ${data.substring(0, 100)}...`);
        // Save sample data to file for debugging
        if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
          const fs = require('fs');
          fs.writeFileSync(`bis-${datasetId}-${frequency}-sample.xml`, data.substring(0, 10000));
          this.log(`Saved sample data to bis-${datasetId}-${frequency}-sample.xml`);
        }
      }
      
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
      this.log(`Error fetching data: ${error.message}`);
      
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
    
    // Try multiple series pattern variations
    this.log('Extracting data series from XML response');
    
    // Pattern 1: Standard SDMX GenericData Series format
    const patterns = [
      /<(gen|generic|data):Series[^>]*>([\s\S]*?)<\/(gen|generic|data):Series>/g,
      /<Series[^>]*>([\s\S]*?)<\/Series>/g,
      /<series[^>]*>([\s\S]*?)<\/series>/g,
      /<DataSet[^>]*>([\s\S]*?)<\/DataSet>/g
    ];
    
    let totalMatches = 0;
    
    for (const pattern of patterns) {
      let matches = [...xml.matchAll(pattern)];
      this.log(`Pattern ${pattern.toString()} found ${matches.length} matches`);
      totalMatches += matches.length;
      
      for (const match of matches) {
        // Process each series match
        const seriesXml = match[0];
        const seriesData = this.extractSeriesData(seriesXml);
        
        if (seriesData && seriesData.observations.length > 0) {
          series.push(seriesData);
        }
      }
    }
    
    // If no matches with the above patterns, try direct extraction
    if (totalMatches === 0) {
      this.log('No matches with standard patterns, trying direct extraction');
      
      // Try to find observations directly
      const obsPatterns = [
        /<(gen|generic|data):Obs[^>]*>([\s\S]*?)<\/(gen|generic|data):Obs>/g,
        /<Obs[^>]*>([\s\S]*?)<\/Obs>/g,
        /<obs[^>]*>([\s\S]*?)<\/obs>/g,
        /<Observation[^>]*>([\s\S]*?)<\/Observation>/g
      ];
      
      let observations = [];
      
      for (const pattern of obsPatterns) {
        let matches = [...xml.matchAll(pattern)];
        this.log(`Observation pattern ${pattern.toString()} found ${matches.length} matches`);
        
        for (const match of matches) {
          const obsXml = match[0];
          
          // Extract period and value
          const periodMatch = obsXml.match(/TIME_PERIOD="([^"]*)"/) || 
                             obsXml.match(/time="([^"]*)"/) ||
                             obsXml.match(/<(gen|generic|data):ObsDimension[^>]*value="([^"]*)"/) ||
                             obsXml.match(/<TimeDimension[^>]*value="([^"]*)"/) ||
                             obsXml.match(/<time[^>]*>([^<]*)<\/time>/);
                             
          const valueMatch = obsXml.match(/OBS_VALUE="([^"]*)"/) || 
                            obsXml.match(/value="([^"]*)"/) ||
                            obsXml.match(/<(gen|generic|data):ObsValue[^>]*value="([^"]*)"/) ||
                            obsXml.match(/<value[^>]*>([^<]*)<\/value>/);
          
          if (periodMatch && valueMatch) {
            const period = periodMatch[1] || periodMatch[2];
            const value = parseFloat(valueMatch[1] || valueMatch[2]);
            
            if (!isNaN(value)) {
              observations.push({ period, value });
            }
          }
        }
      }
      
      if (observations.length > 0) {
        series.push({
          dimensions: {},
          observations
        });
      }
    }
    
    this.log(`Extracted ${series.length} data series`);
    
    return series;
  }
  
  /**
   * Extracts data from a single series XML element
   * 
   * @private
   * @param {string} seriesXml - XML string for a single series
   * @returns {Object} Extracted series data
   */
  extractSeriesData(seriesXml) {
    // Extract dimensions (key values)
    const dimensions = {};
    
    // Try different dimension patterns
    const dimensionPatterns = [
      /<(gen|generic|data):Value[^>]*concept="([^"]*)"[^>]*value="([^"]*)"[^>]*>/g,
      /<Value[^>]*concept="([^"]*)"[^>]*value="([^"]*)"[^>]*>/g,
      /<(gen|generic|data):SeriesKey[^>]*>([\s\S]*?)<\/(gen|generic|data):SeriesKey>/g,
      /<SeriesKey[^>]*>([\s\S]*?)<\/SeriesKey>/g,
      /<Dimension[^>]*id="([^"]*)"[^>]*value="([^"]*)"[^>]*>/g,
      /<dimension[^>]*id="([^"]*)"[^>]*value="([^"]*)"[^>]*>/g
    ];
    
    for (const pattern of dimensionPatterns) {
      let matches = [...seriesXml.matchAll(pattern)];
      
      for (const match of matches) {
        if (match.length >= 3) {
          dimensions[match[2]] = match[3];
        }
      }
    }
    
    // Extract attributes directly from series tag
    const attrMatches = seriesXml.match(/([A-Z_]+)="([^"]*)"/g);
    if (attrMatches) {
      for (const attr of attrMatches) {
        const [name, value] = attr.split('=');
        if (name && value) {
          dimensions[name] = value.replace(/"/g, '');
        }
      }
    }
    
    // Extract observations
    const observations = [];
    
    // Try different observation patterns
    const obsPatterns = [
      /<(gen|generic|data):Obs[^>]*>([\s\S]*?)<\/(gen|generic|data):Obs>/g,
      /<Obs[^>]*>([\s\S]*?)<\/Obs>/g,
      /<obs[^>]*>([\s\S]*?)<\/obs>/g,
      /<Observation[^>]*>([\s\S]*?)<\/Observation>/g
    ];
    
    for (const pattern of obsPatterns) {
      let matches = [...seriesXml.matchAll(pattern)];
      
      for (const match of matches) {
        const obsXml = match[0];
        this.extractObservation(obsXml, observations);
      }
    }
    
    // Try inline observation format
    const inlineMatches = seriesXml.match(/<Obs[^>]*TIME_PERIOD="([^"]*)"[^>]*OBS_VALUE="([^"]*)"[^>]*>/g);
    if (inlineMatches) {
      for (const obs of inlineMatches) {
        const periodMatch = obs.match(/TIME_PERIOD="([^"]*)"/);
        const valueMatch = obs.match(/OBS_VALUE="([^"]*)"/);
        
        if (periodMatch && valueMatch) {
          const period = periodMatch[1];
          const value = parseFloat(valueMatch[1]);
          
          if (!isNaN(value)) {
            observations.push({ period, value });
          }
        }
      }
    }
    
    return {
      dimensions,
      observations
    };
  }
  
  /**
   * Extracts a single observation from XML
   * 
   * @private
   * @param {string} obsXml - XML string for a single observation
   * @param {Array<Object>} observations - Array to add extracted observations to
   */
  extractObservation(obsXml, observations) {
    // Try different formats for time period
    const periodPatterns = [
      /<(gen|generic|data):ObsDimension[^>]*value="([^"]*)"[^>]*>/,
      /<(gen|generic|data):TimeDimension[^>]*value="([^"]*)"[^>]*>/,
      /<ObsDimension[^>]*value="([^"]*)"[^>]*>/,
      /<time[^>]*>([^<]*)<\/time>/,
      /TIME_PERIOD="([^"]*)"/
    ];
    
    // Try different formats for value
    const valuePatterns = [
      /<(gen|generic|data):ObsValue[^>]*value="([^"]*)"[^>]*>/,
      /<ObsValue[^>]*value="([^"]*)"[^>]*>/,
      /<value[^>]*>([^<]*)<\/value>/,
      /OBS_VALUE="([^"]*)"/
    ];
    
    let period = null;
    let value = null;
    
    // Find period
    for (const pattern of periodPatterns) {
      const match = obsXml.match(pattern);
      if (match) {
        period = match[1] || match[2];
        break;
      }
    }
    
    // Find value
    for (const pattern of valuePatterns) {
      const match = obsXml.match(pattern);
      if (match) {
        value = match[1] || match[2];
        break;
      }
    }
    
    if (period && value) {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        observations.push({
          period,
          value: numValue
        });
      }
    }
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
      (s.dimensions.REF_AREA === normalizedCode) ||
      (s.dimensions.COUNTRY === normalizedCode)
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
    
    // Add dimension columns for the first series that has dimensions
    let dimensionKeys = [];
    for (const s of series) {
      if (s.dimensions && Object.keys(s.dimensions).length > 0) {
        dimensionKeys = Object.keys(s.dimensions);
        break;
      }
    }
    
    // Add dimension columns
    dimensionKeys.forEach(key => {
      csv += `${key},`;
    });
    
    // Add period columns
    csv += periods.join(',') + '\n';
    
    // Add data rows
    series.forEach((s, index) => {
      // Add series ID
      csv += `Series_${index + 1},`;
      
      // Add dimension values
      dimensionKeys.forEach(key => {
        csv += `${s.dimensions[key] || ''},`;
      });
      
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
  
  /**
   * Saves a CSV file from series data
   * 
   * @param {Array<Object>} series - Series data
   * @param {string} filename - Output filename
   * @returns {boolean} Success status
   */
  saveToCSV(series, filename) {
    try {
      const csv = this.convertToCSV(series);
      
      if (typeof process !== 'undefined' && process.env) {
        const fs = require('fs');
        fs.writeFileSync(filename, csv);
        this.log(`Saved data to ${filename}`);
        return true;
      } else {
        this.log('File saving is not supported in this environment');
        return false;
      }
    } catch (error) {
      this.log(`Error saving to CSV: ${error.message}`);
      return false;
    }
  }
}

/**
 * Test method for the BIS Stats client
 */
async function testBisStatsClient() {
  // Create client with debug mode enabled
  const client = new BisStatsClient({ debug: true });
  
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
    console.log('Content type:', eerResponse.contentType);
    
    if (eerResponse.success) {
      console.log('Response data length:', eerResponse.data.length);
      console.log('First 100 chars:', eerResponse.data.substring(0, 100));
      
      // Extract series
      const series = client.extractDataSeries(eerResponse);
      console.log(`Extracted ${series.length} exchange rate series`);
      
      if (series.length > 0) {
        console.log('\nFirst series dimensions:');
        console.log(series[0].dimensions);
        
        console.log(`First series has ${series[0].observations.length} observations`);
        
        if (series[0].observations.length > 0) {
          console.log('\nSample observations:');
          const sampleObs = series[0].observations.slice(0, 3);
          sampleObs.forEach(obs => {
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
    console.log('Property prices URL:', ppResponse.url);
    console.log('Content type:', ppResponse.contentType);
    
    if (ppResponse.success) {
      console.log('Response data length:', ppResponse.data.length);
      
      // Extract series
      const series = client.extractDataSeries(ppResponse);
      console.log(`Extracted ${series.length} property price series`);
      
      if (series.length > 0) {
        console.log('\nFirst series has dimensions:', Object.keys(series[0].dimensions).length);
        console.log(`First series has ${series[0].observations.length} observations`);
      }
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
