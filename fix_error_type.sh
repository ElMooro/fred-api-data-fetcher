#!/bin/bash

# 1. First, update the ErrorType in types/index.ts to match the capitalization used
cat > src/types/index.ts << 'EOT'
// Data types for FRED API
export interface DataPoint {
  date: string;
  value: number;
  rawValue?: number;
  volume?: number;
  percentiles?: {
    p1?: number;
    p25?: number;
    p75?: number;
    p99?: number;
  };
}

export interface Statistics {
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
  count: number;
  error?: string;
}

export interface Transformation {
  id: string;
  name: string;
  description: string;
}

export interface TimeFrame {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface Indicator {
  id: string;
  name: string;
  frequency: string;
  units: string;
  description: string;
  source: string;
  fredId?: string;
}

export interface IndicatorMetadata {
  id: string;
  title: string;
  notes?: string;
  frequency: string;
  units?: string;
  unit?: string;
  source?: string;
  description?: string;
  name?: string;
  lastUpdated?: string;
}

export interface WatchlistItem {
  id: string;
  name: string;
  seriesId?: string;
  source?: string;
  indicator?: string;
  transformation?: string;
  transformationName?: string;
  startDate?: string;
  endDate?: string;
  frequency: string;
  category?: string;
  color?: string;
  dateAdded?: string;
  metadata?: {
    unit?: string;
    description?: string;
  };
}

export interface FinancialCrisis {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  description: string;
}

// Live data types
export interface LiveDataPoint {
  value: string;
  change: string;
}

// Fixed the LiveData interface to handle mixed property types
export interface LiveData {
  [key: string]: LiveDataPoint | string | undefined;
  UNRATE?: LiveDataPoint;
  GDP?: LiveDataPoint;
  FEDFUNDS?: LiveDataPoint;
  lastUpdated?: string;
}

export type ConnectionStatus = "Connected" | "Connecting..." | "Disconnected" | "Connection Error" | "Reconnect Failed" | "Reconnecting";

// Fixed ErrorType to use uppercase strings to match the constants
export type ErrorType = "NETWORK" | "API" | "AUTHORIZATION" | "NOT_FOUND" | "TIMEOUT" | "UNKNOWN";

// FRED API specific types
export interface FredApiOptions {
  realtime_start?: string;
  realtime_end?: string;
  limit?: number;
  offset?: number;
  sort_order?: "asc" | "desc";
  observation_start?: string;
  observation_end?: string;
  units?: string;
  frequency?: string;
  aggregation_method?: string;
  output_type?: number;
  vintage_dates?: string;
  file_type?: 'json' | 'xml';
  category_id?: number;
  series_id?: string;
}

export interface FredSeries {
  id: string;
  realtime_start: string;
  realtime_end: string;
  title: string;
  observation_start: string;
  observation_end: string;
  frequency: string;
  frequency_short: string;
  units: string;
  units_short: string;
  seasonal_adjustment: string;
  seasonal_adjustment_short: string;
  last_updated: string;
  popularity: number;
  notes: string;
}

export interface FredObservation {
  realtime_start: string;
  realtime_end: string;
  date: string;
  value: string;
}

export interface FredApiResponse {
  realtime_start?: string;
  realtime_end?: string;
  seriess?: FredSeries[];
  observations?: FredObservation[];
  count?: number;
  limit?: number;
  offset?: number;
  order_by?: string;
  sort_order?: string;
  start_index?: number;
  end_index?: number;
}

// NY Fed Treasury Yield interface
export interface NYFedTreasuryYield {
  effectiveDate: string;
  t1Month?: number;
  t3Month?: number;
  t6Month?: number;
  t1Year?: number;
  t2Year?: number;
  t3Year?: number;
  t5Year?: number;
  t7Year?: number;
  t10Year?: number;
  t20Year?: number;
  t30Year?: number;
  [key: string]: string | number | undefined;
}
EOT

# 2. Now fix the error.ts file
cat > src/utils/error.ts << 'EOT'
import { ERROR_MESSAGES } from '../constants/financial';
import { ErrorType } from '../types';

/**
 * Custom error class with type for better error handling
 */
export class AppError extends Error {
  type: ErrorType;
  details?: any;
  
  constructor(message: string, type: ErrorType = 'UNKNOWN', details?: any) {
    super(message);
    this.type = type;
    this.details = details;
    this.name = 'AppError';
    
    // Ensure the stack trace is preserved
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
  
  /**
   * Helper method to get a standardized error message based on error type
   */
  static getErrorMessage(type: ErrorType): string {
    return ERROR_MESSAGES[type] || ERROR_MESSAGES.UNKNOWN;
  }
  
  /**
   * Convert API errors to AppError instances
   */
  static fromApiError(error: any): AppError {
    if (error.response) {
      // The request was made and the server responded with an error status
      const status = error.response.status;
      
      if (status === 401 || status === 403) {
        return new AppError(ERROR_MESSAGES.AUTHORIZATION, 'AUTHORIZATION', error.response.data);
      } else if (status === 404) {
        return new AppError(ERROR_MESSAGES.NOT_FOUND, 'NOT_FOUND', error.response.data);
      } else {
        return new AppError(ERROR_MESSAGES.API, 'API', {
          status,
          data: error.response.data
        });
      }
    } else if (error.request) {
      // The request was made but no response was received
      if (error.code === 'ECONNABORTED') {
        return new AppError(ERROR_MESSAGES.TIMEOUT, 'TIMEOUT', error.request);
      }
      return new AppError(ERROR_MESSAGES.NETWORK, 'NETWORK', error.request);
    }
    
    // Something happened in setting up the request
    return new AppError(ERROR_MESSAGES.UNKNOWN, 'UNKNOWN', error);
  }
}

export default AppError;
EOT

# Run TypeScript compiler to check for errors
echo "Checking for TypeScript errors..."
npx tsc --noEmit

echo "ErrorType issues should be fixed now!"
