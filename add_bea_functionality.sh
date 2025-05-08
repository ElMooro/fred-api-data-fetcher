#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Adding BEA API functionality to your project...${NC}"

# 1. Create BEA Service
mkdir -p src/services
cat > src/services/BEAService.ts << 'EOT'
import axios from 'axios';
import { DataPoint } from '../types';
import { AppError } from '../utils/error';

export class BEAService {
  private apiKey: string;
  
  constructor(apiKey = process.env.REACT_APP_BEA_API_KEY || '') {
    this.apiKey = apiKey;
  }
  
  /**
   * Fetch GDP data from BEA API
   * @param year Year to fetch data for (YYYY or 'LAST5' etc.)
   * @param frequency Data frequency (A for annual, Q for quarterly)
   * @returns Array of DataPoints containing GDP values
   */
  async fetchGDP(year: string = 'LAST5', frequency: string = 'Q'): Promise<DataPoint[]> {
    try {
      // Validate frequency
      if (!['A', 'Q'].includes(frequency)) {
        throw new AppError('Invalid frequency. Use "A" for annual or "Q" for quarterly.', 'API');
      }
      
      const params: any = {
        UserID: this.apiKey,
        method: 'GetData',
        DataSetName: 'NIPA',
        TableName: 'T10101', // GDP table
        Frequency: frequency,
        Year: year,
        ResultFormat: 'JSON'
      };
      
      // Add Quarter parameter if frequency is quarterly and year is specific
      if (frequency === 'Q' && !year.startsWith('LAST')) {
        params.Quarter = 'All';
      }
      
      const response = await axios.get('https://apps.bea.gov/api/data', { params });
      
      if (response.data && response.data.BEAAPI && response.data.BEAAPI.Results && response.data.BEAAPI.Results.Data) {
        // Filter for GDP data (Line Number 1)
        const gdpData = response.data.BEAAPI.Results.Data
          .filter((item: any) => item.LineNumber === '1')
          .map((item: any) => {
            // Parse the time period into a proper date
            const date = this.parseTimePeriod(item.TimePeriod);
            
            return {
              date,
              value: parseFloat(item.DataValue),
              rawValue: parseFloat(item.DataValue),
              metadata: {
                unit: item.CL_UNIT,
                description: item.LineDescription,
                timePeriod: item.TimePeriod
              }
            };
          });
        
        // Sort by date (oldest first)
        return gdpData.sort((a: DataPoint, b: DataPoint) => new Date(a.date).getTime() - new Date(b.date).getTime());
      }
      
      throw new AppError('No data returned from BEA API', 'API');
    } catch (error) {
      console.error('Error fetching GDP data from BEA:', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw AppError.fromApiError(error);
    }
  }
  
  /**
   * Fetch state GDP data from BEA Regional dataset
   * @param year Year to fetch data for
   * @param states Array of state FIPS codes or 'STATE' for all states
   * @returns Array of State GDP DataPoints
   */
  async fetchStateGDP(year: string = 'LAST', states: string = 'STATE'): Promise<any[]> {
    try {
      const params = {
        UserID: this.apiKey,
        method: 'GetData',
        DataSetName: 'Regional',
        TableName: 'SAGDP2N',
        GeoFips: states,
        Year: year,
        ResultFormat: 'JSON'
      };
      
      const response = await axios.get('https://apps.bea.gov/api/data', { params });
      
      if (response.data && response.data.BEAAPI && response.data.BEAAPI.Results && response.data.BEAAPI.Results.Data) {
        return response.data.BEAAPI.Results.Data.map((item: any) => ({
          state: item.GeoName,
          fips: item.GeoFips,
          year: item.TimePeriod,
          value: parseFloat(item.DataValue || '0'),
          metric: item.LineDescription,
          unit: item.CL_UNIT || 'Millions of current dollars'
        }));
      }
      
      throw new AppError('No state GDP data returned from BEA API', 'API');
    } catch (error) {
      console.error('Error fetching state GDP data from BEA:', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw AppError.fromApiError(error);
    }
  }
  
  /**
   * Get a list of available datasets in the BEA API
   * @returns Array of available datasets
   */
  async getAvailableDatasets(): Promise<any[]> {
    try {
      const params = {
        UserID: this.apiKey,
        method: 'GetAPIDatasetList',
        ResultFormat: 'JSON'
      };
      
      const response = await axios.get('https://apps.bea.gov/api/data', { params });
      
      if (response.data && response.data.BEAAPI && response.data.BEAAPI.Results && response.data.BEAAPI.Results.APIDatasetList) {
        return response.data.BEAAPI.Results.APIDatasetList.Dataset;
      }
      
      throw new AppError('No datasets returned from BEA API', 'API');
    } catch (error) {
      console.error('Error fetching BEA datasets:', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw AppError.fromApiError(error);
    }
  }
  
  /**
   * Helper method to parse time period strings into proper dates
   * @param timePeriod Time period string from BEA API (e.g. "2023Q1", "2022A")
   * @returns ISO date string
   */
  private parseTimePeriod(timePeriod: string): string {
    try {
      // For annual data (e.g. "2022A")
      if (timePeriod.endsWith('A')) {
        const year = timePeriod.replace('A', '');
        return `${year}-12-31`;
      }
      
      // For quarterly data (e.g. "2023Q1")
      if (timePeriod.includes('Q')) {
        const [year, quarterStr] = timePeriod.split('Q');
        const quarter = parseInt(quarterStr);
        
        // Map quarter to month-end
        const monthMap: {[key: number]: string} = {
          1: '03-31',
          2: '06-30',
          3: '09-30',
          4: '12-31'
        };
        
        return `${year}-${monthMap[quarter] || '12-31'}`;
      }
      
      // If unknown format, return as-is
      return timePeriod;
    } catch (error) {
      console.error('Error parsing time period:', error);
      return timePeriod;
    }
  }
}

export default BEAService;
EOT

# 2. Create BEA Panel Component
mkdir -p src/components/Dashboard
cat > src/components/Dashboard/BEAPanel.tsx << 'EOT'
import React, { useState, useEffect } from 'react';
import { DataPoint } from '../../types';
import { BEAService } from '../../services/BEAService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './BEAPanel.css';

interface BEAPanelProps {
  years?: number;
}

const BEAPanel: React.FC<BEAPanelProps> = ({ years = 5 }) => {
  const [gdpData, setGDPData] = useState<DataPoint[]>([]);
  const [gdpGrowthData, setGDPGrowthData] = useState<DataPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch GDP data
  const fetchGDPData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const beaService = new BEAService();
      
      // Fetch last 5 years of quarterly GDP data
      const data = await beaService.fetchGDP('LAST5', 'Q');
      
      // Calculate quarter-over-quarter growth rates
      const growthData = calculateGrowthRates(data);
      
      setGDPData(data);
      setGDPGrowthData(growthData);
    } catch (error) {
      console.error("Error fetching BEA GDP data:", error);
      setError("Failed to load GDP data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate quarter-over-quarter growth rates
  const calculateGrowthRates = (data: DataPoint[]): DataPoint[] => {
    return data.map((item, index) => {
      if (index === 0) {
        return {
          ...item,
          value: 0 // First item has no previous to compare
        };
      }
      
      const prevValue = data[index - 1].value;
      const growthRate = prevValue ? ((item.value - prevValue) / prevValue) * 100 : 0;
      
      return {
        ...item,
        value: parseFloat(growthRate.toFixed(1)),
        rawValue: item.rawValue // Keep original GDP value
      };
    });
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchGDPData();
  }, [years]);

  // Format GDP value for display
  const formatGDPValue = (value: number): string => {
    // If the value is a growth rate percentage
    if (value < 100) {
      return `${value.toFixed(1)}%`;
    }
    
    // For large GDP values
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)} trillion`;
    }
    return `$${value.toFixed(1)} billion`;
  };

  // Get latest GDP and growth rate
  const getLatestData = () => {
    if (gdpData.length === 0) return { gdp: 0, growth: 0, period: '' };
    
    const latestGDP = gdpData[gdpData.length - 1];
    const latestGrowth = gdpGrowthData[gdpGrowthData.length - 1];
    
    return {
      gdp: latestGDP.value,
      growth: latestGrowth.value,
      period: latestGDP.date
    };
  };

  const { gdp, growth, period } = getLatestData();
  
  // Format quarter and year from date
  const formatQuarter = (dateStr: string): string => {
    const date = new Date(dateStr);
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    return `Q${quarter} ${date.getFullYear()}`;
  };

  return (
    <div className="bea-panel">
      <h2>U.S. Economic Growth (Bureau of Economic Analysis)</h2>
      
      {isLoading && (
        <div className="loading">Loading GDP data...</div>
      )}
      
      {error && (
        <div className="error-message">{error}</div>
      )}
      
      {!isLoading && !error && gdpData.length > 0 && (
        <>
          <div className="bea-highlights">
            <div className="highlight-card">
              <h3>Current U.S. GDP</h3>
              <p className="gdp-value">{gdp.toFixed(1)}% Change</p>
              <p className="date">Annual Rate as of {formatQuarter(period)}</p>
            </div>
            
            <div className="highlight-card">
              <h3>Latest Growth</h3>
              <p className={`growth-value ${growth >= 0 ? 'positive' : 'negative'}`}>
                {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
              </p>
              <p className="date">Quarter-over-Quarter</p>
            </div>
          </div>
          
          <div className="gdp-chart">
            <h3>U.S. GDP Growth (Annual Rate, Last {gdpData.length} Quarters)</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={gdpData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(date) => formatQuarter(date)}
                  />
                  <YAxis 
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    formatter={(value: any) => [`${value}%`, 'GDP Growth']}
                    labelFormatter={(date) => formatQuarter(date)}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    name="GDP Growth Rate" 
                    stroke="#2E86C1" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bea-info">
            <h3>About GDP Data</h3>
            <p>
              The Gross Domestic Product (GDP) data shown here represents the percent change from preceding period, 
              at annual rates. It is adjusted for inflation and seasonality to provide the most accurate representation 
              of economic growth.
            </p>
            <p>
              <a href="https://www.bea.gov/data/gdp/gross-domestic-product" target="_blank" rel="noopener noreferrer">
                Learn more about GDP from the Bureau of Economic Analysis
              </a>
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default BEAPanel;
EOT

# 3. Create CSS for BEA Panel
cat > src/components/Dashboard/BEAPanel.css << 'EOT'
.bea-panel {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 24px;
}

.bea-panel h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
  font-size: 1.5rem;
}

.bea-panel h3 {
  margin-top: 0;
  margin-bottom: 8px;
  color: #555;
  font-size: 1.1rem;
}

.bea-highlights {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.highlight-card {
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 16px;
  text-align: center;
}

.gdp-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #2E86C1;
  margin: 8px 0;
}

.growth-value {
  font-size: 1.8rem;
  font-weight: bold;
  margin: 8px 0;
}

.growth-value.positive {
  color: #27AE60;
}

.growth-value.negative {
  color: #E74C3C;
}

.date {
  font-size: 0.85rem;
  color: #777;
}

.gdp-chart {
  margin-bottom: 24px;
}

.bea-info {
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 16px;
  margin-top: 16px;
}

.bea-info p {
  margin-top: 8px;
  color: #555;
  line-height: 1.5;
}

.bea-info a {
  color: #2E86C1;
  text-decoration: none;
}

.bea-info a:hover {
  text-decoration: underline;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #666;
}

.error-message {
  background-color: #ffebee;
  color: #d32f2f;
  padding: 12px;
  border-radius: 4px;
  margin: 16px 0;
}
EOT

# 4. Update Dashboard component to include BEA Panel
cat > src/components/Dashboard/index.tsx << 'EOT'
import React, { useState, useEffect } from 'react';
import { DataPoint } from '../../types';
import { DataService } from '../../services/DataService';
import SOFRPanel from './SOFRPanel';
import BEAPanel from './BEAPanel';
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
      <h1>Economic Data Dashboard</h1>
      
      {/* Add the BEA Panel */}
      <BEAPanel years={5} />
      
      {/* Add the SOFR Panel */}
      <SOFRPanel days={30} />
      
      {isLoading && <div className="loading">Loading data...</div>}
      
      {error && <div className="error-message">{error}</div>}
      
      {!isLoading && !error && (
        <div className="data-container">
          <h2>Additional Economic Indicators</h2>
          
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

# 5. Update the .env file to include your BEA API key
if grep -q "BEA_API_KEY" .env; then
    # Update existing key
    sed -i "s/BEA_API_KEY=.*/REACT_APP_BEA_API_KEY=997E5691-4F0E-4774-8B4E-CAE836D4AC47/" .env
    echo -e "${GREEN}Updated BEA API key in .env file${NC}"
else
    # Add new key
    echo "REACT_APP_BEA_API_KEY=997E5691-4F0E-4774-8B4E-CAE836D4AC47" >> .env
    echo -e "${GREEN}Added BEA API key to .env file${NC}"
fi

echo -e "\n${GREEN}BEA API functionality has been added to your project!${NC}"
echo -e "${YELLOW}The Dashboard now includes:${NC}"
echo -e "  1. A BEA panel showing GDP growth data"
echo -e "  2. The SOFR panel you added earlier"
echo -e "\n${YELLOW}Run 'npm start' to see the changes.${NC}"

