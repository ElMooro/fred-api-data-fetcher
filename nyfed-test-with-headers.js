const https = require('https');

console.log('Starting NY Fed API test with improved headers...');

// Define request options with headers
const options = {
  hostname: 'markets.newyorkfed.org',
  path: '/api/rates/sofr/last/1.json',
  method: 'GET',
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 Node.js API Test',
    'Accept-Language': 'en-US,en;q=0.9'
  }
};

// Function to test different endpoints
function testEndpoint(path) {
  console.log(`\nTesting endpoint: ${path}`);
  
  const requestOptions = {
    ...options,
    path: path
  };
  
  const req = https.request(requestOptions, (res) => {
    console.log(`Status code: ${res.statusCode} ${res.statusMessage}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);
    
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`Response length: ${data.length} characters`);
      
      if (data.length > 0) {
        console.log(`Response preview: ${data.substring(0, 100)}...`);
        
        if (res.statusCode === 200) {
          try {
            const parsedData = JSON.parse(data);
            console.log('✅ Successfully parsed JSON response');
          } catch (e) {
            console.log('❌ Failed to parse JSON response');
            console.log(`Error: ${e.message}`);
          }
        }
      } else {
        console.log('Empty response body');
      }
    });
  });
  
  req.on('error', (e) => {
    console.error(`❌ Request error: ${e.message}`);
  });
  
  req.end();
}

// Test several different formats of the API
console.log('Testing multiple NY Fed API endpoints to find working format...');
testEndpoint('/api/rates/sofr/last/1.json');
setTimeout(() => testEndpoint('/api/rates/sofr/last/1'), 1000);
setTimeout(() => testEndpoint('/api/rates/sofr'), 2000);
setTimeout(() => testEndpoint('/api/rss/sofr.xml'), 3000);
