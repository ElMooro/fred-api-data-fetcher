/**
 * Enhanced FRED API Client
 * Fully compatible with FRED API documentation parameters
 */
const https = require('https');
const querystring = require('querystring');
require('dotenv').config();

class FredApiClient {
  constructor(apiKey = process.env.FRED_API_KEY) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.stlouisfed.org/fred/';
    this.timeout = parseInt(process.env.API_TIMEOUT || '30000', 10);
    this.retryAttempts = parseInt(process.env.RETRY_ATTEMPTS || '3', 10);
  }

  /**
   * Make a request to the FRED API
   * @param {string} endpoint - The API endpoint to call
   * @param {Object} params - Request parameters
   * @returns {Promise<Object>} - The response data
   */
  async request(endpoint, params = {}) {
    // Set default values for common parameters
    const defaultParams = {
      api_key: this.apiKey,
      file_type: 'json',  // Default to JSON as specified in docs
    };
    
    // Get today's date in YYYY-MM-DD format for defaults
    const today = new Date().toISOString().split('T')[0];
    
    // Add real-time period defaults if not provided
    if (!params.realtime_start) {
      params.realtime_start = today;
    }
    
    if (!params.realtime_end) {
      params.realtime_end = today;
    }
    
    // Combine defaults with provided parameters
    const queryParams = {
      ...defaultParams,
      ...params
    };
    
    return new Promise((resolve, reject) => {
      // Build the URL with parameters
      const url = `${this.baseUrl}${endpoint}?${querystring.stringify(queryParams)}`;
      
      // Configure the request
      const options = {
        method: 'GET',
        timeout: this.timeout
      };
      
      let retryCount = 0;
      const makeRequest = () => {
        const req = https.get(url, options, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              try {
                // Parse response based on the requested file_type
                let result;
                if (queryParams.file_type === 'json') {
                  result = JSON.parse(data);
                } else {
                  // For XML, just return the raw data
                  result = data;
                }
                resolve(result);
              } catch (err) {
                reject(new Error(`Failed to parse response: ${err.message}`));
              }
            } else {
              const error = new Error(`FRED API request failed with status ${res.statusCode}`);
              error.statusCode = res.statusCode;
              error.data = data;
              
              // Retry on server errors or rate limits
              if ([429, 500, 502, 503, 504].includes(res.statusCode) && retryCount < this.retryAttempts) {
                retryCount++;
                const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
                setTimeout(makeRequest, delay);
              } else {
                reject(error);
              }
            }
          });
        });
        
        req.on('error', (error) => {
          // Retry on network errors
          if (retryCount < this.retryAttempts) {
            retryCount++;
            const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
            setTimeout(makeRequest, delay);
          } else {
            reject(error);
          }
        });
        
        req.on('timeout', () => {
          req.destroy();
          const error = new Error('Request timeout');
          
          // Retry on timeouts
          if (retryCount < this.retryAttempts) {
            retryCount++;
            const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
            setTimeout(makeRequest, delay);
          } else {
            reject(error);
          }
        });
      };
      
      makeRequest();
    });
  }

  /**
   * Get category information
   * @param {Object} options - Optional parameters
   * @param {number} [options.category_id=0] - Category ID (0 is root)
   * @param {string} [options.realtime_start] - Start of real-time period
   * @param {string} [options.realtime_end] - End of real-time period
   * @returns {Promise<Object>} - Category information
   */
  async getCategory(options = {}) {
    // Set default category_id to 0 (root) if not provided
    if (options.category_id === undefined) {
      options.category_id = 0;
    }
    
    return this.request('category', options);
  }
  
  /**
   * Get series data
   * @param {string} seriesId - The series ID to fetch
   * @param {Object} options - Optional parameters
   * @returns {Promise<Object>} - Series data
   */
  async getSeriesData(seriesId, options = {}) {
    return this.request('series/observations', {
      series_id: seriesId,
      ...options
    });
  }
  
  /**
   * Get series information
   * @param {string} seriesId - The series ID to fetch
   * @param {Object} options - Optional parameters
   * @returns {Promise<Object>} - Series information
   */
  async getSeriesInfo(seriesId, options = {}) {
    return this.request('series', {
      series_id: seriesId,
      ...options
    });
  }
  
  /**
   * Search for series
   * @param {string} searchText - The search term
   * @param {Object} options - Optional parameters
   * @returns {Promise<Object>} - Search results
   */
  async searchSeries(searchText, options = {}) {
    return this.request('series/search', {
      search_text: searchText,
      ...options
    });
  }
  
  /**
   * Validate API key
   * @returns {Promise<boolean>} - True if the API key is valid
   */
  async validateApiKey() {
    try {
      const result = await this.getSeriesInfo('GNPCA', { limit: 1 });
      return result && (result.seriess || result.series);
    } catch (error) {
      console.error('API key validation error:', error.message);
      return false;
    }
  }
}

module.exports = FredApiClient;
