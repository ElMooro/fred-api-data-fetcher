// Add these properties to your existing CONFIG object

// Find the end of your CONFIG object (usually a line with just '};')
// and insert these properties just before that closing bracket

  DEFAULT_SETTINGS: {
    DATE_RANGE: {
      START: "2020-01-01",
      END: "2025-01-01"
    }
  },
  API_KEYS: {
    FRED: "YOUR_FRED_API_KEY", // Replace with your actual API keys if available
    BEA: "YOUR_BEA_API_KEY",
    BLS: "YOUR_BLS_API_KEY",
    CENSUS: "YOUR_CENSUS_API_KEY"
  },
  API_ENDPOINTS: {
    FRED: "https://api.stlouisfed.org/fred/series/observations",
    BEA: "https://apps.bea.gov/api/data",
    BLS: "https://api.bls.gov/publicAPI/v2/timeseries/data/",
    CENSUS: "https://api.census.gov/data",
    ECB: "https://sdw-wsrest.ecb.europa.eu/service/data",
    BIS: "https://www.bis.org/api",
    TREASURY_RATES: "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/avg_interest_rates",
    TREASURY_AUCTIONS: "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/debt/treas_sec_auction",
    TREASURY_RECORD_AUCTIONS: "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/debt/treas_sec_auction_records",
    TREASURY_DIRECT_SECURITIES: "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/debt/treas_sec_direct",
    TREASURY_BUYBACKS: "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/debt/treas_sec_buyback"
  },
  SIGNAL_METRICS: {
    TECHNICAL: [
      { id: "RSI", name: "Relative Strength Index", threshold: { buy: 30, sell: 70 } },
      { id: "MACD", name: "MACD", threshold: { buy: 0, sell: 0 } },
      { id: "SMA", name: "Simple Moving Average", threshold: { buy: 0, sell: 0 } },
      { id: "BB", name: "Bollinger Bands", threshold: { buy: -2, sell: 2 } }
    ],
    ECONOMIC: [
      { id: "GDP", name: "GDP Growth", threshold: { buy: 2, sell: 4 } },
      { id: "INFLATION", name: "Inflation Rate", threshold: { buy: 1, sell: 3 } },
      { id: "UNEMPLOYMENT", name: "Unemployment Rate", threshold: { buy: 4, sell: 6 } }
    ]
  },
  FINANCIAL_CRISES: [
    { label: "Dot-com Bubble Burst", date: "2000-03-10", description: "The collapse of the dot-com bubble" },
    { label: "Global Financial Crisis", date: "2008-09-15", description: "The collapse of Lehman Brothers" },
    { label: "COVID-19 Pandemic", date: "2020-03-20", description: "Market crash due to COVID-19 pandemic" },
    { label: "Banking Crisis", date: "2023-03-10", description: "Silicon Valley Bank collapse and subsequent banking stress" }
  ]
