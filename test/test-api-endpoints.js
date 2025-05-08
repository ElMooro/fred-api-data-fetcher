const axios = require('axios');

// Base URL for the API
const BASE_URL = 'http://localhost:3000/api';

async function testEndpoints() {
  console.log('======== TESTING API ENDPOINTS ========');
  console.log('Note: This test assumes your server is running on localhost:3000');
  
  const endpoints = [
    { url: '/census/population', name: 'Census Population' },
    { url: '/census/income', name: 'Census Income' },
    { url: '/census/housing', name: 'Census Housing' },
    { url: '/census/education', name: 'Census Education' },
    { url: '/census/counties/06', name: 'Census Counties (California)' },
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\nTesting ${endpoint.name} endpoint: ${BASE_URL}${endpoint.url}`);
      const response = await axios.get(`${BASE_URL}${endpoint.url}`);
      
      if (response.status === 200 && response.data.success) {
        console.log(`✓ ${endpoint.name} endpoint is working`);
        if (response.data.data && response.data.data.length > 0) {
          console.log(`  ✓ Returned ${response.data.data.length} items`);
          console.log('  Sample data:', response.data.data.slice(0, 2));
        } else {
          console.log('  ! No data returned');
        }
      } else {
        console.error(`✗ ${endpoint.name} endpoint returned an error`);
        console.error('  Response:', response.data);
      }
    } catch (error) {
      console.error(`✗ ${endpoint.name} endpoint failed:`, error.message);
    }
  }
  
  console.log('\n======== API ENDPOINT TESTING COMPLETE ========');
}

testEndpoints();
