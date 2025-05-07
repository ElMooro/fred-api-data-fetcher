// AWS API Gateway Integration Service
const axios = require('axios');

// Simple API service with retry capability and error handling
class AwsApiService {
  constructor() {
    this.config = {
      baseURL: process.env.REACT_APP_API_GATEWAY_URL,
      headers: { 'x-api-key': process.env.REACT_APP_API_KEY },
      timeout: 10000
    };
    
    this.api = axios.create(this.config);
    this.cache = new Map();
  }

  async get(endpoint, params = {}, options = {}) {
    const cacheKey = `${endpoint}:${JSON.stringify(params)}`;
    if (options.useCache !== false && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    try {
      const response = await this.api.get(endpoint, { params });
      if (options.useCache !== false) {
        this.cache.set(cacheKey, response.data);
      }
      return response.data;
    } catch (error) {
      console.error(`API Error: ${endpoint}`, error);
      throw error;
    }
  }

  async post(endpoint, data, options = {}) {
    try {
      const response = await this.api.post(endpoint, data);
      return response.data;
    } catch (error) {
      console.error(`API Error: ${endpoint}`, error);
      throw error;
    }
  }

  clearCache() {
    this.cache.clear();
  }
}

const apiService = new AwsApiService();
export default apiService;
