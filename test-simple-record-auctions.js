/**
 * Simple test script for Treasury Record-Setting Auction API
 */
const { testSimpleClient } = require('./src/services/simple-record-auctions-client');

console.log('Testing simple Treasury Record-Setting Auction client...');
testSimpleClient()
  .then(data => {
    if (data && data.data) {
      console.log(`\nTest completed successfully with ${data.data.length} records.`);
    } else {
      console.log('\nTest completed but no records were found.');
    }
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
