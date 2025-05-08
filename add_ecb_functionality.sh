#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Adding ECB (European Central Bank) API functionality to your project...${NC}"

# 1. Create ECB Service
mkdir -p src/services
cat > src/services/ECBService.ts << 'EOT'
import axios from 'axios';
import { DataPoint } from '../types';
import { AppError } from '../utils/error';

/**
 * Service for accessing European Central Bank (ECB) Statistical Data Warehouse API
 */
export class ECBService {
  private baseUrl: string = 'https://sdw-wsrest.ecb.europa.eu/service';
  
  /**
   * Fetch ECB key interest rates
   * @param startPeriod Start date in YYYY-MM-DD format
   * @param endPeriod End date in YYYY-MM-DD format
   * @returns Array of DataPoints with interest rate values
   */
  async fetchKeyInterestRates(startPeriod: string = '', endPeriod: string = ''): Promise<DataPoint[]> {
    try {
      // If no dates provided, get last 5 years of data
      if (!startPeriod) {
        const today = new Date();
        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(today.getFullYear() - 5);
        startPeriod = fiveYearsAgo.toISOString().split('T')[0];
        endPeriod = today.toISOString().split('T')[0];
      }
      
      // ECB API parameters
      const params = {
        startPeriod,
        endPeriod,
        format: 'jsondata'
      };
      
      // Fetch the Main Refinancing Operations rate (MRO)
      const mroUrl = `${this.baseUrl}/data/FM/D.U2.EUR.4F.KR.MRR.COL`;
      const mroResponse = await axios.get(mroUrl, { params });
      
      if (mroResponse.data && mroResponse.data.dataSets && mroResponse.data.dataSets.length > 0) {
        const mroData = this.parseECBData(mroResponse.data, 'Main Refinancing Operations');
        
        // Fetch the Deposit Facility rate (DF)
        const dfUrl = `${this.baseUrl}/data/FM/D.U2.EUR.4F.KR.DFR`;
        const dfResponse = await axios.get(dfUrl, { params });
        const dfData = this.parseECBData(dfResponse.data, 'Deposit Facility');
        
        // Fetch the Marginal Lending Facility rate (MLF)
        const mlfUrl = `${this.baseUrl}/data/FM/D.U2.EUR.4F.KR.MLFR`;
        const mlfResponse = await axios.get(mlfUrl, { params });
        const mlfData = this.parseECBData(mlfResponse.data, 'Marginal Lending Facility');
        
        // Combine all data
        const combinedData = [...mroData, ...dfData, ...mlfData];
        
        // Group by date
        const groupedData: { [key: string]: any } = {};
        combinedData.forEach(item => {
          if (!groupedData[item.date]) {
            groupedData[item.date] = {
              date: item.date,
              MRO: null,
              DF: null,
              MLF: null
            };
          }
          
          if (item.metadata?.type === 'Main Refinancing Operations') {
            groupedData[item.date].MRO = item.value;
          } else if (item.metadata?.type === 'Deposit Facility') {
            groupedData[item.date].DF = item.value;
          } else if (item.metadata?.type === 'Marginal Lending Facility') {
            groupedData[item.date].MLF = item.value;
          }
        });
        
        // Convert to array and sort by date
        const result = Object.values(groupedData)
          .map(item => ({
            date: item.date,
            value: item.MRO, // Use MRO as the primary value
            metadata: {
              MRO: item.MRO,
              DF: item.DF,
              MLF: item.MLF,
              description: 'ECB Key Interest Rates'
            }
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        return result;
      }
      
      throw new AppError('No data returned from ECB API', 'API');
    } catch (error) {
      console.error('Error fetching ECB interest rates:', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw AppError.fromApiError(error);
    }
  }
  
  /**
   * Fetch Euro Area inflation (HICP) data
   * @param startPeriod Start date in YYYY-MM-DD format
   * @param endPeriod End date in YYYY-MM-DD format
   * @returns Array of DataPoints with inflation values
   */
  async fetchInflation(startPeriod: string = '', endPeriod: string = ''): Promise<DataPoint[]> {
    try {
      // If no dates provided, get last 5 years of data
      if (!startPeriod) {
        const today = new Date();
        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(today.getFullYear() - 5);
        startPeriod = fiveYearsAgo.toISOString().split('T')[0];
        endPeriod = today.toISOString().split('T')[0];
      }
      
      // ECB API parameters
      const params = {
        startPeriod,
        endPeriod,
        format: 'jsondata'
      };
      
      // Fetch HICP (Harmonized Index of Consumer Prices) year-on-year rate
      const url = `${this.baseUrl}/data/ICP/M.U2.Y.000000.3.ANR`;
      const response = await axios.get(url, { params });
      
      if (response.data && response.data.dataSets && response.data.dataSets.length > 0) {
        return this.parseECBData(response.data, 'Euro Area Inflation (HICP)');
      }
      
      throw new AppError('No inflation data returned from ECB API', 'API');
    } catch (error) {
      console.error('Error fetching ECB inflation data:', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw AppError.fromApiError(error);
    }
  }
  
  /**
   * Fetch Euro Area GDP growth data
   * @param startPeriod Start date in YYYY-MM-DD format
   * @param endPeriod End date in YYYY-MM-DD format
   * @returns Array of DataPoints with GDP growth values
   */
  async fetchGDPGrowth(startPeriod: string = '', endPeriod: string = ''): Promise<DataPoint[]> {
    try {
      // If no dates provided, get last 5 years of data
      if (!startPeriod) {
        const today = new Date();
        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(today.getFullYear() - 5);
        startPeriod = fiveYearsAgo.toISOString().split('T')[0];
        endPeriod = today.toISOString().split('T')[0];
      }
      
      // ECB API parameters
      const params = {
        startPeriod,
        endPeriod,
        format: 'jsondata'
      };
      
      // Fetch GDP growth quarter-on-quarter rate
      const url = `${this.baseUrl}/data/MNA/Q.Y.I8.W2.S1.S1.B.B1GQ._Z._Z._Z.EUR.LR.GY`;
      const response = await axios.get(url, { params });
      
      if (response.data && response.data.dataSets && response.data.dataSets.length > 0) {
        return this.parseECBData(response.data, 'Euro Area GDP Growth');
      }
      
      throw new AppError('No GDP growth data returned from ECB API', 'API');
    } catch (error) {
      console.error('Error fetching ECB GDP growth data:', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw AppError.fromApiError(error);
    }
  }
  
  /**
   * Helper method to parse ECB API data into DataPoint format
   * @param data Raw data from ECB API
   * @param type Type of data (for metadata)
   * @returns Array of DataPoints
   */
  private parseECBData(data: any, type: string): DataPoint[] {
    try {
      const result: DataPoint[] = [];
      
      if (!data.dataSets || !data.dataSets[0] || !data.dataSets[0].series || !data.structure) {
        return result;
      }
      
      const series = data.dataSets[0].series;
      const dimensions = data.structure.dimensions.observation || [];
      
      // Get time dimension (typically the first dimension)
      const timeDimension = dimensions.find((dim: any) => dim.id === 'TIME_PERIOD') || dimensions[0];
      
      // Loop through all series in the dataset
      Object.keys(series).forEach(seriesKey => {
        const observations = series[seriesKey].observations;
        
        // Loop through all observations in the series
        Object.keys(observations).forEach(obsKey => {
          const obsIndex = parseInt(obsKey);
          const value = observations[obsKey][0]; // First element is usually the value
          
          if (timeDimension && timeDimension.values && timeDimension.values[obsIndex]) {
            const period = timeDimension.values[obsIndex].id || timeDimension.values[obsIndex];
            
            // Convert period to ISO date if needed (ECB often uses YYYY-MM for monthly data)
            let date = period;
            if (period.length === 7 && period.includes('-')) {
              // Monthly data like "2023-05"
              date = `${period}-01`; // Set to first day of month
            } else if (period.length === 4) {
              // Yearly data like "2023"
              date = `${period}-01-01`; // Set to first day of year
            }
            
            result.push({
              date,
              value: parseFloat(value) || 0,
              metadata: {
                type,
                period,
                rawValue: value
              }
            });
          }
        });
      });
      
      return result;
    } catch (error) {
      console.error('Error parsing ECB data:', error);
      return [];
    }
  }
}

export default ECBService;
EOT

# 2. Create ECB Panel Component
mkdir -p src/components/Dashboard
cat > src/components/Dashboard/ECBPanel.tsx << 'EOT'
import React, { useState, useEffect } from 'react';
import { DataPoint } from '../../types';
import { ECBService } from '../../services/ECBService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './ECBPanel.css';

interface ECBPanelProps {
  years?: number;
}

const ECBPanel: React.FC<ECBPanelProps> = ({ years = 5 }) => {
  const [interestRateData, setInterestRateData] = useState<DataPoint[]>([]);
  const [inflationData, setInflationData] = useState<DataPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch ECB data
  const fetchECBData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const ecbService = new ECBService();
      
      // Calculate date range
      const today = new Date();
      const startDate = new Date();
      startDate.setFullYear(today.getFullYear() - years);
      
      const startPeriod = startDate.toISOString().split('T')[0];
      const endPeriod = today.toISOString().split('T')[0];
      
      // Fetch interest rates and inflation data in parallel
      const [interestRates, inflation] = await Promise.all([
        ecbService.fetchKeyInterestRates(startPeriod, endPeriod),
        ecbService.fetchInflation(startPeriod, endPeriod)
      ]);
      
      setInterestRateData(interestRates);
      setInflationData(inflation);
    } catch (error) {
      console.error("Error fetching ECB data:", error);
      setError("Failed to load ECB data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchECBData();
  }, [years]);

  // Get latest values
  const getLatestData = () => {
    const latestRate = interestRateData.length > 0 ? 
      interestRateData[interestRateData.length - 1] : null;
      
    const latestInflation = inflationData.length > 0 ? 
      inflationData[inflationData.length - 1] : null;
    
    return {
      rate: latestRate?.value || 0,
      inflation: latestInflation?.value || 0,
      rateDate: latestRate?.date || '',
      inflationDate: latestInflation?.date || ''
    };
  };

  const { rate, inflation, rateDate, inflationDate } = getLatestData();
  
  // Format date for display
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="ecb-panel">
      <h2>European Central Bank Data</h2>
      
      {isLoading && (
        <div className="loading">Loading ECB data...</div>
      )}
      
      {error && (
        <div className="error-message">{error}</div>
      )}
      
      {!isLoading && !error && interestRateData.length > 0 && (
        <>
          <div className="ecb-highlights">
            <div className="highlight-card">
              <h3>ECB Main Refinancing Rate</h3>
              <p className="rate-value">{rate.toFixed(2)}%</p>
              <p className="date">As of {formatDate(rateDate)}</p>
            </div>
            
            <div className="highlight-card">
              <h3>Euro Area Inflation</h3>
              <p className={`inflation-value ${inflation > 2.0 ? 'high' : inflation < 0 ? 'negative' : 'normal'}`}>
                {inflation.toFixed(1)}%
              </p>
              <p className="date">As of {formatDate(inflationDate)}</p>
            </div>
          </div>
          
          <div className="ecb-chart">
            <h3>ECB Interest Rates vs. Inflation</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart 
                  data={combineDataForChart(interestRateData, inflationData)} 
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(date) => formatDate(date)}
                  />
                  <YAxis 
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    formatter={(value: any) => [`${value}%`, '']}
                    labelFormatter={(date) => formatDate(date)}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="rate" 
                    name="Main Refinancing Rate" 
                    stroke="#1F618D" 
                    strokeWidth={2}
                    dot={{ r: 0 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="inflation" 
                    name="Inflation Rate (HICP)" 
                    stroke="#C0392B" 
                    strokeWidth={2}
                    dot={{ r: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="ecb-info">
            <h3>About ECB Data</h3>
            <p>
              The European Central Bank (ECB) sets monetary policy for the euro area. The Main Refinancing Operations
              rate is the ECB's key interest rate. The Harmonized Index of Consumer Prices (HICP) is used to measure
              inflation in the euro area.
            </p>
            <p>
              <a href="https://www.ecb.europa.eu/stats/html/index.en.html" target="_blank" rel="noopener noreferrer">
                Learn more from the ECB's Statistical Data Warehouse
              </a>
            </p>
          </div>
        </>
      )}
    </div>
  );
};

// Helper function to combine interest rate and inflation data for chart
const combineDataForChart = (rateData: DataPoint[], inflationData: DataPoint[]): any[] => {
  // Create a map of dates for faster lookup
  const rateMap: {[key: string]: number} = {};
  rateData.forEach(item => {
    // Convert date to YYYY-MM format for monthly comparison
    const monthDate = item.date.substring(0, 7);
    rateMap[monthDate] = item.value;
  });
  
  const inflationMap: {[key: string]: number} = {};
  inflationData.forEach(item => {
    const monthDate = item.date.substring(0, 7);
    inflationMap[monthDate] = item.value;
  });
  
  // Combine all unique dates
  const allDates = new Set([
    ...Object.keys(rateMap),
    ...Object.keys(inflationMap)
  ]);
  
  // Create combined data array
  return Array.from(allDates)
    .sort()
    .map(monthDate => {
      return {
        date: `${monthDate}-01`, // Convert back to YYYY-MM-DD
        rate: rateMap[monthDate] || null,
        inflation: inflationMap[monthDate] || null
      };
    });
};

export default ECBPanel;
EOT

# 3. Create CSS for ECB Panel
cat > src/components/Dashboard/ECBPanel.css << 'EOT'
.ecb-panel {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 24px;
}

.ecb-panel h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
  font-size: 1.5rem;
}

.ecb-panel h3 {
  margin-top: 0;
  margin-bottom: 8px;
  color: #555;
  font-size: 1.1rem;
}

.ecb-highlights {
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

.rate-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #1F618D;
  margin: 8px 0;
}

.inflation-value {
  font-size: 1.8rem;
  font-weight: bold;
  margin: 8px 0;
}

.inflation-value.normal {
  color: #27AE60;
}

.inflation-value.high {
  color: #C0392B;
}

.inflation-value.negative {
  color: #5D6D7E;
}

.date {
  font-size: 0.85rem;
  color: #777;
}

.ecb-chart {
  margin-bottom: 24px;
}

.ecb-info {
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 16px;
  margin-top: 16px;
}

.ecb-info p {
  margin-top: 8px;
  color: #555;
  line-height: 1.5;
}

.ecb-info a {
  color: #1F618D;
  text-decoration: none;
}

.ecb-info a:hover {
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

# 4. Update Dashboard component to include ECB Panel
cat > src/components/Dashboard/index.tsx << 'EOT'
import React, { useState, useEffect } from 'react';
import { DataPoint } from '../../types';
import { DataService } from '../../services/DataService';
import SOFRPanel from './SOFRPanel';
import BEAPanel from './BEAPanel';
import ECBPanel from './ECBPanel';
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
      <h1>Global Economic Data Dashboard</h1>
      
      <div className="dashboard-section">
        <h2 className="section-title">United States</h2>
        
        {/* BEA Panel (US GDP) */}
        <BEAPanel years={5} />
        
        {/* SOFR Panel (US Rates) */}
        <SOFRPanel days={30} />
      </div>
      
      <div className="dashboard-section">
        <h2 className="section-title">Europe</h2>
        
        {/* ECB Panel (European Data) */}
        <ECBPanel years={5} />
      </div>
      
      {isLoading && <div className="loading">Loading additional data...</div>}
      
      {error && <div className="error-message">{error}</div>}
      
      {!isLoading && !error && (
        <div className="dashboard-section">
          <h2 className="section-title">Additional Indicators</h2>
          
          <div className="data-container">
            <h3>FRED Economic Data</h3>
            <div className="data-summary">
              <p>Number of indicators available: {data.length}</p>
              {data.length > 0 && (
                <>
                  <p>Latest value: {data[data.length - 1].value}</p>
                  <p>Date: {data[data.length - 1].date}</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
EOT

# 5. Update Dashboard.css with new section styles
cat >> src/components/Dashboard/Dashboard.css << 'EOT'
/* Additional styles for dashboard sections */
.dashboard-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e0e0e0;
}

.data-container {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 24px;
}

.data-container h3 {
  margin-top: 0;
  color: #333;
  font-size: 1.2rem;
  margin-bottom: 16px;
}
EOT

echo -e "\n${GREEN}ECB API functionality has been added to your project!${NC}"
echo -e "${YELLOW}The Dashboard now includes:${NC}"
echo -e "  1. U.S. Section with:"
echo -e "     - BEA panel showing GDP growth data"
echo -e "     - SOFR panel showing interest rate data"
echo -e "  2. Europe Section with:"
echo -e "     - ECB panel showing euro area interest rates and inflation"
echo -e "\n${YELLOW}Run 'npm start' to see the changes.${NC}"

