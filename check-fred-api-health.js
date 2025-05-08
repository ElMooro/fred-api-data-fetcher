#!/usr/bin/env node
const FredApiClient = require('./src/services/fredApiClient');

async function checkApiHealth() {
  console.log('Running FRED API health check...');
  
  const client = new FredApiClient();
  
  try {
    // Validate API key
    console.log('Validating API key...');
    const isValidKey = await client.validateApiKey();
    
    if (!isValidKey) {
      console.error('❌ API key validation failed');
      process.exit(1);
    }
    
    console.log('✅ API key is valid');
    
    // Test data retrieval
    console.log('Testing data retrieval...');
    const data = await client.getSeriesData('GNPCA', { limit: 5 });
    
    console.log(`✅ Successfully retrieved ${data.observations.length} observations for series GNPCA`);
    console.log('Sample data:', data.observations[0]);
    
    console.log('\n🎉 FRED API health check passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ FRED API health check failed:', error.message);
    process.exit(1);
  }
}

checkApiHealth();