#!/usr/bin/env node
const axios = require('axios');
require('dotenv').config();

async function checkFredApiHealth() {
  console.log('Running FRED API health check...');
  
  try {
    const response = await axios.get(`https://api.stlouisfed.org/fred/series?series_id=GNPCA&api_key=${process.env.FRED_API_KEY}&file_type=json`);
    
    if (response.status === 200 && response.data.series) {
      console.log('✅ FRED API connection successful');
      console.log(`Series: ${response.data.series[0].title}`);
      return true;
    } else {
      console.error('❌ Unexpected FRED API response format');
      return false;
    }
  } catch (error) {
    console.error('❌ FRED API check failed:', error.message);
    return false;
  }
}

async function checkEcbApiHealth() {
  console.log('\nRunning ECB API health check...');
  
  try {
    const response = await axios.get('https://sdw-wsrest.ecb.europa.eu/service/data/EXR/D.USD.EUR.SP00.A?startPeriod=2023-01-01&endPeriod=2023-01-10');
    
    if (response.status === 200) {
      console.log('✅ ECB API connection successful');
      return true;
    } else {
      console.error('❌ Unexpected ECB API response');
      return false;
    }
  } catch (error) {
    console.error('❌ ECB API check failed:', error.message);
    return false;
  }
}

async function runAllChecks() {
  const fredResult = await checkFredApiHealth();
  const ecbResult = await checkEcbApiHealth();
  
  console.log('\n=== API Health Check Summary ===');
  console.log(`FRED API: ${fredResult ? '✅ HEALTHY' : '❌ ISSUES DETECTED'}`);
  console.log(`ECB API: ${ecbResult ? '✅ HEALTHY' : '❌ ISSUES DETECTED'}`);
  
  if (!fredResult || !ecbResult) {
    process.exit(1);
  }
}

runAllChecks();
