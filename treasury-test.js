const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 5000;

app.get('/', (req, res) => {
  res.json({ message: 'Treasury Test API is running' });
});

// Simple Treasury debt endpoint
app.get('/api/treasury/debt', async (req, res) => {
  try {
    const response = await axios.get('https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny', {
      params: {
        'page[size]': 5,
        'sort': '-record_date',
        'format': 'json'
      }
    });
    
    // Return just the essential data
    res.json({
      success: true,
      data: response.data.data.slice(0, 3)
    });
  } catch (error) {
    console.error('Error details:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching Treasury debt data',
      error: error.message
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Treasury test server running on port ${PORT}`);
});
