/**
 * Comprehensive API Endpoint Testing Script
 * 
 * This script tests all endpoints exposed by your application
 * and verifies that they are returning proper data.
 */

// Import fetch from node-fetch
const fetch = require('node-fetch');
const chalk = require('chalk');

// Configuration
const config = {
  baseUrl: 'http://localhost:3002/fred-api-data-fetcher/api', // Change this to match your API server path
  timeout: 15000, // 15 seconds timeout for API calls
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

// Helper function for HTTP requests with timeout
const makeRequest = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const signal = controller.signal;
    const timeout = setTimeout(() => {
      controller.abort();
      reject(new Error(`Request timed out after ${config.timeout}ms`));
    }, config.timeout);

    fetch(url, { ...options, signal })
      .then(response => {
        clearTimeout(timeout);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => resolve(data))
      .catch(error => reject(error));
  });
};

// Helper function to format URL with query parameters
function formatUrl(path, params) {
  const url = new URL(config.baseUrl + path);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
  return url.toString();
}

// Function to test a single API endpoint
async function testEndpoint(endpoint) {
  console.log(chalk.blue(`Testing: ${endpoint.name}...`));
  
  try {
    const url = formatUrl(endpoint.path, endpoint.params);
    console.log(`  URL: ${url}`);
    
    const data = await makeRequest(url);
    const isValid = endpoint.validator(data);
    
    if (isValid) {
      console.log(chalk.green(`  ✓ Success: Data validated`));
      
      // Show sample of the data
      console.log('  Sample data:');
      if (Array.isArray(data)) {
        console.log(JSON.stringify(data.slice(0, 2), null, 2));
      } else {
        console.log(JSON.stringify(data, null, 2).substring(0, 500) + '...');
      }
      
      return true;
    } else {
      console.log(chalk.red(`  ✗ Error: Data validation failed`));
      console.log('  Received:', data);
      return false;
    }
  } catch (error) {
    console.log(chalk.red(`  ✗ Error: ${error.message}`));
    return false;
  }
}

// Main function to test all endpoints
async function testAllEndpoints() {
  console.log(chalk.yellow('===== API ENDPOINT TESTING STARTED ====='));
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
  
  console.log(chalk.yellow('===== API ENDPOINT TESTING COMPLETED ====='));
  console.log(`Results: ${chalk.green(successes)} passed, ${chalk.red(failures)} failed`);
  
  if (failures === 0) {
    console.log(chalk.green('✓ All API endpoints are working correctly!'));
  } else {
    console.log(chalk.red(`! ${failures} API endpoints are not working correctly.`));
  }
}

// Check if server is running
const checkServer = async () => {
  try {
    await fetch(`${config.baseUrl.split('/api')[0]}/`);
    console.log(chalk.green('✓ Server is running'));
    testAllEndpoints();
  } catch (error) {
    console.log(chalk.red('× Server is not running or not accessible at', config.baseUrl));
    console.log('Please start your server and ensure it\'s running on the correct port');
  }
};

// Run the tests
checkServer();
