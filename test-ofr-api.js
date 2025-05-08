const axios = require('axios');

console.log('Testing OFR Financial Stress Index API...');
axios.get('https://data.financialresearch.gov/v1/fsi', {
  params: { limit: 5 },
  timeout: 5000
})
.then(response => {
  console.log('SUCCESS! OFR API responded with data:');
  console.log('Data count:', response.data.data.length);
  console.log('First item:', JSON.stringify(response.data.data[0], null, 2));
})
.catch(error => {
  console.error('ERROR accessing OFR API:');
  console.error(error.message);
  if (error.response) {
    console.error('Response status:', error.response.status);
    console.error('Response data:', JSON.stringify(error.response.data, null, 2));
  }
});
