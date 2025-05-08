/**
 * Test script for BIS Stats Simple Client
 */
const { testBisStatsSimpleClient } = require('./src/services/bis-stats-client-simple');

console.log('Testing BIS Stats Simple Client...');
testBisStatsSimpleClient()
  .then(results => {
    console.log('\nTest completed successfully!');
    console.log(results.message);
    console.log('\nThis client provides simple access to BIS statistical data using the API endpoints that have been confirmed to work.');
    console.log('Suggested next steps:');
    console.log('1. Choose specific datasets for your application');
    console.log('2. Add methods for filtering data by date, country, or other dimensions');
    console.log('3. Implement data visualization or analysis functions');
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
