/**
 * Test script for Treasury Securities Auctions Data API
 */
const { testTreasuryClient } = require('./src/services/treasury-api-client');

console.log('Testing Treasury API client...');
testTreasuryClient()
  .then(result => {
    if (result && result.data && result.data.length > 0) {
      console.log(`✅ Success! Retrieved ${result.data.length} auction records.`);
    } else {
      console.log('⚠️ Warning: Received response but no data was found.');
    }
  })
  .catch(error => {
    console.error(`❌ Test failed: ${error.message}`);
  });
