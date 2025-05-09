const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find config file
const configFile = execSync('find . -name "*.ts" -exec grep -l "export const CONFIG" {} \\; | head -n 1', {
  encoding: 'utf8'
}).trim();
console.log(`Found config at: ${configFile}`);

// Read config file
const content = fs.readFileSync(configFile, 'utf8');
const match = content.match(/export const CONFIG\s*=\s*({[\s\S]*?});/);
if (!match) {
  console.error('Could not find CONFIG object in file');
  process.exit(1);
}

// Parse CONFIG (using eval for simplicity in this test)
const configStr = match[1].replace(/(\w+):/g, '"$1":');
const CONFIG = eval(`(${configStr})`);

// Test FRED API
console.log('Testing FRED API...');
axios.get(CONFIG.API_ENDPOINTS.FRED, {
  params: {
    series_id: 'GDP',
    api_key: CONFIG.API_KEYS.FRED,
    file_type: 'json',
    observation_start: '2020-01-01',
    observation_end: '2022-01-01'
  }
})
.then(response => {
  console.log('✅ FRED API test successful');
  console.log(`   Retrieved ${response.data.observations?.length || 0} observations`);
  
  // Now test BEA API
  console.log('\nTesting BEA API...');
  return axios.get(CONFIG.API_ENDPOINTS.BEA, {
    params: {
      UserID: CONFIG.API_KEYS.BEA,
      method: 'GetData',
      ResultFormat: 'JSON',
      datasetname: 'NIPA',
      TableName: 'T10101',
      Frequency: 'Q',
      Year: '2022',
      Quarter: 'Q1'
    }
  });
})
.then(response => {
  console.log('✅ BEA API test successful');
  console.log(`   API status: ${response.data.BEAAPI?.Results?.Status || 'Unknown'}`);
  
  // Continue with BLS API
  console.log('\nTesting BLS API...');
  return axios.post(CONFIG.API_ENDPOINTS.BLS, {
    seriesid: ['CUUR0000SA0'],
    startyear: '2021',
    endyear: '2022',
    registrationkey: CONFIG.API_KEYS.BLS
  });
})
.then(response => {
  console.log('✅ BLS API test successful');
  console.log(`   Status: ${response.data.status || 'Unknown'}`);
  
  // Test Treasury Rates API
  console.log('\nTesting Treasury Rates API...');
  return axios.get(CONFIG.API_ENDPOINTS.TREASURY_RATES, {
    params: {
      fields: 'record_date,avg_interest_rate_amt',
      filter: 'security_desc:eq:Treasury Bills',
      'page[size]': 5,
      sort: '-record_date'
    }
  });
})
.then(response => {
  console.log('✅ Treasury Rates API test successful');
  console.log(`   Retrieved ${response.data.data?.length || 0} records`);
  
  console.log('\n🎉 All API tests passed successfully!');
})
.catch(error => {
  console.error('❌ API test failed:', error.message);
  if (error.response) {
    console.error('  Status:', error.response.status);
    console.error('  Data:', JSON.stringify(error.response.data, null, 2).substring(0, 500));
  }
});
