require('dotenv').config();
const CensusApiService = require('../src/services/CensusApiService');

async function testCensusApi() {
  console.log('======== TESTING CENSUS API ========');
  
  try {
    console.log('Testing Census API Service...');
    const censusService = new CensusApiService();
    
    // Test population data
    console.log('\nTesting Population Data:');
    const populationResult = await censusService.getPopulationByState();
    if (populationResult.success) {
      console.log(`✓ Retrieved population data for ${populationResult.data.length} states`);
      console.log('Sample data:', populationResult.data.slice(0, 2));
    } else {
      console.error('✗ Failed to retrieve population data:', populationResult.error);
    }
    
    // Test income data
    console.log('\nTesting Income Data:');
    const incomeResult = await censusService.getMedianIncomeByState();
    if (incomeResult.success) {
      console.log(`✓ Retrieved income data for ${incomeResult.data.length} states`);
      console.log('Sample data:', incomeResult.data.slice(0, 2));
    } else {
      console.error('✗ Failed to retrieve income data:', incomeResult.error);
    }
    
    // Test housing data
    console.log('\nTesting Housing Data:');
    const housingResult = await censusService.getHousingDataByState();
    if (housingResult.success) {
      console.log(`✓ Retrieved housing data for ${housingResult.data.length} states`);
      console.log('Sample data:', housingResult.data.slice(0, 2));
    } else {
      console.error('✗ Failed to retrieve housing data:', housingResult.error);
    }
    
    // Test education data
    console.log('\nTesting Education Data:');
    const educationResult = await censusService.getEducationByState();
    if (educationResult.success) {
      console.log(`✓ Retrieved education data for ${educationResult.data.length} states`);
      console.log('Sample data:', educationResult.data.slice(0, 2));
    } else {
      console.error('✗ Failed to retrieve education data:', educationResult.error);
    }
    
    // Test county data (California)
    console.log('\nTesting County Data (California):');
    const countyResult = await censusService.getCountyDataByState('06'); // California
    if (countyResult.success) {
      console.log(`✓ Retrieved data for ${countyResult.data.length} counties`);
      console.log('Sample data:', countyResult.data.slice(0, 2));
    } else {
      console.error('✗ Failed to retrieve county data:', countyResult.error);
    }
    
  } catch (error) {
    console.error('Error testing Census API:', error);
  }
  
  console.log('\n======== CENSUS API TESTING COMPLETE ========');
}

testCensusApi();
