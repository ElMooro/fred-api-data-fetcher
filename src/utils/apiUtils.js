/**
 * API utilities for the Financial Dashboard
 */

/**
 * Make a request to the API with proper error handling and timeout
 * @param {string} url - API URL
 * @param {Object} options - Fetch options
 * @param {number} timeout - Request timeout in ms
 * @returns {Promise} - Response data
 */
export const fetchWithTimeout = async (url, options = {}, timeout = 8000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      mode: 'cors',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};

/**
 * Detect CORS issues and provide helpful debug info
 * @param {Error} error - Error object
 * @returns {string} - Human-readable error message
 */
export const analyzeCorsError = (error) => {
  const errorString = error.toString().toLowerCase();
  
  if (errorString.includes('cors') || 
      errorString.includes('origin') || 
      errorString.includes('cross')) {
    return 'CORS error detected: The API server is not configured to accept requests from this domain. This is likely a server configuration issue.';
  }
  
  if (errorString.includes('network') || 
      errorString.includes('failed to fetch')) {
    return 'Network error: Unable to connect to the API. Check your internet connection and ensure the API server is running.';
  }
  
  if (errorString.includes('timeout')) {
    return 'Request timeout: The API server took too long to respond.';
  }
  
  return `API error: ${error.message}`;
};
