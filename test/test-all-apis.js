require('dotenv').config();
const axios = require('axios');

// Import all service classes
let BEAService, BLSService, ECBService, NYFedService, CensusApiService;
try {
  BEAService = require('../src/services/BEAService').BEAService;
  console.log('✓ BEA Service imported successfully');
} catch (error) {
  console.error('✗ Failed to import BEA Service:', error.message);
}

try {
  BLSService = require('../src/services/BLSService').BLSService;
  console.log('✓ BLS Service imported successfully');
} catch (error) {
  console.error('✗ Failed to import BLS Service:', error.message);
}

try {
  ECBService = require('../src/services/ECBService').ECBService;
  console.log('✓ ECB Service imported successfully');
} catch (error) {
  console.error('✗ Failed to import ECB Service:', error.message);
}

try {
  NYFedService = require('../src/services/NYFedService').NYFedService;
  console.log('✓ NY Fed Service imported successfully');
} catch (error) {
  console.error('✗ Failed to import NY Fed Service:', error.message);
}

try {
  CensusApiService = require('../src/services/CensusApiService');
  console.log('✓ Census API Service imported successfully');
} catch (error) {
  console.error('✗ Failed to import Census API Service:', error.message);
}

async function testAllApis() {
  console.log('\n======== TESTING ALL API SERVICES ========\n');
  
  // Test BEA API if available
  if (BEAService) {
    try {
      console.log('Testing BEA API...');
      const beaService = new BEAService();
      const data = await beaService.getGDP('Q', 5);
      console.log(`✓ BEA API returned ${data.length} data points`);
      console.log('Sample data:', data.slice(0, 2));
    } catch (error) {
      console.error('✗ BEA API test failed:', error.message);
    }
  }
  
  // Test BLS API if available
  if (BLSService) {
    try {
      console.log('\nTesting BLS API...');
      const blsService = new BLSService();
      const data = await blsService.getUnemploymentRate('2022-01-01', '2022-12-31');
      console.log(`✓ BLS API returned ${data.length} data points`);
      console.log('Sample data:', data.slice(0, 2));
    } catch (error) {
      console.error('✗ BLS API test failed:', error.message);
    }
  }
  
  // Test ECB API if available
  if (ECBService) {
    try {
      console.log('\nTesting ECB API...');
      const ecbService = new ECBService();
      const data = await ecbService.getInterestRates('2022-01-01', '2022-12-31');
      console.log(`✓ ECB API returned ${data.length} data points`);
      console.log('Sample data:', data.slice(0, 2));
    } catch (error) {
      console.error('✗ ECB API test failed:', error.message);
    }
  }
  
  // Test NY Fed API if available
  if (NYFedService) {
    try {
      console.log('\nTesting NY Fed API...');
      const nyFedService = new NYFedService();
      const data = await nyFedService.getSOFRData('2022-01-01', '2022-12-31');
      console.log(`✓ NY Fed API returned ${data.length} data points`);
      console.log('Sample data:', data.slice(0, 2));
    } catch (error) {
      console.error('✗ NY Fed API test failed:', error.message);
    }
  }
  
  // Test Census API if available
  if (CensusApiService) {
    try {
      console.log('\nTesting Census API...');
      const censusService = new CensusApiService();
      const result = await censusService.getPopulationByState();
      if (result.success) {
        console.log(`✓ Census API returned population data for ${result.data.length} states`);
        console.log('Sample data:', result.data.slice(0, 2));
      } else {
        console.error('✗ Census API test failed:', result.error);
      }
    } catch (error) {
      console.error('✗ Census API test failed:', error.message);
    }
  }
  
  console.log('\n======== API TESTING COMPLETE ========\n');
}

testAllApis();
