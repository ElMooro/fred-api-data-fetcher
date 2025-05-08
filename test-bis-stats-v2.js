/**
 * Test script for BIS SDMX RESTful API client v2
 */
const { testBisStatsClientV2 } = require('./src/services/bis-stats-client-v2');

console.log('Testing BIS SDMX RESTful API client v2...');
testBisStatsClientV2()
  .then(results => {
    console.log('\nTest completed successfully!');
    console.log(results.message);
    console.log('\nSuggested next steps:');
    console.log('1. Further explore available dataflows and their structures');
    console.log('2. Investigate the specific dataset content you need');
    console.log('3. Create more specialized methods for your use cases');
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
