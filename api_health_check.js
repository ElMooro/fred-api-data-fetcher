#!/usr/bin/env node

/**
 * Economic Data API Health Check
 * This script tests connectivity to various economic data APIs
 * and provides detailed diagnostics and recommendations.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// ANSI color codes for terminal output
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Status symbols for terminal output
const SYMBOLS = {
  success: '✅',
  warning: '⚠️',
  error: '❌',
  info: '🔍'
};

// Helper function for HTTP requests with timeout
const makeRequest = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const jsonData = JSON.parse(data);
            resolve({ statusCode: res.statusCode, data: jsonData });
          } catch (e) {
            resolve({ statusCode: res.statusCode, data });
          }
        } else {
          reject(new Error(`HTTP Error: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    // Set timeout to 10 seconds
    req.setTimeout(10000, () => {
      req.abort();
      reject(new Error('Request timed out after 10 seconds'));
    });

    req.end();
  });
};

// Print formatted message to console
const print = (message, color = 'reset', indent = 0) => {
  const indentation = ' '.repeat(indent);
  console.log(`${indentation}${COLORS[color]}${message}${COLORS.reset}`);
};

// Collection of APIs to check
const apis = [
  {
    name: 'FRED API',
    key: process.env.FRED_API_KEY,
    keyName: 'FRED_API_KEY',
    testUrl: () => `https://api.stlouisfed.org/fred/series?series_id=GDP&api_key=${process.env.FRED_API_KEY}&file_type=json`,
    validate: (response) => {
      return response.data && response.data.seriess && Array.isArray(response.data.seriess);
    },
    sampleData: (response) => {
      if (response.data && response.data.seriess && response.data.seriess[0]) {
        return `GDP: ${response.data.seriess[0].title}`;
      }
      return null;
    }
  },
  {
    name: 'ECB API',
    key: null, // ECB doesn't require an API key
    keyName: null,
    testUrl: () => 'https://data-api.ecb.europa.eu/service/data/EXR/D.USD.EUR.SP00.A?format=jsondata',
    validate: (response) => {
      return response.data && response.data.dataSets && Array.isArray(response.data.dataSets);
    },
    sampleData: (response) => {
      if (response.data && response.data.structure && response.data.structure.name) {
        return `Dataset: ${response.data.structure.name}`;
      }
      return null;
    }
  },
  {
    name: 'Census API',
    key: process.env.CENSUS_API_KEY,
    keyName: 'CENSUS_API_KEY',
    testUrl: () => {
      const key = process.env.CENSUS_API_KEY ? `&key=${process.env.CENSUS_API_KEY}` : '';
      return `https://api.census.gov/data/2021/acs/acs1?get=NAME,B01001_001E&for=state:06${key}`;
    },
    validate: (response) => {
      return Array.isArray(response.data) && response.data.length > 1;
    },
    sampleData: (response) => {
      if (Array.isArray(response.data) && response.data.length > 1) {
        return `California - Population: ${response.data[1][1]}`;
      }
      return null;
    }
  },
  {
    name: 'BLS API',
    key: process.env.BLS_API_KEY,
    keyName: 'BLS_API_KEY',
    testUrl: () => 'https://api.bls.gov/publicAPI/v2/timeseries/data/LAUCN040010000000005',
    validate: (response) => {
      return response.data && response.data.Results;
    },
    sampleData: (response) => {
      if (response.data && response.data.Results && response.data.Results.series && 
          response.data.Results.series[0] && response.data.Results.series[0].data) {
        const data = response.data.Results.series[0].data[0];
        return `${data.periodName} ${data.year}: ${data.value}`;
      }
      return null;
    }
  },
  {
    name: 'BEA API',
    key: process.env.BEA_API_KEY,
    keyName: 'BEA_API_KEY',
    testUrl: () => {
      if (!process.env.BEA_API_KEY) {
        return null; // Skip test if no key
      }
      return `https://apps.bea.gov/api/data?&UserID=${process.env.BEA_API_KEY}&method=GetData&DataSetName=NIPA&TableName=T10101&Frequency=Q&Year=2023&Quarter=Q1&ResultFormat=JSON`;
    },
    validate: (response) => {
      return response.data && response.data.BEAAPI && response.data.BEAAPI.Results;
    },
    sampleData: (response) => {
      if (response.data && response.data.BEAAPI && response.data.BEAAPI.Results) {
        return `BEA Data Available: ${response.data.BEAAPI.Results.DataSet ? 'Yes' : 'No'}`;
      }
      return null;
    }
  }
];

// Store test results for summary
const results = {};
const missingKeys = [];

// Main function to check APIs
async function checkAPIs() {
  print('=== ECONOMIC DATA API HEALTH CHECK ===', 'blue');
  print(`Testing ${apis.length} APIs...`, 'blue');
  print('');

  // Check each API
  for (const api of apis) {
    print(`${SYMBOLS.info} Checking ${api.name}...`, 'cyan');

    // Check if API key is required but missing
    if (api.key === undefined && api.keyName) {
      print(`${SYMBOLS.warning} No ${api.keyName} found in environment variables.`, 'yellow', 3);
      missingKeys.push(api.keyName);
      
      if (api.name === 'Census API') {
        print('   Will attempt to use the API without a key (limited access).', 'yellow');
      } else if (api.name === 'BLS API') {
        print('   Limited to 25 requests per day without a key.', 'yellow');
      } else if (api.testUrl() === null) {
        print(`${SYMBOLS.warning} Will skip testing due to missing key.`, 'yellow', 3);
        results[api.name] = 'UNKNOWN';
        continue;
      } else {
        print('   Will attempt to use a test query (may fail).', 'yellow');
      }
    }

    // Get test URL
    const testUrl = api.testUrl();
    if (testUrl === null) {
      print(`${SYMBOLS.warning} Cannot test ${api.name} without API key.`, 'yellow', 3);
      results[api.name] = 'UNKNOWN';
      continue;
    }

    // Test the API
    try {
      const response = await makeRequest(testUrl);
      
      if (api.validate(response)) {
        print(`${SYMBOLS.success} ${api.name} connection successful`, 'green', 3);
        results[api.name] = 'WORKING';
        
        // Show sample data if available
        const sample = api.sampleData(response);
        if (sample) {
          print(`   Sample data: ${sample}`, 'green', 3);
        }
      } else {
        print(`${SYMBOLS.error} Unexpected ${api.name} response format`, 'red', 3);
        results[api.name] = 'FAILED';
      }
    } catch (error) {
      print(`${SYMBOLS.error} ${api.name} connection failed: ${error.message}`, 'red', 3);
      results[api.name] = 'FAILED';
    }
  }

  // Print summary
  print('');
  print('=== API HEALTH CHECK SUMMARY ===', 'blue');
  
  let failedApis = [];
  let unknownApis = [];
  
  for (const [name, status] of Object.entries(results)) {
    let color = 'green';
    let symbol = SYMBOLS.success;
    
    if (status === 'FAILED') {
      color = 'red';
      symbol = SYMBOLS.error;
      failedApis.push(name);
    } else if (status === 'UNKNOWN') {
      color = 'yellow';
      symbol = SYMBOLS.warning;
      unknownApis.push(name);
    }
    
    print(`${name}: ${symbol} ${status}`, color);
  }
  
  // Print recommendations if there are issues
  if (failedApis.length > 0 || missingKeys.length > 0 || unknownApis.length > 0) {
    print('');
    print('=== RECOMMENDATIONS ===', 'blue');
    
    if (failedApis.length > 0) {
      print(`${SYMBOLS.warning} The following APIs need attention: ${failedApis.join(', ')}`, 'yellow');
      print('Possible fixes:', 'yellow');
      print('1. Check your API keys in the .env file', 'white');
      print('2. Verify network connectivity', 'white');
      print('3. Check if API endpoints have changed', 'white');
      print('4. Ensure you have necessary permissions for these APIs', 'white');
    }
    
    if (missingKeys.length > 0) {
      print(`${SYMBOLS.warning} Missing API keys in your .env file:`, 'yellow');
      missingKeys.forEach(key => {
        print(`   - ${key}`, 'white');
      });
      print('Add these keys to your .env file for full functionality.', 'white');
    }
  } else {
    print('');
    print(`${SYMBOLS.success} All APIs are working correctly!`, 'green');
  }
}

// Run the API check
checkAPIs().catch(error => {
  print(`${SYMBOLS.error} Error running API health check: ${error.message}`, 'red');
});
