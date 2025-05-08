/**
 * BIS SDMX API Explorer
 * 
 * This script explores the Bank for International Settlements (BIS) SDMX API
 * to identify working endpoints and access patterns.
 */
const { exploreBisStatsApi } = require('./src/services/bis-stats-client');

console.log('BIS SDMX API Explorer');
console.log('====================');

exploreBisStatsApi()
  .then(results => {
    console.log('\nExploration completed.');
    
    if (results.workingEndpoints.length > 0) {
      console.log('\nSUCCESS: Found working endpoints!');
      console.log('Follow-up steps:');
      console.log('1. Use the working endpoints in your implementation');
      console.log('2. Check the BIS documentation for more specific usage patterns');
      console.log('3. Develop a client focused on the endpoints that work');
    } else {
      console.log('\nNo working endpoints found. Possible issues:');
      console.log('1. The BIS API may be unavailable or restricted');
      console.log('2. The API endpoints may have changed');
      console.log('3. The API may require authentication or API keys');
      console.log('4. You may need to check the official documentation');
    }
  })
  .catch(error => {
    console.error('Exploration failed:', error);
    process.exit(1);
  });
