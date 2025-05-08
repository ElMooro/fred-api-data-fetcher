/**
 * Test script for BIS SDMX RESTful API Direct client
 */
const { testBisStatsDirectClient } = require('./src/services/bis-stats-client-direct');

console.log('Testing BIS SDMX RESTful API Direct client...');
testBisStatsDirectClient()
  .then(results => {
    console.log('\nTest completed successfully!');
    console.log(results.message);
    console.log('\nSuggested next steps:');
    console.log('1. Choose specific datasets for your application');
    console.log('2. Add methods for specific data queries (by date, country, etc.)');
    console.log('3. Implement data transformation and analysis functions');
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
