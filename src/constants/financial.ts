import { IndicatorMetadata, WatchlistItem, DataPoint, FinancialCrisis, Transformation, TimeFrame, Indicator, Statistics, LiveDataPoint, LiveData, ConnectionStatus, ErrorType } from '../types';

// Application version
export const APP_VERSION = '2.0.0';

// Constants and configuration encapsulated in separate namespace objects
export const CONFIG = {
  DATES: {
    DEFAULT_START_DATE: '2000-01-01',
    DEFAULT_END_DATE: '2025-04-30',
    DATE_FORMAT: 'YYYY-MM-DD'
  },
  RETRY: {
    MAX_ATTEMPTS: 3,
    BACKOFF_FACTOR: 1.5,
    INITIAL_DELAY: 1000, // ms
  },
  UI: {
    LOADING_TIMEOUT: 500, // ms
    DEBOUNCE_DELAY: 300, // ms
    CHART_HEIGHT: 96, // percentage
  },
  API: {
    DEFAULT_TIMEOUT: 5000 // ms
  }
};

// Financial Crisis Events
export const FINANCIAL_CRISES: FinancialCrisis[] = [
  { 
    name: "Black Monday", 
    date: "1987-10-19", 
    description: "Stock market crash where Dow Jones fell by 22.6%",
    severity: "high" 
  },
  { 
    name: "Dot-com Bubble", 
    startDate: "2000-03-10", 
    endDate: "2002-10-09", 
    description: "Tech stock bubble burst",
    severity: "high" 
  },
  { 
    name: "Global Financial Crisis", 
    startDate: "2007-12-01", 
    endDate: "2009-06-01", 
    description: "Subprime mortgage crisis",
    severity: "extreme" 
  },
  { 
    name: "Flash Crash", 
    date: "2010-05-06", 
    description: "Brief stock market crash with trillion-dollar losses",
    severity: "medium" 
  },
  { 
    name: "European Debt Crisis", 
    startDate: "2010-04-01", 
    endDate: "2012-07-26", 
    description: "Sovereign debt crisis in Europe",
    severity: "high" 
  },
  { 
    name: "COVID-19 Crash", 
    date: "2020-03-16", 
    description: "Pandemic-induced market crash",
    severity: "high" 
  }
];

// Data sources structured with proper TypeScript-style documentation
export const DATA_SOURCES: Record<string, Indicator[]> = {
  FRED: [
    { 
      id: "GDP", 
      name: "Gross Domestic Product", 
      frequency: "quarterly",
      unit: "Billions of USD",
      description: "Total value of goods and services produced",
      baseValue: 15000,
      volatility: 0.01,
      trend: 0.005
    },
    { 
      id: "UNRATE", 
      name: "Unemployment Rate", 
      frequency: "monthly",
      unit: "Percent",
      description: "Percentage of labor force unemployed",
      baseValue: 5,
      volatility: 0.03,
      trend: 0
    },
    { 
      id: "FEDFUNDS", 
      name: "Federal Funds Rate", 
      frequency: "monthly",
      unit: "Percent",
      description: "Interest rate at which banks lend to each other overnight",
      baseValue: 2.5,
      volatility: 0.02,
      trend: 0
    }
  ],
  ECB: [
    { 
      id: "EXR.D.USD.EUR.SP00.A", 
      name: "USD/EUR Exchange Rate", 
      frequency: "daily",
      unit: "USD per EUR",
      description: "Exchange rate between USD and EUR",
      baseValue: 1.1,
      volatility: 0.005,
      trend: 0
    },
    { 
      id: "MFI.M.U2.Y.V.M30.X.I.U2.2300.Z01.A", 
      name: "Eurozone M3 Money Supply", 
      frequency: "monthly",
      unit: "Percent Change",
      description: "Broad money supply growth in Eurozone",
      baseValue: 4.5,
      volatility: 0.02,
      trend: 0.001
    }
  ],
  NYFED: [
    { 
      id: "SOFR", 
      name: "Secured Overnight Financing Rate", 
      frequency: "daily",
      unit: "Percent",
      description: "Benchmark interest rate for dollar-denominated derivatives and loans",
      baseValue: 2.2,
      volatility: 0.01,
      trend: 0
    }
  ],
  OFR: [
    { 
      id: "FSI", 
      name: "Financial Stress Index", 
      frequency: "daily",
      unit: "Index",
      description: "Measure of systemic financial stress",
      baseValue: 0,
      volatility: 0.08,
      trend: 0
    }
  ]
};

// Transformations
export const TRANSFORMATIONS: Transformation[] = [
  { 
    id: "raw", 
    name: "Raw Data (No Transformation)", 
    description: "Original data without any mathematical transformation",
    requiresHistory: false 
  },
  { 
    id: "mom", 
    name: "Month-over-Month Change", 
    description: "Absolute change from previous month",
    requiresHistory: true,
    historyPeriod: "month"
  },
  { 
    id: "mom_pct", 
    name: "Month-over-Month % Change", 
    description: "Percentage change from previous month",
    requiresHistory: true,
    historyPeriod: "month",
    resultUnit: "percent"
  },
  { 
    id: "qoq", 
    name: "Quarter-over-Quarter Change", 
    description: "Absolute change from previous quarter",
    requiresHistory: true,
    historyPeriod: "quarter"
  },
  { 
    id: "qoq_pct", 
    name: "Quarter-over-Quarter % Change", 
    description: "Percentage change from previous quarter",
    requiresHistory: true,
    historyPeriod: "quarter",
    resultUnit: "percent"
  },
  { 
    id: "yoy", 
    name: "Year-over-Year % Change", 
    description: "Percentage change from same period previous year",
    requiresHistory: true,
    historyPeriod: "year",
    resultUnit: "percent"
  }
];

// Time frames
export const TIME_FRAMES: TimeFrame[] = [
  { id: "daily", name: "Daily", days: 1 },
  { id: "weekly", name: "Weekly", days: 7 },
  { id: "monthly", name: "Monthly", days: 30 },
  { id: "quarterly", name: "Quarterly", days: 90 },
  { id: "semiannual", name: "Half-Yearly", days: 180 },
  { id: "annual", name: "Yearly", days: 365 }
];

// Error types - Enables easier error handling and localization
export const ERROR_TYPES: Record<ErrorType, ErrorType> = {
  INVALID_DATE_RANGE: 'INVALID_DATE_RANGE',
  INVALID_DATE_FORMAT: 'INVALID_DATE_FORMAT',
  NO_DATA_RETURNED: 'NO_DATA_RETURNED',
  DUPLICATE_WATCHLIST: 'DUPLICATE_WATCHLIST',
  TRANSFORMATION_ERROR: 'TRANSFORMATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',
  GENERAL_ERROR: 'GENERAL_ERROR',
  DATA_SOURCE_ERROR: 'DATA_SOURCE_ERROR',
  FETCH_ERROR: 'FETCH_ERROR',
  PARSE_ERROR: 'PARSE_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

// Error messages - Centralized for easier localization
export const ERROR_MESSAGES: Record<ErrorType, string> = {
  INVALID_DATE_RANGE: "Invalid date range. Please ensure start date is before end date.",
  INVALID_DATE_FORMAT: "Invalid date format. Please use YYYY-MM-DD format.",
  NO_DATA_RETURNED: "No data available for the selected parameters.",
  DUPLICATE_WATCHLIST: "This item already exists in your watchlist.",
  TRANSFORMATION_ERROR: "An error occurred while transforming data.",
  NETWORK_ERROR: "A network error occurred. Please check your connection and try again.",
  API_ERROR: "An error occurred while fetching data from the API.",
  GENERAL_ERROR: "An unexpected error occurred. Please try again later.",
  DATA_SOURCE_ERROR: "An error occurred with the data source.",
  // Added missing properties:
  FETCH_ERROR: "Failed to fetch data. Please check your network or try again later.",
  PARSE_ERROR: "Failed to parse data. The received data might be corrupted or in an unexpected format.",
  UNKNOWN_ERROR: "An unknown error occurred. Please contact support if the issue persists."
};
