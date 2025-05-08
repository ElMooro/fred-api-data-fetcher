require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

// Initialize app
const app = express();
const PORT = 4000; // Using a different port to avoid conflicts

// Middleware
app.use(cors());
app.use(express.json());

// Calculate period-to-period changes
function calculateChanges(data) {
  return data.map((item, index) => {
    if (index === 0) {
      return { ...item, change: null, percentChange: null };
    }
    
    const currentValue = parseFloat(item.value);
    const previousValue = parseFloat(data[index - 1].value);
    
    if (isNaN(currentValue) || isNaN(previousValue)) {
      return { ...item, change: null, percentChange: null };
    }
    
    const change = currentValue - previousValue;
    const percentChange = previousValue !== 0 ? (change / Math.abs(previousValue)) * 100 : null;
    
    return {
      ...item,
      change: change.toFixed(4),
      percentChange: percentChange !== null ? percentChange.toFixed(2) + '%' : null,
    };
  });
}

// Basic home route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Financial Data Platform API', 
    version: '1.0.0',
    status: 'running',
    endpoints: {
      fred: '/api/fred/series/:seriesId',
      treasury: ['/api/treasury/debt', '/api/treasury/yield-curve']
    }
  });
});

// FRED API endpoint with period-to-period changes
app.get('/api/fred/series/:seriesId', async (req, res) => {
  try {
    const { seriesId } = req.params;
    const { calculateChanges: calcChanges } = req.query;
    
    const response = await axios.get('https://api.stlouisfed.org/fred/series/observations', {
      params: {
        series_id: seriesId,
        api_key: process.env.FRED_API_KEY,
        file_type: 'json',
        observation_start: '2020-01-01',
        observation_end: '2025-01-01'
      }
    });
    
    // Add period-to-period change calculations if requested
    if (calcChanges === 'true' && response.data && response.data.observations) {
      response.data.observations = calculateChanges(response.data.observations);
    }
    
    res.json(response.data);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Treasury API - Debt data endpoint
app.get('/api/treasury/debt', async (req, res) => {
  try {
    const { calculateChanges: calcChanges } = req.query;
    
    const response = await axios.get('https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny', {
      params: {
        'page[size]': 10,
        'sort': '-record_date',
        'format': 'json'
      }
    });
    
    // Calculate period-to-period changes if requested
    if (calcChanges === 'true' && response.data.data) {
      // Map Treasury data to format expected by calculateChanges function
      const mappedData = response.data.data.map(item => ({
        ...item,
        value: item.tot_pub_debt_out_amt
      }));
      
      // Calculate changes
      const dataWithChanges = calculateChanges(mappedData);
      
      // Put changed data back into response
      response.data.data = dataWithChanges;
    }
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching Treasury debt data:', error.message);
    res.status(500).json({ 
      message: 'Error fetching Treasury debt data', 
      error: error.message 
    });
  }
});

// Treasury API - Yield curve data endpoint
app.get('/api/treasury/yield-curve', async (req, res) => {
  try {
    const { calculateChanges: calcChanges } = req.query;
    
    const response = await axios.get('https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/avg_interest_rates', {
      params: {
        'page[size]': 10,
        'sort': '-record_date',
        'filter': 'security_type:eq:Marketable',
        'format': 'json'
      }
    });
    
    // Calculate period-to-period changes if requested
    if (calcChanges === 'true' && response.data.data) {
      // Map Treasury data to format expected by calculateChanges function
      const mappedData = response.data.data.map(item => ({
        ...item,
        value: item.avg_interest_rate_amt
      }));
      
      // Calculate changes
      const dataWithChanges = calculateChanges(mappedData);
      
      // Put changed data back into response
      response.data.data = dataWithChanges;
    }
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching Treasury yield curve data:', error.message);
    res.status(500).json({ 
      message: 'Error fetching Treasury yield curve data', 
      error: error.message 
    });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
