// Simple NY Fed API test
const axios = require('axios');

// Test one NY Fed API endpoint
(async () => {
  console.log('Testing NY Fed API connectivity...');
  
  try {
    // Test the SOFR endpoint with minimal code
    console.log('Sending request to NY Fed SOFR API endpoint...');
    const url = 'https://markets.newyorkfed.org/api/rates/sofr/last/1.json';
    console.log(`URL: ${url}`);
    
    const response = await axios.get(url, { timeout: 10000 });
    
    console.log(`Status: ${response.status}`);
    
    // Check if we have the expected data structure
    if (response.data && response.data.refRates && response.data.refRates.sofr) {
      console.log('✅ SUCCESS: NY Fed API is accessible and returning proper data');
      
      // Display a small sample of the data
      const lastUpdated = response.data.refRates.sofr.lastUpdated;
      const rates = response.data.refRates.sofr.rates;
      
      console.log(`Data last updated: ${lastUpdated}`);
      console.log(`Latest SOFR rate: ${rates[0].rate}% on ${rates[0].effectiveDate}`);
      
      console.log('\nThe NY Fed API is working correctly and ready for integration.');
    } else {
      console.log('❌ ERROR: Unexpected data format in response');
      console.log('Response keys:', Object.keys(response.data).join(', '));
    }
  } catch (error) {
    console.log('❌ ERROR: Failed to connect to NY Fed API');
    console.log(`Error message: ${error.message}`);
    
    if (error.code) {
      console.log(`Error code: ${error.code}`);
    }
    
    console.log('\nPlease check:');
    console.log('1. Your network connection');
    console.log('2. If the NY Fed API is currently available');
    console.log('3. If there are any firewall restrictions in your environment');
  }
})();
