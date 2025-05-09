export const CONFIG = {
  API: {
    FRED: {
      BASE_URL: "https://api.stlouisfed.org/fred",
      TIMEOUT: 30000,
      RETRY_ATTEMPTS: 3
    },
    CENSUS: {
      BASE_URL: "https://api.census.gov/data",
      TIMEOUT: 30000
    },
    BLS: {
      BASE_URL: "https://api.bls.gov/publicAPI/v2",
      TIMEOUT: 30000
    },
    BEA: {
      BASE_URL: "https://apps.bea.gov/api/data",
      TIMEOUT: 30000
    },
    ECB: {
      BASE_URL: "https://sdw-wsrest.ecb.europa.eu/service/data",
      TIMEOUT: 30000
    }
  },
  UI: {
    THEME: {
      PRIMARY_COLOR: "#1976d2",
      SECONDARY_COLOR: "#dc004e"
    },
    CHART: {
      HEIGHT: 400,
      LINE_COLORS: ["#1976d2", "#dc004e", "#388e3c", "#f57c00"]
    }
  },
  FEATURES: {
    ENABLE_NOTIFICATIONS: true,
    ENABLE_OFFLINE_MODE: false,
    DEBUG_MODE: true
  },
  DEFAULT_SETTINGS: {
    DATE_RANGE: {
      START: "2020-01-01",
      END: "2025-01-01"
    }
  },
  API_KEYS: {
    FRED: "a8df6aeca3b71980ad53ebccecb3cb3e",
    BEA: "997E5691-4F0E-4774-8B4E-CAE836D4AC47",
    BLS: "a759447531f04f1f861f29a381aab863",
    CENSUS: "8423ffa543d0e95cdba580f2e381649b6772f515"
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
};

export default CONFIG;
