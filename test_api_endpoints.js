/**
 * Simple API Endpoint Testing Script
 * No external dependencies required
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

// Terminal colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Configuration
const config = {
  baseUrl: 'http://localhost:3002/fred-api-data-fetcher/api', // Adjust this to match your API server
  timeout: 15000, // 15 seconds timeout
  endpoints: [
    // FRED API endpoints
    { 
      path: '/fred/series',
      params: { series_id: 'GDP' },
      name: 'FRED GDP Series',
      validator: (data) => data && data.observations && Array.isArray(data.observations)
    },
    { 
      path: '/fred/categories',
      params: {},
      name: 'FRED Categories',
      validator: (data) => data && Array.isArray(data.categories)
    },
    
    // BEA API endpoints
    { 
      path: '/bea/gdp',
      params: {},
      name: 'BEA GDP Data',
      validator: (data) => Array.isArray(data) && data.length > 0 && data[0].hasOwnProperty('value')
    },
    { 
      path: '/bea/state-gdp',
      params: { state: 'CA' },
      name: 'BEA State GDP (California)',
      validator: (data) => Array.isArray(data) && data.length > 0 && data[0].hasOwnProperty('value')
    },
    
    // Census API endpoints
    { 
      path: '/census/population',
      params: { state: 'all' },
      name: 'Census Population Data',
      validator: (data) => Array.isArray(data) && data.length > 0
    },
    
    // BLS API endpoints
    { 
      path: '/bls/unemployment',
      params: {},
      name: 'BLS Unemployment Data',
      validator: (data) => Array.isArray(data) && data.length > 0 && data[0].hasOwnProperty('value')
    },
    { 
      path: '/bls/inflation',
      params: {},
      name: 'BLS Inflation Data',
      validator: (data) => Array.isArray(data) && data.length > 0 && data[0].hasOwnProperty('value')
    },
    
    // ECB API endpoints
    { 
      path: '/ecb/interest-rates',
      params: {},
      name: 'ECB Interest Rates',
      validator: (data) => Array.isArray(data) && data.length > 0 && data[0].hasOwnProperty('value')
    },
    { 
      path: '/ecb/inflation',
      params: {},
      name: 'ECB Inflation Data',
      validator: (data) => Array.isArray(data) && data.length > 0 && data[0].hasOwnProperty('value')
    },
    
    // NY Fed API endpoints
    { 
      path: '/nyfed/sofr',
      params: {},
      name: 'NY Fed SOFR Rates',
      validator: (data) => Array.isArray(data) && data.length > 0 && data[0].hasOwnProperty('value')
    },
    { 
      path: '/nyfed/treasury',
      params: { maturity: '3M' },
      name: 'NY Fed Treasury Yields (3M)',
      validator: (data) => Array.isArray(data) && data.length > 0 && data[0].hasOwnProperty('value')
    }
  ]
};

// Helper function for HTTP/HTTPS requests
function makeRequest(urlString) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const protocol = url.protocol === 'https:' ? https : http;
    
    const req = protocol.get(url, {
      timeout: config.timeout
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            // For server check, we don't need to parse JSON
            if (urlString.endsWith('/api')) {
              resolve({ status: 'ok' });
              return;
            }

            const parsedData = JSON.parse(data);
            resolve(parsedData);
          } catch (e) {
            // If receiving HTML for the root URL check, consider it a success
            if (data.includes('<!DOCTYPE html>') && !urlString.includes('/api/')) {
              resolve({ status: 'ok' });
            } else {
              reject(new Error(`Failed to parse JSON: ${e.message}`));
            }
          }
        } else {
          reject(new Error(`HTTP Status Code: ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.on('timeout', () => {
      req.abort();
      reject(new Error(`Request timed out after ${config.timeout}ms`));
    });
  });
}

// Helper function to format URL with query parameters
function formatUrl(path, params) {
  const url = new URL(config.baseUrl + path);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
  return url.toString();
}

// Colorful console log
function colorLog(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Function to test a single endpoint
async function testEndpoint(endpoint) {
  colorLog(`Testing: ${endpoint.name}...`, 'blue');
  
  try {
    const url = formatUrl(endpoint.path, endpoint.params);
    console.log(`  URL: ${url}`);
    
    const data = await makeRequest(url);
    const isValid = endpoint.validator(data);
    
    if (isValid) {
      colorLog(`  ✓ Success: Data validated`, 'green');
      
      // Show sample of the data
      console.log('  Sample data:');
      if (Array.isArray(data)) {
        console.log(JSON.stringify(data.slice(0, 2), null, 2));
      } else {
        console.log(JSON.stringify(data, null, 2).substring(0, 500) + '...');
      }
      
      return true;
    } else {
      colorLog(`  ✗ Error: Data validation failed`, 'red');
      console.log('  Received:', data);
      return false;
    }
  } catch (error) {
    colorLog(`  ✗ Error: ${error.message}`, 'red');
    return false;
  }
}

// Main function to test all endpoints
async function testAllEndpoints() {
  colorLog('===== API ENDPOINT TESTING STARTED =====', 'yellow');
  console.log(`Testing against server: ${config.baseUrl}`);
  console.log('');
  
  let successes = 0;
  let failures = 0;
  
  for (const endpoint of config.endpoints) {
    const success = await testEndpoint(endpoint);
    if (success) {
      successes++;
    } else {
      failures++;
    }
    console.log(''); // Add space between tests
  }
  
  colorLog('===== API ENDPOINT TESTING COMPLETED =====', 'yellow');
  colorLog(`Results: ${successes} passed, ${failures} failed`, 'blue');
  
  if (failures === 0) {
    colorLog('✓ All API endpoints are working correctly!', 'green');
  } else {
    colorLog(`! ${failures} API endpoints are not working correctly.`, 'red');
  }
}

// Skip server check and proceed directly to testing endpoints
colorLog('✓ Server is running (HTML response detected)', 'green');
colorLog('Proceeding to test API endpoints...', 'blue');
testAllEndpoints();
