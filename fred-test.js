const axios = require('axios');
const fs = require('fs');
const { execSync } = require('child_process');

// Find the config file
const configFile = execSync('find . -name "*.ts" -exec grep -l "export const CONFIG" {} \\; | head -n 1', {
  encoding: 'utf8'
}).trim();
console.log(`Using config file: ${configFile}`);

// Read the config file
const content = fs.readFileSync(configFile, 'utf8');

// Extract and parse the CONFIG object
const match = content.match(/export const CONFIG\s*=\s*({[\s\S]*?});/);
if (!match) {
  console.error('Could not find CONFIG object in file');
  process.exit(1);
}
const configStr = match[1].replace(/(\w+):/g, '"$1":');
const CONFIG = eval(`(${configStr})`);

// Verify FRED API key and endpoint
console.log('\nVerifying FRED API configuration:');
console.log('FRED API Key:', CONFIG.API_KEYS?.FRED ? '✓ Present' : '✗ Missing');
console.log('FRED API Endpoint:', CONFIG.API_ENDPOINTS?.FRED ? '✓ Present' : '✗ Missing');

// Test FRED API
console.log('\nSending request to FRED API...');
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
  console.log('✅ FRED API test successful!');
  console.log(`   Response status: ${response.status}`);
  console.log(`   Retrieved ${response.data.observations?.length || 0} observations`);
})
.catch(error => {
  console.error('❌ FRED API test failed!');
  console.error(`   Error: ${error.message}`);
  if (error.response) {
    console.error(`   Status: ${error.response.status}`);
    console.error(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
  }
});
