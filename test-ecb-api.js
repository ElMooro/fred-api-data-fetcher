const axios = require('axios');

console.log('Testing ECB Exchange Rate API...');
axios.get('https://sdw-wsrest.ecb.europa.eu/service/data/EXR/D.USD.EUR.SP00.A', {
  headers: {
    'Accept': 'application/json'
  },
  params: {
    'detail': 'dataonly',
    'startPeriod': '2023-01-01',
    'endPeriod': '2023-01-10'
  },
  timeout: 10000
})
.then(response => {
  console.log('SUCCESS! ECB API responded with data:');
  console.log(JSON.stringify(response.data.dataSets[0].series, null, 2).substring(0, 500) + '...');
})
.catch(error => {
  console.error('ERROR accessing ECB API:');
  console.error(error.message);
  if (error.response) {
    console.error('Response status:', error.response.status);
    console.error('Response data:', JSON.stringify(error.response.data, null, 2));
  }
});
