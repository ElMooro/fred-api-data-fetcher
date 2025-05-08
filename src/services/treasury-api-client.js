/**
 * Treasury API Client
 * 
 * A comprehensive client for interacting with the Treasury Fiscal Data API
 * with support for multiple endpoints and advanced features.
 */
class TreasuryAuctionsClient {
  /**
   * Creates a new Treasury API client
   * 
   * @param {Object} options - Configuration options
   * @param {string} [options.baseUrl] - API base URL (default: official Treasury API URL)
   * @param {number} [options.timeout=30000] - Request timeout in milliseconds
   * @param {number} [options.maxRetries=3] - Maximum number of retry attempts for failed requests
   * @param {boolean} [options.enableCaching=true] - Enable response caching
   * @param {number} [options.cacheTTL=300000] - Cache time-to-live in milliseconds (5 minutes)
   */
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service';
    this.timeout = options.timeout || 30000;
    this.maxRetries = options.maxRetries || 3;
    this.enableCaching = options.enableCaching !== false;
    this.cacheTTL = options.cacheTTL || 300000; // 5 minutes default
    
    // Internal cache store
    this.cache = new Map();
  }

  /**
   * Fetches data from any Treasury API endpoint
   * 
   * @param {string} endpoint - API endpoint path
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} API response
   */
  async fetchData(endpoint, params = {}) {
    const url = `${this.baseUrl}/${endpoint}`;
    const queryString = this.buildQueryString(params);
    const fullUrl = `${url}?${queryString}`;
    
    // Check cache first if enabled
    if (this.enableCaching) {
      const cachedResponse = this.getCachedResponse(fullUrl);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    let retries = 0;
    let lastError = null;

    while (retries <= this.maxRetries) {
      try {
        console.log(`Making request to: ${fullUrl}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        const response = await fetch(fullUrl, { 
          method: 'GET',
          headers: { 
            'Accept': 'application/json',
            'User-Agent': 'TreasuryAuctionsClient/1.0.0'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(`HTTP Error: ${response.status} ${response.statusText}\n${errorText}`);
        }
        
        const data = await response.json();
        
        // Cache the successful response if caching is enabled
        if (this.enableCaching) {
          this.cacheResponse(fullUrl, data);
        }
        
        return data;
      } catch (error) {
        lastError = error;
        retries++;
        
        if (retries <= this.maxRetries) {
          console.log(`Retry attempt ${retries}/${this.maxRetries}...`);
          // Exponential backoff with jitter
          const delay = Math.min(1000 * Math.pow(2, retries) + Math.random() * 1000, 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(`Treasury API Error: ${lastError.message}`);
  }
  
  // TREASURY INTEREST RATES ENDPOINTS
  
  /**
   * Gets daily Treasury interest rates
   * 
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Interest rates data
   */
  async getTreasuryInterestRates(params = {}) {
    return this.fetchData('v2/accounting/od/avg_interest_rates', params);
  }
  
  /**
   * Gets daily Treasury yield curve rates
   * 
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Yield curve data
   */
  async getDailyTreasuryRates(params = {}) {
    return this.fetchData('v2/accounting/od/daily_treasury_rates', params);
  }
  
  // TREASURY DEBT ENDPOINTS
  
  /**
   * Gets debt to the penny data
   * 
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Debt data
   */
  async getDebtToThePenny(params = {}) {
    return this.fetchData('v2/accounting/od/debt_to_penny', params);
  }
  
  /**
   * Gets debt to the penny data (historical)
   * 
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Historical debt data
   */
  async getHistoricalDebt(params = {}) {
    return this.fetchData('v2/accounting/od/debt_historical', params);
  }
  
  /**
   * Gets debt by month data
   * 
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Monthly debt data
   */
  async getDebtByMonth(params = {}) {
    return this.fetchData('v2/accounting/od/debt_outstanding', params);
  }
  
  // TREASURY SECURITIES ENDPOINTS
  
  /**
   * Gets Treasury securities data
   * 
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Securities data
   */
  async getTreasurySold(params = {}) {
    return this.fetchData('v2/accounting/od/securities_sales', params);
  }
  
  /**
   * Gets Treasury securities (matured) data
   * 
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Matured securities data
   */
  async getMaturedSecurities(params = {}) {
    return this.fetchData('v2/accounting/od/securities_matured', params);
  }
  
  // UTILITY METHODS
  
  /**
   * Builds a query string from parameters object
   * 
   * @param {Object} params - Query parameters
   * @returns {string} Formatted query string
   */
  buildQueryString(params) {
    const queryParams = new URLSearchParams();
    
    // Process fields parameter (convert array to comma-separated string if needed)
    if (params.fields) {
      const fields = Array.isArray(params.fields) ? params.fields.join(',') : params.fields;
      queryParams.append('fields', fields);
    }
    
    // Add filter if provided
    if (params.filter) {
      queryParams.append('filter', params.filter);
    }
    
    // Add sort if provided
    if (params.sort) {
      queryParams.append('sort', params.sort);
    }
    
    // Add format (default to json)
    queryParams.append('format', params.format || 'json');
    
    // Add pagination - correct format for Treasury API
    if (params.page_size) {
      queryParams.append('page[size]', params.page_size);
    } else {
      queryParams.append('page[size]', 100);
    }
    
    if (params.page_number) {
      queryParams.append('page[number]', params.page_number);
    } else {
      queryParams.append('page[number]', 1);
    }
    
    return queryParams.toString();
  }

  /**
   * Gets a cached response if available and not expired
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
   */
  cacheResponse(cacheKey, data) {
    if (!this.enableCaching) return;
    
    this.cache.set(cacheKey, {
      timestamp: Date.now(),
      data
    });
  }
}

/**
 * Example usage and test function
 */
async function testTreasuryClient() {
  const client = new TreasuryAuctionsClient();
  
  try {
    // Test interest rates endpoint
    console.log('Fetching Treasury interest rates data...');
    const rates = await client.getTreasuryInterestRates({
      sort: '-record_date',
      page_size: 5
    });
    
    console.log('\nSuccess! Treasury rates data:');
    if (rates.data && rates.data.length > 0) {
      console.log(`Retrieved ${rates.data.length} records. First record:`);
      console.log(JSON.stringify(rates.data[0], null, 2));
    }
    
    // Test debt to the penny endpoint
    console.log('\nFetching debt to the penny data...');
    const debt = await client.getDebtToThePenny({
      sort: '-record_date',
      page_size: 5
    });
    
    console.log('\nSuccess! Debt to the penny data:');
    if (debt.data && debt.data.length > 0) {
      console.log(`Retrieved ${debt.data.length} records. First record:`);
      console.log(JSON.stringify(debt.data[0], null, 2));
    }
    
    // Test daily Treasury rates endpoint
    console.log('\nFetching daily Treasury rates data...');
    const dailyRates = await client.getDailyTreasuryRates({
      sort: '-record_date',
      page_size: 5
    });
    
    console.log('\nSuccess! Daily Treasury rates data:');
    if (dailyRates.data && dailyRates.data.length > 0) {
      console.log(`Retrieved ${dailyRates.data.length} records. First record:`);
      console.log(JSON.stringify(dailyRates.data[0], null, 2));
    }
    
    return { rates, debt, dailyRates };
  } catch (error) {
    console.error(`Error in test: ${error.message}`);
    throw error;
  }
}

module.exports = { TreasuryAuctionsClient, testTreasuryClient };
