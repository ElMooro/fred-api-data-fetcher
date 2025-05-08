const https = require('https');

// Your FRED API key
const apiKey = 'a8df6aeca3b71980ad53ebccecb3cb3e';

console.log('Testing FRED API key...');

// Build the URL for a simple test request
const url = `https://api.stlouisfed.org/fred/series?series_id=GNPCA&api_key=${apiKey}&file_type=json`;

// Make the request
https.get(url, (res) => {
  console.log(`Status code: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ SUCCESS! Your FRED API key is valid and working.');
      try {
        const result = JSON.parse(data);
        if (result.seriess && result.seriess.length > 0) {
          console.log('Series title:', result.seriess[0].title);
          console.log('Last updated:', result.seriess[0].last_updated);
        }
      } catch (e) {
        console.log('Note: Could not parse response data');
      }
    } else {
      console.log('❌ ERROR: Your FRED API key is not working correctly.');
      console.log('Response:', data);
    }
  });
}).on('error', (error) => {
  console.log('❌ ERROR: Network problem encountered.');
  console.log(error.message);
});

// Also test with a different endpoint
console.log('\nTesting data retrieval...');
const dataUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=GDP&api_key=${apiKey}&file_type=json&limit=5`;

https.get(dataUrl, (res) => {
  console.log(`Status code: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ SUCCESS! Data retrieval is working.');
      try {
        const result = JSON.parse(data);
        if (result.observations && result.observations.length > 0) {
          console.log('Retrieved', result.observations.length, 'observations');
          console.log('Sample data point:', result.observations[0]);
        }
      } catch (e) {
        console.log('Note: Could not parse response data');
      }
    } else {
      console.log('❌ ERROR: Data retrieval failed.');
      console.log('Response:', data);
    }
  });
}).on('error', (error) => {
  console.log('❌ ERROR: Network problem encountered.');
  console.log(error.message);
});
