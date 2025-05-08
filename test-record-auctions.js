/**
 * Test script for Treasury Record-Setting Auction API client
 */
const { testRecordAuctionsClient } = require('./src/services/treasury-record-auctions-client');

console.log('Testing Treasury Record-Setting Auction API client...');
testRecordAuctionsClient()
  .then(results => {
    console.log('\nTest completed successfully!');
    console.log(`Retrieved ${results.recentRecords?.length || 0} recent records`);
    console.log(`Analyzed ${results.trends?.totalRecords || 0} historical records`);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
