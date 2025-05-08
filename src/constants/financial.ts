import { 
  IndicatorMetadata, 
  WatchlistItem, 
  DataPoint, 
  FinancialCrisis, 
  Transformation, 
  TimeFrame, 
  Indicator, 
  Statistics, 
  LiveDataPoint, 
  LiveData, 
  ConnectionStatus, 
  ErrorType 
} from '../types';

// Application version
export const APP_VERSION = '2.0.0';

// Error messages
export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your connection and try again.',
  API: 'API error. The service is currently unavailable.',
  AUTHORIZATION: 'Authorization error. Please check your API key.',
  NOT_FOUND: 'Resource not found.',
  TIMEOUT: 'Request timed out. Please try again later.',
  UNKNOWN: 'An unknown error occurred. Please try again later.'
};

// Data source configuration
export const DATA_SOURCES = {
  FRED: 'FRED',
  WEBSOCKET: 'WEBSOCKET'
};

// Default transformations
export const TRANSFORMATIONS: Transformation[] = [
  {
    id: 'raw',
    name: 'Raw Values',
    description: 'Original data without any transformations'
  },
  {
    id: 'mom_pct',
    name: 'Month-over-Month %',
    description: 'Percentage change from previous month'
  }
];

// Common time frames
export const TIME_FRAMES: TimeFrame[] = [
  {
    id: '1y',
    name: '1 Year',
    startDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  },
  {
    id: '5y',
    name: '5 Years',
    startDate: new Date(new Date().setFullYear(new Date().getFullYear() - 5)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  },
  {
    id: '10y',
    name: '10 Years',
    startDate: new Date(new Date().setFullYear(new Date().getFullYear() - 10)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  }
];

// Important economic indicators
export const POPULAR_INDICATORS: IndicatorMetadata[] = [
  {
    id: 'gdp',
    title: 'Gross Domestic Product',
    notes: 'Quarterly measure of US economic output',
    frequency: 'Quarterly',
    units: 'Billions of Dollars',
    source: 'Bureau of Economic Analysis',
    lastUpdated: '2023-06-29'
  },
  {
    id: 'unrate',
    title: 'Unemployment Rate',
    notes: 'Percentage of labor force that is unemployed',
    frequency: 'Monthly',
    units: 'Percent',
    source: 'Bureau of Labor Statistics',
    lastUpdated: '2023-07-07'
  },
  {
    id: 'cpiaucsl',
    title: 'Consumer Price Index',
    notes: 'Measure of the average change in prices paid by urban consumers',
    frequency: 'Monthly',
    units: 'Index 1982-1984=100',
    source: 'Bureau of Labor Statistics',
    lastUpdated: '2023-07-12'
  }
];
