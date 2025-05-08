const axios = require('axios');

console.log('=== NY Fed API Debug Test ===');
console.log('Starting test at:', new Date().toISOString());
console.log('Node.js version:', process.version);
console.log('Testing network connectivity and API endpoints...\n');

// Simple test for direct connectivity
async function testConnectivity() {
  console.log('1. Basic connectivity test:');
  try {
    // First try a simple ping to check internet connectivity
    console.log('   Testing internet connectivity...');
    await axios.get('https://www.google.com', { timeout: 5000 });
    console.log('   ✅ Internet connection successful');
    
    // Then try the NY Fed homepage to ensure their domain is accessible
    console.log('   Testing NY Fed domain accessibility...');
    await axios.get('https://www.newyorkfed.org/', { timeout: 5000 });
    console.log('   ✅ NY Fed domain is accessible');
    
    return true;
  } catch (error) {
    console.log('   ❌ Basic connectivity test failed');
    console.log('   Error:', error.message);
    console.log('   This suggests a network or DNS issue');
    return false;
  }
}

// Test a specific NY Fed API endpoint with detailed logging
async function testAPIEndpoint(name, url) {
  console.log(`\n2. Testing ${name} endpoint:`);
  console.log(`   URL: ${url}`);
  
  try {
    console.log('   Sending request...');
    const startTime = Date.now();
    const response = await axios.get(url, { 
      timeout: 10000,
      validateStatus: function (status) {
        return true; // Accept all status codes for debugging
      }
    });
    const duration = Date.now() - startTime;
    
    console.log(`   Response received in ${duration}ms`);
    console.log(`   Status code: ${response.status} ${response.statusText}`);
    
    if (response.status >= 200 && response.status < 300) {
      console.log('   ✅ Endpoint responded successfully');
      
      // Check response structure
      if (response.data) {
        console.log('   Response has data');
        
        // Log a sample of the data structure
        const dataKeys = Object.keys(response.data);
        console.log(`   Response data keys: ${dataKeys.join(', ')}`);
        
        // Check for expected structure based on endpoint
        if (url.includes('/rates/sofr/')) {
          if (response.data.refRates && response.data.refRates.sofr) {
            console.log('   ✅ SOFR data structure is valid');
            console.log('   Sample data:', JSON.stringify(response.data.refRates.sofr).substring(0, 200) + '...');
          } else {
            console.log('   ❌ SOFR data structure is invalid or empty');
          }
        } else if (url.includes('/rates/treasury/')) {
          if (response.data.Treasury) {
            console.log('   ✅ Treasury data structure is valid');
            console.log('   Sample data:', JSON.stringify(response.data.Treasury).substring(0, 200) + '...');
          } else {
            console.log('   ❌ Treasury data structure is invalid or empty');
          }
        }
      } else {
        console.log('   ⚠️ Response has no data');
      }
      
      return true;
    } else {
      console.log('   ❌ Endpoint returned error status code');
      console.log('   Response body:', JSON.stringify(response.data).substring(0, 200));
      return false;
    }
  } catch (error) {
    console.log('   ❌ Request failed');
    console.log('   Error type:', error.constructor.name);
    console.log('   Error message:', error.message);
    
    if (error.code) {
      console.log('   Error code:', error.code);
    }
    
    if (error.response) {
      console.log('   Response status:', error.response.status);
      console.log('   Response data:', JSON.stringify(error.response.data).substring(0, 200));
    }
    
    return false;
  }
}

async function runTests() {
  // Test basic connectivity first
  const connectivityOk = await testConnectivity();
  
  if (!connectivityOk) {
    console.log('\n❌ Basic connectivity test failed. Please check your network connection.');
    return;
  }
  
  // Test one specific endpoint with detailed logging
  await testAPIEndpoint(
    'SOFR latest', 
    'https://markets.newyorkfed.org/api/rates/sofr/last/1.json'
  );
  
  console.log('\nTest complete. Check the logs above for detailed results.');
}

// Run the tests
runTests().catch(err => {
  console.error('Unhandled error in test script:', err);
});
