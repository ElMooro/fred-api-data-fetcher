/**
 * Test script for BIS Stats Clean Client
 */
const { testBisStatsClient } = require('./src/services/bis-stats-client-clean');

console.log('Testing BIS Stats Clean Client...');
testBisStatsClient()
  .then(results => {
    console.log('\nTest completed successfully!');
    console.log(results.message);
    console.log('\nThis client provides clean access to BIS statistical data using verified working endpoints.');
    console.log('\nUsage examples:');
    console.log('1. const client = new BisStatsClient();');
    console.log('2. const eerResponse = await client.getExchangeRates("M");');
    console.log('3. const series = client.extractDataSeries(eerResponse);');
    console.log('4. const filteredData = client.filterByCountry(series, "US");');
    console.log('5. const csv = client.convertToCSV(filteredData);');
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
