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
                    labelFormatter={(date) => formatQuarter(String(date))}
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
