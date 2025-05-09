const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all requests
app.use(cors());
app.use(express.json());

// Add API key verification middleware
const verifyAPIKeys = (req, res, next) => {
  const missingKeys = [];
  if (!process.env.REACT_APP_FRED_API_KEY) missingKeys.push('FRED');
  if (!process.env.REACT_APP_BEA_API_KEY) missingKeys.push('BEA');
  if (!process.env.REACT_APP_BLS_API_KEY) missingKeys.push('BLS');
  if (!process.env.REACT_APP_CENSUS_API_KEY) missingKeys.push('CENSUS');
  
  if (missingKeys.length > 0) {
    console.warn(`Warning: Missing API keys for: ${missingKeys.join(', ')}`);
  }
  next();
};

app.use(verifyAPIKeys);

// FRED API proxy
app.get('/api/fred/:series', async (req, res) => {
  try {
    const { series } = req.params;
    const { start_date, end_date } = req.query;
    
    const response = await axios.get(`https://api.stlouisfed.org/fred/series/observations`, {
      params: {
        series_id: series,
        api_key: process.env.REACT_APP_FRED_API_KEY,
        file_type: 'json',
        observation_start: start_date || '2023-01-01',
        observation_end: end_date || '2025-05-09',
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('FRED API Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch FRED data', details: error.message });
  }
});

// BEA API proxy
app.get('/api/bea', async (req, res) => {
  try {
    const params = {
      UserID: process.env.REACT_APP_BEA_API_KEY,
      method: 'GetData',
      ResultFormat: 'JSON',
      ...req.query
    };
    
    const response = await axios.get('https://apps.bea.gov/api/data', { params });
    res.json(response.data);
  } catch (error) {
    console.error('BEA API Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch BEA data', details: error.message });
  }
});

// BLS API proxy
app.post('/api/bls', async (req, res) => {
  try {
    const response = await axios.post('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
      ...req.body,
      registrationkey: process.env.REACT_APP_BLS_API_KEY
    });
    res.json(response.data);
  } catch (error) {
    console.error('BLS API Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch BLS data', details: error.message });
  }
});

// Census API proxy
app.get('/api/census/:year/:dataset', async (req, res) => {
  try {
    const { year, dataset } = req.params;
    const { get } = req.query;
    
    const url = `https://api.census.gov/data/${year}/${dataset}?get=${get}&key=${process.env.REACT_APP_CENSUS_API_KEY}`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error('Census API Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch Census data', details: error.message });
  }
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    keys: {
      FRED: process.env.REACT_APP_FRED_API_KEY ? 'configured' : 'missing',
      BEA: process.env.REACT_APP_BEA_API_KEY ? 'configured' : 'missing',
      BLS: process.env.REACT_APP_BLS_API_KEY ? 'configured' : 'missing',
      CENSUS: process.env.REACT_APP_CENSUS_API_KEY ? 'configured' : 'missing'
    }
  });
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
