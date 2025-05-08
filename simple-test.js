const https = require('https');

console.log('Starting NY Fed API test...');

// Basic HTTP GET request without external dependencies
const req = https.get('https://markets.newyorkfed.org/api/rates/sofr/last/1.json', (res) => {
  console.log(`Response status code: ${res.statusCode}`);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response received completely.');
    
    try {
      const parsedData = JSON.parse(data);
      console.log('✅ Successfully parsed JSON response');
      
      if (parsedData.refRates && parsedData.refRates.sofr) {
        console.log('✅ Found SOFR data in response');
        console.log(`Last updated: ${parsedData.refRates.sofr.lastUpdated}`);
        console.log(`Latest rate: ${parsedData.refRates.sofr.rates[0].rate}%`);
        console.log('\nNY Fed API is working correctly!');
      } else {
        console.log('❌ Could not find expected SOFR data in response');
        console.log('Response structure:', Object.keys(parsedData));
      }
    } catch (e) {
      console.log('❌ Failed to parse JSON response');
      console.log('Error:', e.message);
      console.log('First 100 characters of response:', data.substring(0, 100));
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Request failed');
  console.log('Error:', error.message);
});

req.end();
