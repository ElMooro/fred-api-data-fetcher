export const NY_FED_CONFIG = {
  BASE_URL: 'https://markets.newyorkfed.org/api',
  RATE_TYPES: {
    SOFR: 'sofr',
    EFFR: 'effr',
    OBFR: 'obfr',
    TGCR: 'tgcr',
    BGCR: 'bgcr',
  },
  TREASURY_TENORS: {
    '1M': '1m',
    '3M': '3m', 
    '6M': '6m',
    '1Y': '1y',
    '2Y': '2y',
    '3Y': '3y',
    '5Y': '5y',
    '7Y': '7y',
    '10Y': '10y',
    '20Y': '20y',
    '30Y': '30y'
  }
};

export const NYFED_DATA_SOURCE = {
  id: 'nyfed',
  name: 'Federal Reserve Bank of New York',
  indicators: [
    {
      id: 'sofr',
      name: 'Secured Overnight Financing Rate (SOFR)',
      seriesId: 'SOFR',
      category: 'Interest Rates',
      frequency: 'daily',
      unit: 'Percent',
      description: 'Benchmark interest rate for dollar-denominated derivatives and loans'
    },
    {
      id: 'effr',
      name: 'Effective Federal Funds Rate (EFFR)',
      seriesId: 'EFFR',
      category: 'Interest Rates',
      frequency: 'daily',
      unit: 'Percent',
      description: 'Interest rate at which banks lend reserves to each other overnight'
    },
    {
      id: 'treasury_1m',
      name: 'Treasury Yield - 1 Month',
      seriesId: '1m',
      category: 'Treasury Yields',
      frequency: 'daily',
      unit: 'Percent',
      description: '1-month U.S. Treasury yield'
    },
    {
      id: 'treasury_3m',
      name: 'Treasury Yield - 3 Month',
      seriesId: '3m',
      category: 'Treasury Yields',
      frequency: 'daily',
      unit: 'Percent',
      description: '3-month U.S. Treasury yield'
    },
    {
      id: 'treasury_6m',
      name: 'Treasury Yield - 6 Month',
      seriesId: '6m',
      category: 'Treasury Yields',
      frequency: 'daily',
      unit: 'Percent',
      description: '6-month U.S. Treasury yield'
    },
    {
      id: 'treasury_2y',
      name: 'Treasury Yield - 2 Year',
      seriesId: '2y',
      category: 'Treasury Yields',
      frequency: 'daily',
      unit: 'Percent',
      description: '2-year U.S. Treasury yield'
    },
    {
      id: 'treasury_5y',
      name: 'Treasury Yield - 5 Year',
      seriesId: '5y',
      category: 'Treasury Yields',
      frequency: 'daily',
      unit: 'Percent',
      description: '5-year U.S. Treasury yield'
    },
    {
      id: 'treasury_10y',
      name: 'Treasury Yield - 10 Year',
      seriesId: '10y',
      category: 'Treasury Yields',
      frequency: 'daily',
      unit: 'Percent',
      description: '10-year U.S. Treasury yield (benchmark)'
    },
    {
      id: 'treasury_30y',
      name: 'Treasury Yield - 30 Year',
      seriesId: '30y',
      category: 'Treasury Yields',
      frequency: 'daily',
      unit: 'Percent',
      description: '30-year U.S. Treasury yield'
    }
  ]
};
