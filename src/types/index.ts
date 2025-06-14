/**
 * Core data types for the application
 */

// Add export statement to make this a proper module
export {};

export interface DataPoint {
  date: string;
  value: number;
  rawValue?: any;
  metadata?: {
    type?: string;
    period?: string;
    calculationType?: string;
    [key: string]: any;
  };
  volume?: number;
}

export interface Statistics {
  min: number;
  max: number;
  average: number;
  median: number;
  stdDev: number;
  count: number;
  error?: string;
}

export interface FredApiOptions {
  series_id: string;
  observation_start?: string;
  observation_end?: string;
  units?: string;
  frequency?: string;
  aggregation_method?: string;
  output_type?: number;
  vintage_dates?: string;
}

export interface WatchlistItem {
  id: string;
  name: string;
  source: string;
  series_id: string;
}

export interface IndicatorMetadata {
  id: string;
  name: string;
  description?: string;
  source: string;
  frequency?: string;
  units?: string;
}

export interface LiveDataPoint {
  value: number;
  timestamp: string;
  change?: number;
  percentChange?: number;
}

// Fixed LiveData interface to correctly handle lastUpdated
export interface LiveData {
  [key: string]: LiveDataPoint | string | undefined;
  lastUpdated?: string;
}

export enum ConnectionStatus {
  CONNECTED = "CONNECTED",
  CONNECTING = "CONNECTING",
  DISCONNECTED = "DISCONNECTED",
  ERROR = "ERROR",
  RECONNECT_FAILED = "RECONNECT_FAILED"
}

export type ErrorType = 'Network' | 'Api' | 'Authorization' | 'NotFound' | 'Timeout' | 'Unknown';

export interface NYFedTreasuryYield {
  date: string;
  value: number;
  maturity: string;
}
