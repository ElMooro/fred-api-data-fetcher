/**
 * Test script for Treasury Buybacks API client
 */
const { testTreasuryBuybacksClient } = require('./src/services/treasury-buybacks-client');

console.log('Testing Treasury Buybacks API client...');
testTreasuryBuybacksClient()
  .then(() => {
    console.log('\nTest completed successfully');
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
