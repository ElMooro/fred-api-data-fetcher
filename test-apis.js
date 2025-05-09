const axios = require('axios');
const { execSync } = require('child_process');
const fs = require('fs');

// Step 1: Find the config file
const configFile = execSync('find . -name "*.ts" -exec grep -l "export const CONFIG" {} \\; | head -n 1', {encoding: 'utf8'}).trim();
console.log(`Using config file: ${configFile}`);

// Step 2: Extract the CONFIG object
let config;
try {
  const fileContent = fs.readFileSync(configFile, 'utf8');
  const match = fileContent.match(/export const CONFIG\s*=\s*({[\s\S]*?});/);
  if (!match) throw new Error('CONFIG object not found in file');
  
  // This is a simple way to convert the config string to a JS object
  // Note: This is not secure for production code but works for our test
  const configStr = match[1].replace(/(\w+):/g, '"$1":');
  config = eval(`(${configStr})`);
} catch (error) {
  console.error('Error loading CONFIG:', error.message);
  process.exit(1);
}

// Step 3: Test each API
async function main() {
  // Setup results tracking
  const results = { success: 0, failed: 0 };
  
  // Helper function to test an API
  async function testApi(name, fn) {
    console.log(`\nTesting ${name}...`);
    try {
      const result = await fn();
      console.log(`✅ ${name}: SUCCESS`);
      if (result) console.log(`   ${result}`);
      results.success++;
    } catch (error) {
      console.log(`❌ ${name}: FAILED`);
      console.log(`   Error: ${error.message}`);
      results.failed++;
    }
  }
  
  // Test FRED API
  await testApi('FRED API', async () => {
    const response = await axios.get(config.API_ENDPOINTS.FRED, {
      params: {
        series_id: 'GDP',
        api_key: config.API_KEYS.FRED,
        file_type: 'json',
        observation_start: '2020-01-01',
        observation_end: '2022-01-01'
      }
    });
    return `Retrieved ${response.data.observations?.length} observations`;
  });
  
  // Test BEA API
  await testApi('BEA API', async () => {
    const response = await axios.get(config.API_ENDPOINTS.BEA, {
      params: {
        UserID: config.API_KEYS.BEA,
        method: 'GetData',
        ResultFormat: 'JSON',
        datasetname: 'NIPA',
        TableName: 'T10101',
        Frequency: 'Q',
        Year: '2022',
        Quarter: 'Q1'
      }
    });
    return `API status: ${response.data.BEAAPI?.Results?.Status || 'Unknown'}`;
  });
  
  // Test BLS API
  await testApi('BLS API', async () => {
    const response = await axios.post(config.API_ENDPOINTS.BLS, {
      seriesid: ['CUUR0000SA0'],
      startyear: '2021',
      endyear: '2022',
      registrationkey: config.API_KEYS.BLS
    });
    return `Status: ${response.data.status || 'Unknown'}`;
  });
  
  // Test Census API
  await testApi('Census API', async () => {
    const year = '2021';
    const dataset = 'acs/acs1';
    const variables = ['NAME', 'B01001_001E'];
    const url = `${config.API_ENDPOINTS.CENSUS}/${year}/${dataset}?get=${variables.join(",")}&key=${config.API_KEYS.CENSUS}`;
    
    const response = await axios.get(url);
    return `Retrieved ${response.data.length} rows of data`;
  });
  
  // Test ECB API
  await testApi('ECB API', async () => {
    const flowRef = 'EXR';
    const key = 'D.USD.EUR.SP00.A';
    const url = `${config.API_ENDPOINTS.ECB}/${flowRef}/${key}`;
    
    const response = await axios.get(url, {
      params: {
        startPeriod: '2022-01-01',
        endPeriod: '2022-01-31',
        format: 'jsondata'
      },
      headers: {
        'Accept': 'application/json'
      }
    });
    return `Retrieved data successfully`;
  });
  
  // Test BIS API
  await testApi('BIS API', async () => {
    const resource = 'stats/full/LBS-D/D-PL/USD/I';
    const response = await axios.get(`${config.API_ENDPOINTS.BIS}/${resource}`, {
      params: { last: 4 }
    });
    return `Retrieved BIS data successfully`;
  });
  
  // Test Treasury Rates API
  await testApi('Treasury Rates API', async () => {
    const response = await axios.get(config.API_ENDPOINTS.TREASURY_RATES, {
      params: {
        fields: 'record_date,avg_interest_rate_amt',
        filter: 'security_desc:eq:Treasury Bills',
        'page[size]': 5,
        sort: '-record_date'
      }
    });
    return `Retrieved ${response.data.data?.length} records`;
  });
  
  // Test Treasury Auctions API
  await testApi('Treasury Auctions API', async () => {
    const response = await axios.get(config.API_ENDPOINTS.TREASURY_AUCTIONS, {
      params: {
        fields: 'security_term,security_type,issue_date,maturity_date',
        sort: '-issue_date',
        'page[size]': 5
      }
    });
    return `Retrieved ${response.data.data?.length} auctions`;
  });
  
  // Test Treasury Record Auctions API
  await testApi('Treasury Record Auctions API', async () => {
    const response = await axios.get(config.API_ENDPOINTS.TREASURY_RECORD_AUCTIONS, {
      params: {
        fields: 'record_date,security_type,security_term',
        sort: '-record_date',
        'page[size]': 5
      }
    });
    return `Retrieved ${response.data.data?.length} record auctions`;
  });
  
  // Test Treasury Direct Securities API
  await testApi('TreasuryDirect Securities API', async () => {
    const response = await axios.get(config.API_ENDPOINTS.TREASURY_DIRECT_SECURITIES, {
      params: {
        fields: 'record_date,security_type,security_term,offering_amt',
        sort: '-record_date',
        'page[size]': 5
      }
    });
    return `Retrieved ${response.data.data?.length} direct securities`;
  });
  
  // Test Treasury Buybacks API
  await testApi('Treasury Buybacks API', async () => {
    const response = await axios.get(config.API_ENDPOINTS.TREASURY_BUYBACKS, {
      params: {
        fields: 'record_date,security_type,cusip,security_term',
        sort: '-record_date',
        'page[size]': 5
      }
    });
    return `Retrieved ${response.data.data?.length} buybacks`;
  });
  
  // Print summary
  console.log('\n=== API TEST SUMMARY ===');
  console.log(`Total APIs tested: ${results.success + results.failed}`);
  console.log(`Successful: ${results.success}`);
  console.log(`Failed: ${results.failed}`);
  
  if (results.failed === 0) {
    console.log('\n🎉 All API connections are working! Your application should function correctly.');
  } else {
    console.log(`\n⚠️ ${results.failed} API(s) failed. Please check the errors above.`);
  }
}

main().catch(error => {
  console.error('An unexpected error occurred:', error.message);
  process.exit(1);
});
