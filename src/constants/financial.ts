import {
  ConnectionStatus,
  ErrorType
} from '../types';

// Application version
export const APP_VERSION = '2.0.0';

// API endpoints
export const API_ENDPOINTS = {
  FRED: 'https://api.stlouisfed.org/fred',
  BEA: 'https://apps.bea.gov/api/data',
  CENSUS: 'https://api.census.gov/data',
  BLS: 'https://api.bls.gov/publicAPI/v2',
  ECB: 'https://data-api.ecb.europa.eu/service/data'
};

// Data sources
export const DATA_SOURCES = {
  FRED: 'FRED',
  BEA: 'BEA',
  CENSUS: 'Census',
  BLS: 'BLS',
  ECB: 'ECB',
  NYFED: 'NYFED'
};

// Default timeframes
export const DEFAULT_TIMEFRAMES = {
  ONE_MONTH: '1M',
  THREE_MONTHS: '3M',
  SIX_MONTHS: '6M',
  ONE_YEAR: '1Y',
  FIVE_YEARS: '5Y',
  MAX: 'MAX'
};
