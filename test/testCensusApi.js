// test/testCensusApi.js

require('dotenv').config();
const CensusApiService = require('../src/services/CensusApiService');

async function testCensusApi() {
  const censusService = new CensusApiService();
  
  console.log('Testing Census API Service...');
  
  try {
    console.log('\nTesting Population Data:');
    const populationResult = await censusService.getPopulationByState();
    console.log(`✓ Retrieved population data for ${populationResult.data.length} states`);
    console.log('Sample data:', populationResult.data.slice(0, 3));
    
    console.log('\nTesting Income Data:');
    const incomeResult = await censusService.getMedianIncomeByState();
    console.log(`✓ Retrieved income data for ${incomeResult.data.length} states`);
    console.log('Sample data:', incomeResult.data.slice(0, 3));
    
    console.log('\nTesting Housing Data:');
    const housingResult = await censusService.getHousingDataByState();
    console.log(`✓ Retrieved housing data for ${housingResult.data.length} states`);
    console.log('Sample data:', housingResult.data.slice(0, 3));
    
    console.log('\nTesting Education Data:');
    const educationResult = await censusService.getEducationByState();
    console.log(`✓ Retrieved education data for ${educationResult.data.length} states`);
    console.log('Sample data:', educationResult.data.slice(0, 3));
    
    console.log('\nTesting County Data (California):');
    const countyResult = await censusService.getCountyDataByState('06'); // California
    console.log(`✓ Retrieved data for ${countyResult.data.length} counties`);
    console.log('Sample data:', countyResult.data.slice(0, 3));
    
    console.log('\n===========================================================');
    console.log('               Census API Integration Complete              ');
    console.log('===========================================================');
    
  } catch (error) {
    console.error('Error testing Census API:', error);
  }
}

testCensusApi();
