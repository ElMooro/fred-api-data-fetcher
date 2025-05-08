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
