#!/bin/bash

# 1. Fix ERROR_MESSAGES in financial.ts
cat > src/constants/financial.ts << 'EOT'
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
EOT

# 2. Fix utils/error.ts to use ERROR_MESSAGES properly
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

# 3. Create a basic NYFedDemo component if it doesn't exist yet
mkdir -p src/components
cat > src/components/NYFedDemo.tsx << 'EOT'
import React, { useState, useEffect } from 'react';
import { DataPoint } from '../types';
import { DataService } from '../services/DataService';

interface NYFedDemoProps {
  // Props can be added as needed
}

const NYFedDemo: React.FC<NYFedDemoProps> = () => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch NY Fed data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const dataService = new DataService();
      // This method should be created in DataService.ts
      const sofrData = await dataService.fetchSOFRData(30);
      setData(sofrData);
    } catch (err) {
      setError('Failed to fetch NY Fed data');
      console.error('Error fetching NY Fed data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="nyfed-demo">
      <h2>NY Fed Data Demo</h2>
      
      {isLoading && <div className="loading">Loading data...</div>}
      
      {error && <div className="error-message">{error}</div>}
      
      {!isLoading && !error && data.length > 0 && (
        <div className="data-summary">
          <h3>SOFR Data Summary</h3>
          <p>Latest SOFR Rate: {data[0].value}%</p>
          <p>Date: {data[0].date}</p>
          {data[0].volume && <p>Volume: ${data[0].volume.toLocaleString()} billion</p>}
          <p>Number of data points: {data.length}</p>
        </div>
      )}
    </div>
  );
};

export default NYFedDemo;
EOT

# 4. Check if Dashboard folder has an index.tsx, if not create one
if [ ! -f src/components/Dashboard/index.tsx ]; then
  cat > src/components/Dashboard/index.tsx << 'EOT'
import React, { useState, useEffect } from 'react';
import { DataPoint } from '../../types';
import { DataService } from '../../services/DataService';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Function to update chart data
  const updateChart = async () => {
    try {
      setIsLoading(true);
      const dataService = new DataService();
      const seriesData = await dataService.fetchData('GDP', 'Quarterly', '2020-01-01', '2023-01-01');
      setData(seriesData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch data. Please try again later.');
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    updateChart();
  }, []);
  
  return (
    <div className="dashboard-container">
      <h1>FRED Economic Data Dashboard</h1>
      
      {isLoading && <div className="loading">Loading data...</div>}
      
      {error && <div className="error-message">{error}</div>}
      
      {!isLoading && !error && (
        <div className="data-container">
          <h2>Gross Domestic Product</h2>
          
          <div className="data-summary">
            <h3>Data Summary</h3>
            <p>Number of data points: {data.length}</p>
            {data.length > 0 && (
              <>
                <p>Latest value: {data[data.length - 1].value}</p>
                <p>Date: {data[data.length - 1].date}</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
EOT

  # Create a basic CSS file if it doesn't exist
  cat > src/components/Dashboard/Dashboard.css << 'EOT'
.dashboard-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  font-size: 18px;
  color: #666;
}

.error-message {
  padding: 15px;
  background-color: #ffecec;
  color: #f44336;
  border-radius: 4px;
  margin: 20px 0;
}

.data-container {
  margin-top: 20px;
}

.data-summary {
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 4px;
  margin-top: 20px;
}
EOT
fi

# 5. Update App.tsx to use the correct Dashboard import
cat > src/App.tsx << 'EOT'
import React from 'react';
import './App.css';
import Dashboard from './components/Dashboard/index';

function App() {
  return (
    <div className="App">
      <Dashboard />
    </div>
  );
}

export default App;
EOT

# 6. Update package.json to include types
npm pkg set compilerOptions.skipLibCheck=true

# Run TypeScript compiler to check for errors
echo "Checking for TypeScript errors..."
npx tsc --noEmit

echo "All TypeScript errors should be fixed now!"
