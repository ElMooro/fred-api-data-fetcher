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
                    labelFormatter={(date) => formatDate(String(date))}
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
