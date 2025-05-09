const https = require('https');

// Function to make API request
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const statusCode = res.statusCode;
          if (statusCode >= 200 && statusCode < 300) {
            const jsonData = JSON.parse(data);
            resolve({ statusCode, jsonData });
          } else {
            reject(new Error(`HTTP Error: ${statusCode} ${res.statusMessage}\n${data}`));
          }
        } catch (error) {
          reject(new Error(`Parsing Error: ${error.message}\n${data}`));
        }
      });
    }).on('error', (error) => {
      reject(new Error(`Request Error: ${error.message}`));
    });
  });
}

async function testTreasuryBuybacks() {
  console.log('Testing Treasury Securities Buybacks API v1...\n');
  
  try {
    // Test buybacks_operations endpoint
    console.log('1. Testing Buybacks Operations Endpoint...');
    const operationsUrl = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/buybacks_operations?format=json&sort=-operation_date&page[size]=5';
    console.log(`Making request to: ${operationsUrl}`);
    
    const operationsResult = await makeRequest(operationsUrl);
    console.log(`✓ Buybacks Operations API connection successful (Status: ${operationsResult.statusCode})`);
    
    if (operationsResult.jsonData.data && operationsResult.jsonData.data.length > 0) {
      const count = operationsResult.jsonData.data.length;
      console.log(`Retrieved ${count} buyback operations`);
      
      const fields = Object.keys(operationsResult.jsonData.data[0]).join(', ');
      console.log(`Available fields: ${fields}\n`);
      
      console.log('Sample buyback operations:');
      operationsResult.jsonData.data.slice(0, 2).forEach((operation, index) => {
        console.log(`${index + 1}. Operation Date: ${operation.operation_date}`);
        console.log(`   Operation Number: ${operation.operation_nbr}`);
        console.log(`   Settlement Date: ${operation.settlement_date}`);
        console.log(`   Par Amount Accepted: ${operation.par_amt_accepted}`);
        console.log(`   Total Offers Accepted: ${operation.tot_ofr_acc_cnt}`);
        console.log('');
      });
    } else {
      console.log('No buyback operations data found\n');
    }
    
    // Test buybacks_security_details endpoint
    console.log('2. Testing Buybacks Security Details Endpoint...');
    const securityDetailsUrl = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/buybacks_security_details?format=json&sort=-operation_date&page[size]=5';
    console.log(`Making request to: ${securityDetailsUrl}`);
    
    const securityDetailsResult = await makeRequest(securityDetailsUrl);
    console.log(`✓ Buybacks Security Details API connection successful (Status: ${securityDetailsResult.statusCode})`);
    
    if (securityDetailsResult.jsonData.data && securityDetailsResult.jsonData.data.length > 0) {
      const count = securityDetailsResult.jsonData.data.length;
      console.log(`Retrieved ${count} security details records`);
      
      const fields = Object.keys(securityDetailsResult.jsonData.data[0]).join(', ');
      console.log(`Available fields: ${fields}\n`);
      
      console.log('Sample security details:');
      securityDetailsResult.jsonData.data.slice(0, 2).forEach((security, index) => {
        console.log(`${index + 1}. Operation Date: ${security.operation_date}`);
        console.log(`   CUSIP: ${security.cusip}`);
        console.log(`   Security Term: ${security.security_term}`);
        console.log(`   Maturity Date: ${security.maturity_date}`);
        console.log(`   Par Amount Accepted: ${security.par_amt_accepted}`);
        console.log('');
      });
    } else {
      console.log('No security details data found\n');
    }
    
    console.log('===== TREASURY BUYBACKS API TESTING SUMMARY =====');
    console.log('✓ Buybacks Operations endpoint: Working');
    console.log('✓ Buybacks Security Details endpoint: Working');
    console.log('\nTreasury Buybacks API is configured and working properly!');
    
  } catch (error) {
    console.error(`❌ Error testing Treasury Buybacks API: ${error.message}`);
    console.log('\nTroubleshooting tips:');
    console.log('1. Check API endpoint URLs for accuracy');
    console.log('2. Verify network connectivity');
    console.log('3. Check if the API requires authentication');
    console.log('4. Ensure the API is currently available');
  }
}

// Run the test
testTreasuryBuybacks();
