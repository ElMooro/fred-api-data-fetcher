const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Calculate period-to-period changes
function calculateChanges(data, valueKey = 'value') {
  return data.map((item, index) => {
    if (index === 0) {
      return { ...item, change: null, percentChange: null };
    }
    
    const currentValue = parseFloat(item[valueKey]);
    const previousValue = parseFloat(data[index - 1][valueKey]);
    
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

// Home route
app.get('/', (req, res) => {
  res.json({
    message: 'Financial Data Platform API',
    version: '1.0.0',
    endpoints: {
      fred: '/api/fred/series/:seriesId',
      treasury: '/api/treasury/debt',
      ecb: ['/api/ecb/exchange-rates', '/api/ecb/interest-rates']
    }
  });
});

// FRED API endpoint
app.get('/api/fred/series/:seriesId', async (req, res) => {
  try {
    const { seriesId } = req.params;
    const { calculateChanges: calcChanges } = req.query;
    
    const response = await axios.get('https://api.stlouisfed.org/fred/series/observations', {
      params: {
        series_id: seriesId,
        api_key: '2f057499936072679d8843d7fce99989',
        file_type: 'json',
        observation_start: '2020-01-01',
        observation_end: '2025-01-01'
      }
    });
    
    // Add period-to-period changes
    if (calcChanges === 'true' && response.data && response.data.observations) {
      response.data.observations = calculateChanges(response.data.observations);
    }
    
    res.json(response.data);
  } catch (error) {
    console.error('FRED API error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Treasury debt data endpoint
app.get('/api/treasury/debt', async (req, res) => {
  try {
    const { calculateChanges: calcChanges } = req.query;
    
    console.log('Fetching Treasury debt data...');
    const response = await axios.get('https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny', {
      params: {
        'page[size]': 10,
        'sort': '-record_date',
        'format': 'json'
      }
    });
    console.log('Treasury API response received');
    
    // Calculate changes if requested
    if (calcChanges === 'true' && response.data && response.data.data) {
      const dataWithValueField = response.data.data.map(item => ({
        ...item,
        value: item.tot_pub_debt_out_amt
      }));
      
      response.data.data = calculateChanges(dataWithValueField, 'value');
    }
    
    res.json(response.data);
  } catch (error) {
    console.error('Treasury API error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ECB Exchange Rate endpoint
app.get('/api/ecb/exchange-rates', async (req, res) => {
  try {
    const { currency, startPeriod, endPeriod, calculateChanges: calcChanges } = req.query;
    
    // Default to USD/EUR if no currency specified
    const targetCurrency = currency || 'USD';
    
    console.log(`Fetching ECB ${targetCurrency}/EUR exchange rate data...`);
    const response = await axios.get(`https://sdw-wsrest.ecb.europa.eu/service/data/EXR/D.${targetCurrency}.EUR.SP00.A`, {
      headers: {
        'Accept': 'application/json'
      },
      params: {
        'detail': 'dataonly',
        'startPeriod': startPeriod || '2023-01-01',
        'endPeriod': endPeriod || '2025-01-01'
      },
      timeout: 10000
    });
    console.log('ECB API response received');
    
    // ECB data structure is complex, so let's transform it into a more usable format
    const seriesData = response.data.dataSets[0].series;
    const timeFormat = response.data.structure.dimensions.observation[0];
    
    // Get the first (and usually only) series key
    const seriesKey = Object.keys(seriesData)[0];
    const observations = seriesData[seriesKey].observations;
    
    // Transform into a more usable format
    const transformedData = Object.entries(observations).map(([timeIndex, values]) => {
      return {
        date: timeFormat.values[parseInt(timeIndex)].id,
        value: values[0].toString()
      };
    });
    
    // Sort by date
    transformedData.sort((a, b) => a.date.localeCompare(b.date));
    
    // Calculate changes if requested
    let finalData = transformedData;
    if (calcChanges === 'true') {
      finalData = calculateChanges(transformedData);
    }
    
    res.json({
      currency: targetCurrency,
      baseCurrency: 'EUR',
      data: finalData
    });
  } catch (error) {
    console.error('ECB API error:', error.message);
    res.status(500).json({ 
      error: error.message, 
      source: 'ECB API',
      endpoint: '/api/ecb/exchange-rates' 
    });
  }
});

// ECB Interest Rates endpoint
app.get('/api/ecb/interest-rates', async (req, res) => {
  try {
    const { startPeriod, endPeriod, calculateChanges: calcChanges } = req.query;
    
    console.log('Fetching ECB interest rate data...');
    const response = await axios.get('https://sdw-wsrest.ecb.europa.eu/service/data/FM/B.U2.EUR.4F.KR.MRR_FR.LEV', {
      headers: {
        'Accept': 'application/json'
      },
      params: {
        'detail': 'dataonly',
        'startPeriod': startPeriod || '2020-01-01',
        'endPeriod': endPeriod || '2025-01-01'
      },
      timeout: 10000
    });
    console.log('ECB Interest Rates API response received');
    
    // Transform ECB data structure into a more usable format
    const seriesData = response.data.dataSets[0].series;
    const timeFormat = response.data.structure.dimensions.observation[0];
    
    // Get the first (and usually only) series key
    const seriesKey = Object.keys(seriesData)[0];
    const observations = seriesData[seriesKey].observations;
    
    // Transform into a more usable format
    const transformedData = Object.entries(observations).map(([timeIndex, values]) => {
      return {
        date: timeFormat.values[parseInt(timeIndex)].id,
        value: values[0].toString()
      };
    });
    
    // Sort by date
    transformedData.sort((a, b) => a.date.localeCompare(b.date));
    
    // Calculate changes if requested
    let finalData = transformedData;
    if (calcChanges === 'true') {
      finalData = calculateChanges(transformedData);
    }
    
    res.json({
      indicator: 'ECB Main Refinancing Operations Interest Rate',
      data: finalData
    });
  } catch (error) {
    console.error('ECB Interest Rates API error:', error.message);
    res.status(500).json({ 
      error: error.message, 
      source: 'ECB API',
      endpoint: '/api/ecb/interest-rates' 
    });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Financial Data Platform API running on port ${PORT}`);
});
