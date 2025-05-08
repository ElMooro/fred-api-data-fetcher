/**
 * Test script for BIS SDMX RESTful API client with JSON format
 */
const { testBisStatsClientJson } = require('./src/services/bis-stats-client-json');

console.log('Testing BIS SDMX RESTful API client with JSON format...');
testBisStatsClientJson()
  .then(results => {
    console.log('\nTest completed successfully!');
    console.log(results.message);
    console.log('\nSuggested next steps:');
    console.log('1. Further explore available dataflows and their structures');
    console.log('2. Choose specific datasets for your application');
    console.log('3. Implement more specialized methods for data transformation and analysis');
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
