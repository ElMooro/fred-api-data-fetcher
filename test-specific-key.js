const https = require('https');

// API key to test
const apiKey = '2f057499936072679d8843d7fce9998';

console.log('Testing FRED API key:', apiKey);
console.log('Key length:', apiKey.length);
console.log('Key format check (should be 32 char alphanumeric):', /^[a-z0-9]{32}$/.test(apiKey));

// Create the API URL with the key
const url = `https://api.stlouisfed.org/fred/series?series_id=GNPCA&api_key=${apiKey}&file_type=json`;

console.log('\nMaking request to:', url);

// Make the request
https.get(url, (res) => {
  console.log('Response status code:', res.statusCode);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\nResponse data:');
    try {
      const parsedData = JSON.parse(data);
      console.log(JSON.stringify(parsedData, null, 2));
      
      if (res.statusCode === 200) {
        console.log('\n✅ API key is VALID');
      } else {
        console.log('\n❌ API key is INVALID');
      }
    } catch (e) {
      console.log('Raw response:', data);
      console.log('\n❌ API key is INVALID (could not parse JSON response)');
    }
  });
}).on('error', (e) => {
  console.error('Request error:', e.message);
  console.log('\n❌ API key is INVALID (request error)');
});
