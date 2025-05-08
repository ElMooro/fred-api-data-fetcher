/**
 * Test script for BIS SDMX RESTful API client with XML format
 */
const { testBisStatsXmlClient } = require('./src/services/bis-stats-client-xml');

console.log('Testing BIS SDMX RESTful API client with XML format...');
testBisStatsXmlClient()
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
