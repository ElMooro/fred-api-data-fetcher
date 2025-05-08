require('dotenv').config();
const axios = require('axios');

// ECB API base URL
const ECB_API_BASE_URL = 'https://sdw-wsrest.ecb.europa.eu/service';

// Get ECB API key from environment variables (if required)
const ecbApiKey = process.env.ECB_API_KEY;

console.log('Running ECB API health check...');

// Check if configuration exists
console.log('Checking ECB API configuration...');
if (!ECB_API_BASE_URL) {
  console.error('❌ ECB API base URL is not configured');
  process.exit(1);
}

// Some ECB endpoints don't require authentication, but check if API key exists if your setup needs it
if (ecbApiKey) {
  console.log('✅ ECB API key found in environment variables');
} else {
  console.log('ℹ️ No ECB API key found in environment variables. Some endpoints may not require authentication.');
}

// Test a simple ECB API request to check connectivity
// This example fetches Euro exchange rates
async function testEcbApi() {
  try {
    console.log('Testing ECB API connectivity...');
    
    // Define the parameters for exchange rate data
    // This is a common public endpoint that doesn't require authentication
    const endpoint = '/data/EXR/D.USD+GBP+JPY.EUR.SP00.A';
    const params = {
      startPeriod: '2023-01-01',
      endPeriod: '2023-01-10',
      format: 'jsondata'
    };

    // Make the request
    const response = await axios.get(`${ECB_API_BASE_URL}${endpoint}`, { params });

    // Check if the response has the expected structure
    if (response.data && response.data.dataSets) {
      console.log('✅ Successfully connected to ECB API');
      console.log('✅ Retrieved exchange rate data');
      
      // Display sample data
      const observations = response.data.dataSets[0].series;
      console.log('\nSample data received:');
      let count = 0;
      for (const seriesKey in observations) {
        if (count < 2) { // Show just a couple of entries
          const seriesData = observations[seriesKey];
          console.log(`  ${seriesKey}: ${JSON.stringify(seriesData.observations).substring(0, 100)}...`);
          count++;
        }
      }
      
      console.log('\n✅ ECB API connection test successful');
      return true;
    } else {
      console.error('❌ Unexpected response format from ECB API');
      console.log('Response:', JSON.stringify(response.data).substring(0, 300) + '...');
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to connect to ECB API:', error.message);
    if (error.response) {
      console.error('Status code:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data).substring(0, 300) + '...');
    }
    return false;
  }
}

// Run the test
(async () => {
  const success = await testEcbApi();
  if (success) {
    console.log('\n✅ ECB API is configured and working properly');
  } else {
    console.error('\n❌ ECB API check failed. Please check your configuration and connectivity.');
  }
})();
