const https = require('https');

// Use the key directly without any code from your app
const apiKey = 'a8df6aeca3b71980ad53ebccecb3cb3e';

console.log('Testing with key:', apiKey);
console.log('Key length:', apiKey.length);
console.log('Key character check:', /^[a-z0-9]+$/.test(apiKey));

// Build the URL exactly as it should be for the FRED API
const url = `https://api.stlouisfed.org/fred/series?series_id=GNPCA&api_key=${apiKey}&file_type=json`;

console.log('\nFull request URL:', url);

// Make a direct request to test connectivity
https.get(url, (res) => {
  console.log('\nResponse status code:', res.statusCode);
  console.log('Response headers:', JSON.stringify(res.headers, null, 2));
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\nRaw response:');
    console.log(data);
    
    try {
      const parsedData = JSON.parse(data);
      console.log('\nParsed JSON response:', JSON.stringify(parsedData, null, 2));
    } catch (e) {
      console.error('\nError parsing JSON:', e.message);
    }
  });
}).on('error', (e) => {
  console.error('\nRequest error:', e.message);
});

// Let's also try with the alternate key you provided earlier
const alternateKey = '2f057499936072679d8843d7fce99989';
console.log('\n\n==== Testing with alternate key ====');
console.log('Testing with key:', alternateKey);
console.log('Key length:', alternateKey.length);
console.log('Key character check:', /^[a-z0-9]+$/.test(alternateKey));

const alternateUrl = `https://api.stlouisfed.org/fred/series?series_id=GNPCA&api_key=${alternateKey}&file_type=json`;
console.log('\nFull request URL:', alternateUrl);

https.get(alternateUrl, (res) => {
  console.log('\nResponse status code (alternate key):', res.statusCode);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const parsedData = JSON.parse(data);
      console.log('\nParsed JSON response (alternate key):', JSON.stringify(parsedData, null, 2));
    } catch (e) {
      console.error('\nError parsing JSON (alternate key):', e.message);
      console.log('\nRaw response (alternate key):');
      console.log(data);
    }
  });
}).on('error', (e) => {
  console.error('\nRequest error (alternate key):', e.message);
});
