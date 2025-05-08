const axios = require('axios');

console.log('Starting Treasury API test...');

axios.get('https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny', {
  params: {
    'page[size]': 3,
    'format': 'json'
  }
})
.then(response => {
  console.log('SUCCESS! Treasury API responded with data:');
  console.log(JSON.stringify(response.data.data[0], null, 2));
})
.catch(error => {
  console.error('ERROR accessing Treasury API:');
  console.error(error.message);
  if (error.response) {
    console.error('Response status:', error.response.status);
    console.error('Response data:', error.response.data);
  }
});
