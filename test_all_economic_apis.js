/**
 * Comprehensive Economic API Test Script
 * Tests direct connections to all economic data APIs
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Your API keys
const API_KEYS = {
  FRED: 'a8df6aeca3b71980ad53ebccecb3cb3e',
  BEA: '997E5691-4F0E-4774-8B4E-CAE836D4AC47',
  CENSUS: '8423ffa543d0e95cdba580f2e381649b6772f515',
  BLS: 'a759447531f04f1f861f29a381aab863'
};

// Terminal colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Log with color
function colorLog(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Make HTTP/HTTPS request
function makeRequest(urlString) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const protocol = url.protocol === 'https:' ? https : http;
    
    const req = protocol.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          // Try to parse as JSON, but fall back to raw data if necessary
          let parsedData;
          try {
            parsedData = JSON.parse(data);
          } catch (e) {
            parsedData = data;
          }
          
          resolve({ 
            statusCode: res.statusCode, 
            data: parsedData
          });
        } catch (e) {
          resolve({ 
            statusCode: res.statusCode, 
            data: data.substring(0, 500) + (data.length > 500 ? '...' : '') 
          });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.on('timeout', () => {
      req.abort();
      reject(new Error('Request timed out'));
    });
    
    req.end();
  });
}

// Run all tests
async function testAllAPIs() {
  colorLog('===== TESTING ALL ECONOMIC DATA APIs =====', 'magenta');
  
  // 1. Test FRED API
  try {
    colorLog('\n1. Testing FRED API...', 'cyan');
    const fredUrl = `https://api.stlouisfed.org/fred/series?series_id=GDP&api_key=${API_KEYS.FRED}&file_type=json`;
    colorLog(`URL: ${fredUrl}`, 'yellow');
    
    const fredResponse = await makeRequest(fredUrl);
    
    if (fredResponse.statusCode >= 200 && fredResponse.statusCode < 300) {
      colorLog('✓ FRED API connection successful', 'green');
      
      if (fredResponse.data && fredResponse.data.seriess) {
        const series = fredResponse.data.seriess[0];
        colorLog(`Series: ${series.title} (${series.id})`, 'green');
        colorLog(`Frequency: ${series.frequency_short}`, 'green');
        colorLog(`Units: ${series.units}`, 'green');
        colorLog(`Last Updated: ${series.last_updated}`, 'green');
      } else {
        colorLog('✗ FRED API returned unexpected data format', 'red');
      }
      
      // Test observations endpoint
      const obsUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=GDP&api_key=${API_KEYS.FRED}&file_type=json&sort_order=desc&limit=5`;
      colorLog(`\nTesting FRED observations endpoint: ${obsUrl}`, 'yellow');
      
      const obsResponse = await makeRequest(obsUrl);
      
      if (obsResponse.statusCode >= 200 && obsResponse.statusCode < 300) {
        colorLog('✓ FRED observations endpoint successful', 'green');
        
        if (obsResponse.data && obsResponse.data.observations) {
          const observations = obsResponse.data.observations;
          colorLog(`Latest 5 observations:`, 'green');
          observations.forEach(obs => {
            colorLog(`  ${obs.date}: ${obs.value}`, 'green');
          });
        }
      } else {
        colorLog(`✗ FRED observations endpoint failed with status code ${obsResponse.statusCode}`, 'red');
      }
    } else {
      colorLog(`✗ FRED API returned status code ${fredResponse.statusCode}`, 'red');
      console.log('Response:', fredResponse.data);
    }
  } catch (error) {
    colorLog(`✗ FRED API error: ${error.message}`, 'red');
  }
  
  // 2. Test BEA API
  try {
    colorLog('\n2. Testing BEA API...', 'cyan');
    const beaUrl = `https://apps.bea.gov/api/data?UserID=${API_KEYS.BEA}&method=GetData&DataSetName=NIPA&TableName=T10101&Frequency=Q&Year=2023&Quarter=Q1&ResultFormat=JSON`;
    colorLog(`URL: ${beaUrl}`, 'yellow');
    
    const beaResponse = await makeRequest(beaUrl);
    
    if (beaResponse.statusCode >= 200 && beaResponse.statusCode < 300) {
      colorLog('✓ BEA API connection successful', 'green');
      
      if (beaResponse.data && beaResponse.data.BEAAPI && beaResponse.data.BEAAPI.Results) {
        colorLog('Data received successfully', 'green');
        
        // Print some sample data if available
        if (beaResponse.data.BEAAPI.Results.Data && beaResponse.data.BEAAPI.Results.Data.length > 0) {
          colorLog('Sample data:', 'green');
          const sampleData = beaResponse.data.BEAAPI.Results.Data.slice(0, 3);
          sampleData.forEach(item => {
            console.log(`  ${item.GeoName || item.TimePeriod}: ${item.DataValue}`);
          });
        }
      } else {
        colorLog('✗ BEA API returned unexpected data format', 'red');
      }
    } else {
      colorLog(`✗ BEA API returned status code ${beaResponse.statusCode}`, 'red');
      console.log('Response:', beaResponse.data);
    }
  } catch (error) {
    colorLog(`✗ BEA API error: ${error.message}`, 'red');
  }
  
  // 3. Test Census API
  try {
    colorLog('\n3. Testing Census API...', 'cyan');
    // Test with a simple ACS population query
    const censusUrl = `https://api.census.gov/data/2021/acs/acs1?get=NAME,B01001_001E&for=state:06&key=${API_KEYS.CENSUS}`;
    colorLog(`URL: ${censusUrl}`, 'yellow');
    
    const censusResponse = await makeRequest(censusUrl);
    
    if (censusResponse.statusCode >= 200 && censusResponse.statusCode < 300) {
      colorLog('✓ Census API connection successful', 'green');
      
      if (Array.isArray(censusResponse.data) && censusResponse.data.length > 1) {
        const headers = censusResponse.data[0];
        const data = censusResponse.data[1];
        
        colorLog(`Headers: ${headers.join(', ')}`, 'green');
        colorLog(`Data: ${data.join(', ')}`, 'green');
        
        // Find the population value
        const popIndex = headers.indexOf('B01001_001E');
        if (popIndex >= 0) {
          const nameIndex = headers.indexOf('NAME');
          const locationName = nameIndex >= 0 ? data[nameIndex] : 'California';
          colorLog(`Population of ${locationName}: ${data[popIndex]}`, 'green');
        }
      } else {
        colorLog('✗ Census API returned unexpected data format', 'red');
      }
    } else {
      colorLog(`✗ Census API returned status code ${censusResponse.statusCode}`, 'red');
      console.log('Response:', censusResponse.data);
    }
  } catch (error) {
    colorLog(`✗ Census API error: ${error.message}`, 'red');
  }
  
  // 4. Test BLS API
  try {
    colorLog('\n4. Testing BLS API...', 'cyan');
    // Test with a simple unemployment rate query
    const blsUrl = 'https://api.bls.gov/publicAPI/v2/timeseries/data/LNS14000000';
    colorLog(`URL: ${blsUrl}`, 'yellow');
    
    const blsResponse = await makeRequest(blsUrl);
    
    if (blsResponse.statusCode >= 200 && blsResponse.statusCode < 300) {
      colorLog('✓ BLS API connection successful', 'green');
      
      if (blsResponse.data && blsResponse.data.Results && blsResponse.data.Results.series) {
        const series = blsResponse.data.Results.series;
        
        if (series.length > 0 && series[0].data) {
          colorLog('Sample data:', 'green');
          const data = series[0].data.slice(0, 5);
          data.forEach(item => {
            console.log(`  ${item.periodName} ${item.year}: ${item.value}`);
          });
        } else {
          colorLog('No data found in the response', 'yellow');
        }
      } else {
        colorLog('✗ BLS API returned unexpected data format', 'red');
      }
    } else {
      colorLog(`✗ BLS API returned status code ${blsResponse.statusCode}`, 'red');
      console.log('Response:', blsResponse.data);
    }
  } catch (error) {
    colorLog(`✗ BLS API error: ${error.message}`, 'red');
  }
  
  // 5. Test ECB API
  try {
    colorLog('\n5. Testing ECB API...', 'cyan');
    // Test with a simple exchange rate query (ECB API doesn't require an API key)
    const ecbUrl = 'https://data-api.ecb.europa.eu/service/data/EXR/D.USD.EUR.SP00.A?format=jsondata';
    colorLog(`URL: ${ecbUrl}`, 'yellow');
    
    const ecbResponse = await makeRequest(ecbUrl);
    
    if (ecbResponse.statusCode >= 200 && ecbResponse.statusCode < 300) {
      colorLog('✓ ECB API connection successful', 'green');
      
      if (ecbResponse.data && ecbResponse.data.dataSets && ecbResponse.data.dataSets.length > 0) {
        colorLog('Data received successfully', 'green');
        
        // Try to extract and display some data points
        try {
          const dataSet = ecbResponse.data.dataSets[0];
          if (dataSet.series && Object.keys(dataSet.series).length > 0) {
            const seriesKey = Object.keys(dataSet.series)[0];
            const series = dataSet.series[seriesKey];
            
            if (series.observations && Object.keys(series.observations).length > 0) {
              colorLog('Sample observations:', 'green');
              const observations = Object.entries(series.observations).slice(0, 5);
              
              observations.forEach(([key, values]) => {
                console.log(`  Observation ${key}: ${values[0]}`);
              });
            }
          }
        } catch (e) {
          colorLog(`Error extracting ECB data points: ${e.message}`, 'yellow');
        }
      } else {
        colorLog('✗ ECB API returned unexpected data format', 'red');
      }
    } else {
      colorLog(`✗ ECB API returned status code ${ecbResponse.statusCode}`, 'red');
      console.log('Response:', ecbResponse.data);
    }
  } catch (error) {
    colorLog(`✗ ECB API error: ${error.message}`, 'red');
  }
  
  // 6. Test NY Fed API (Optional - uses public data, no API key needed)
  try {
    colorLog('\n6. Testing NY Fed API...', 'cyan');
    // Try to access NY Fed SOFR data
    const nyfedUrl = 'https://markets.newyorkfed.org/api/rates/secured/sofr/last/1.json';
    colorLog(`URL: ${nyfedUrl}`, 'yellow');
    
    const nyfedResponse = await makeRequest(nyfedUrl);
    
    if (nyfedResponse.statusCode >= 200 && nyfedResponse.statusCode < 300) {
      colorLog('✓ NY Fed API connection successful', 'green');
      
      if (nyfedResponse.data && nyfedResponse.data.refRates) {
        const rates = nyfedResponse.data.refRates;
        
        if (rates.length > 0) {
          const latestRate = rates[0];
          colorLog(`Latest SOFR Rate (${latestRate.effectiveDate}): ${latestRate.percentRate}%`, 'green');
        } else {
          colorLog('No rate data found in the response', 'yellow');
        }
      } else {
        colorLog('✗ NY Fed API returned unexpected data format', 'red');
      }
    } else {
      colorLog(`✗ NY Fed API returned status code ${nyfedResponse.statusCode}`, 'red');
      console.log('Response:', nyfedResponse.data);
    }
  } catch (error) {
    colorLog(`✗ NY Fed API error: ${error.message}`, 'red');
  }
  
  colorLog('\n===== API TESTING SUMMARY =====', 'magenta');
  colorLog('Make sure all APIs returned successful status codes (2xx)', 'yellow');
  colorLog('For any failed API connections, check:', 'yellow');
  colorLog('1. API key validity and permissions', 'yellow');
  colorLog('2. Network connectivity', 'yellow');
  colorLog('3. API endpoint URLs', 'yellow');
  colorLog('4. API rate limits or quotas', 'yellow');
}

// Run all API tests
testAllAPIs().catch(err => {
  colorLog(`Error running tests: ${err.message}`, 'red');
});
