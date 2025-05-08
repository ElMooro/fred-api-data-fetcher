const axios = require('axios');

// NY Fed API base URL
const NY_FED_API_BASE_URL = 'https://markets.newyorkfed.org/api';

console.log('=== New York Fed API Test ===');
console.log('Testing connectivity and data retrieval...\n');

// Function to format dates as YYYY-MM-DD
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Get date range for last 7 days
const today = new Date();
const oneWeekAgo = new Date();
oneWeekAgo.setDate(today.getDate() - 7);

const startDate = formatDate(oneWeekAgo);
const endDate = formatDate(today);

console.log(`Date range: ${startDate} to ${endDate}\n`);

// Test SOFR rates
async function testSofrRates() {
  console.log('1. Testing SOFR Rates endpoint:');
  try {
    const endpoint = `/rates/sofr/range/${startDate}/${endDate}`;
    const url = `${NY_FED_API_BASE_URL}${endpoint}`;
    
    console.log(`   Request URL: ${url}`);
    const response = await axios.get(url, { params: { format: 'json' } });
    
    if (response.data && response.data.refRates && response.data.refRates.sofr) {
      console.log('   ✅ SUCCESS: SOFR rates endpoint is working');
      console.log('   Last updated:', response.data.refRates.sofr.lastUpdated);
      console.log('   Sample rates:');
      
      const rates = response.data.refRates.sofr.rates;
      rates.slice(0, 3).forEach(rate => {
        console.log(`     ${rate.effectiveDate}: ${rate.rate}%`);
      });
      return true;
    } else {
      console.log('   ❌ ERROR: Unexpected response format');
      return false;
    }
  } catch (error) {
    console.log('   ❌ ERROR:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', JSON.stringify(error.response.data).substring(0, 200));
    }
    return false;
  } finally {
    console.log();
  }
}

// Test Treasury yields
async function testTreasuryYields() {
  console.log('2. Testing Treasury Yields endpoint:');
  try {
    const endpoint = `/rates/treasury/range/${startDate}/${endDate}`;
    const url = `${NY_FED_API_BASE_URL}${endpoint}`;
    
    console.log(`   Request URL: ${url}`);
    const response = await axios.get(url, { params: { format: 'json' } });
    
    if (response.data && response.data.Treasury) {
      console.log('   ✅ SUCCESS: Treasury yields endpoint is working');
      console.log('   Last updated:', response.data.Treasury.lastUpdated);
      console.log('   Sample yields:');
      
      const yields = response.data.Treasury.yields;
      yields.slice(0, 3).forEach(yield_ => {
        console.log(`     ${yield_.effectiveDate}: 10Y = ${yield_.t10Year}%, 2Y = ${yield_.t2Year}%`);
      });
      return true;
    } else {
      console.log('   ❌ ERROR: Unexpected response format');
      return false;
    }
  } catch (error) {
    console.log('   


# Create a minimal test script
cat > test-nyfed-simple.js << 'EOF'
const axios = require('axios');

// Simple function to test a NY Fed endpoint
async function testEndpoint(name, url) {
  console.log(`Testing ${name}...`);
  try {
    const response = await axios.get(url);
    console.log(`✅ SUCCESS: ${name} endpoint is working`);
    console.log(`   Status: ${response.status}`);
    return true;
  } catch (error) {
    console.log(`❌ ERROR: ${name} endpoint failed`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Run tests for key endpoints
async function runTests() {
  console.log('=== New York Fed API Test ===\n');
  
  // Current date for range queries
  const today = new Date().toISOString().split('T')[0];
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const oneMonthAgoStr = oneMonthAgo.toISOString().split('T')[0];
  
  // Test all main endpoints
  const results = [];
  
  // Test 1: SOFR latest data
  results.push(await testEndpoint(
    "SOFR latest", 
    "https://markets.newyorkfed.org/api/rates/sofr/last/1.json"
  ));
  
  // Test 2: SOFR range data
  results.push(await testEndpoint(
    "SOFR range", 
    `https://markets.newyorkfed.org/api/rates/sofr/range/${oneMonthAgoStr}/${today}.json`
  ));
  
  // Test 3: Treasury latest data
  results.push(await testEndpoint(
    "Treasury yields", 
    "https://markets.newyorkfed.org/api/rates/treasury/last/1.json"
  ));
  
  // Test 4: EFFR latest data
  results.push(await testEndpoint(
    "EFFR latest", 
    "https://markets.newyorkfed.org/api/rates/effr/last/1.json"
  ));
  
  // Summary
  const allPassed = results.every(Boolean);
  console.log("\n=== Test Summary ===");
  console.log(`Overall result: ${allPassed ? '✅ All tests passed' : '❌ Some tests failed'}`);
  console.log(`Tests passed: ${results.filter(Boolean).length}/${results.length}`);
  
  if (allPassed) {
    console.log("\n🎉 The NY Fed API is working properly and ready to integrate!");
  }
}

// Check for axios and run tests
try {
  runTests();
} catch (err) {
  console.error("Error running tests:", err.message);
  console.error("Please make sure axios is installed with: npm install axios");
}
