/**
 * Minimal test script for Treasury Record-Setting Auction API
 */
const { testRecordAuctionAPI } = require('./src/services/minimal-record-auctions-client');

console.log('Testing minimal Treasury Record-Setting Auction client...');
testRecordAuctionAPI()
  .then(results => {
    // Check if any endpoint was successful
    const successfulEndpoints = Object.entries(results)
      .filter(([_, result]) => result.success)
      .map(([url, _]) => url);
    
    if (successfulEndpoints.length > 0) {
      console.log('\nSuccessful endpoints found:');
      successfulEndpoints.forEach(url => console.log(`- ${url}`));
      console.log('\nUse these endpoints in your client implementation.');
    } else {
      console.log('\nNo successful endpoints found. You may need to:');
      console.log('1. Check the API documentation for the correct endpoint');
      console.log('2. Contact the API provider for assistance');
      console.log('3. Try a different dataset from the catalog');
    }
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
