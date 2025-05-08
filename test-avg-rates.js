/**
 * Test script for Treasury Average Interest Rates API client
 */
const { testAvgRatesClient } = require('./src/services/treasury-avg-rates-client');

console.log('Testing Treasury Average Interest Rates API client...');
testAvgRatesClient()
  .then(results => {
    console.log('\nTest completed successfully!');
    console.log(`Retrieved ${results.recentRates?.length || 0} recent rate records`);
    console.log(`Analyzed trends for Treasury Bills over ${results.trends?.timeframe?.months || 0} months`);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
