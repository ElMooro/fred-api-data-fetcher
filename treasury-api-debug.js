const axios = require('axios');

console.log('Starting Treasury API debug test...');

// Set a timeout for the request
const timeoutMs = 10000; // 10 seconds

// Create a new axios instance with timeout
const instance = axios.create({
  timeout: timeoutMs
});

// Make request with better error handling
instance.get('https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny', {
  params: {
    'page[size]': 3,
    'format': 'json'
  }
})
.then(response => {
  console.log('SUCCESS! Treasury API responded.');
  console.log('Status:', response.status);
  console.log('Headers:', JSON.stringify(response.headers, null, 2));
  console.log('First data item:', JSON.stringify(response.data.data[0], null, 2));
})
.catch(error => {
  console.error('ERROR accessing Treasury API:');
  
  if (error.code === 'ECONNABORTED') {
    console.error('Request timed out after', timeoutMs, 'ms');
  } else if (error.code) {
    console.error('Error code:', error.code);
  }
  
  console.error('Error message:', error.message);
  
  if (error.response) {
    console.error('Response status:', error.response.status);
    console.error('Response headers:', JSON.stringify(error.response.headers, null, 2));
    console.error('Response data:', JSON.stringify(error.response.data, null, 2));
  } else if (error.request) {
    console.error('Request was made but no response was received');
  } else {
    console.error('Error setting up the request:', error.message);
  }
});

console.log('Request sent, waiting for response...');

// Set a timeout to exit if no response
setTimeout(() => {
  console.error('Script timeout reached. No response after', timeoutMs, 'ms');
  process.exit(1);
}, timeoutMs + 1000);
