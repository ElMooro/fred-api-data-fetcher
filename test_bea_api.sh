#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if jq is installed (used for JSON formatting)
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}Installing jq for JSON formatting...${NC}"
    apt-get update && apt-get install -y jq
fi

# Ask for BEA API key if not already set
if [ -z "$BEA_API_KEY" ]; then
    echo -e "${YELLOW}BEA API Key not found in environment.${NC}"
    echo -e "${YELLOW}Enter your BEA API Key:${NC}"
    read BEA_API_KEY
    
    # Export to environment for this session
    export BEA_API_KEY
    
    # Save to .env file for future use
    if [ -f .env ]; then
        if grep -q "BEA_API_KEY" .env; then
            # Update existing key
            sed -i "s/BEA_API_KEY=.*/BEA_API_KEY=$BEA_API_KEY/" .env
        else
            # Add new key
            echo "BEA_API_KEY=$BEA_API_KEY" >> .env
        fi
    else
        # Create new .env file
        echo "BEA_API_KEY=$BEA_API_KEY" > .env
    fi
    
    echo -e "${GREEN}API key saved to .env file${NC}"
fi

echo -e "${BLUE}===========================================================${NC}"
echo -e "${BLUE}         Testing BEA API with your API Key                 ${NC}"
echo -e "${BLUE}===========================================================${NC}"

# Test 1: Get API usage information
echo -e "${YELLOW}Test 1: Checking API usage information...${NC}"
USAGE_RESPONSE=$(curl -s "https://apps.bea.gov/api/data?&UserID=$BEA_API_KEY&method=GetAPIDatasetList&ResultFormat=JSON")

# Check if the response contains "APIDatasetList"
if echo "$USAGE_RESPONSE" | grep -q "APIDatasetList"; then
    echo -e "${GREEN}✓ API datasets list retrieved successfully!${NC}"
    
    # Format and display available datasets
    echo -e "${YELLOW}Available BEA Datasets:${NC}"
    echo "$USAGE_RESPONSE" | jq -r '.BEAAPI.Results.APIDatasetList.Dataset[] | "- \(.DatasetName): \(.DatasetDescription)"' | head -n 5
    echo "  [... and more]"
else
    echo -e "${RED}✗ Failed to retrieve API datasets.${NC}"
    echo -e "${RED}Response: ${NC}"
    echo "$USAGE_RESPONSE" | jq '.'
    exit 1
fi

# Test 2: Get GDP data
echo -e "\n${YELLOW}Test 2: Retrieving GDP data...${NC}"
GDP_RESPONSE=$(curl -s "https://apps.bea.gov/api/data?&UserID=$BEA_API_KEY&method=GetData&DataSetName=NIPA&TableName=T10101&Frequency=Q&Year=2023&Quarter=Q4&ResultFormat=JSON")

# Check if the response contains GDP data
if echo "$GDP_RESPONSE" | grep -q "BEAAPI" && ! echo "$GDP_RESPONSE" | grep -q "Error"; then
    echo -e "${GREEN}✓ GDP data retrieved successfully!${NC}"
    
    # Extract and display GDP data
    echo -e "${YELLOW}Recent GDP data points:${NC}"
    echo "$GDP_RESPONSE" | jq -r '.BEAAPI.Results.Data[] | select(.LineNumber=="1") | "\(.TimePeriod): \(.DataValue) \(.CL_UNIT)"' | head -n 5
else
    echo -e "${RED}✗ Failed to retrieve GDP data.${NC}"
    echo -e "${RED}Response: ${NC}"
    echo "$GDP_RESPONSE" | jq '.'
fi

# Test 3: Get Regional data
echo -e "\n${YELLOW}Test 3: Retrieving Regional data...${NC}"
REGIONAL_RESPONSE=$(curl -s "https://apps.bea.gov/api/data?&UserID=$BEA_API_KEY&method=GetData&DataSetName=Regional&TableName=CAGDP1&GeoFips=STATE&Year=2022&ResultFormat=JSON")

# Check if the response contains Regional data
if echo "$REGIONAL_RESPONSE" | grep -q "BEAAPI" && ! echo "$REGIONAL_RESPONSE" | grep -q "Error"; then
    echo -e "${GREEN}✓ Regional data retrieved successfully!${NC}"
    
    # Extract and display regional data
    echo -e "${YELLOW}Sample state GDP data:${NC}"
    echo "$REGIONAL_RESPONSE" | jq -r '.BEAAPI.Results.Data[] | select(.GeoName=="California" or .GeoName=="New York" or .GeoName=="Texas") | "\(.GeoName): \(.DataValue) million dollars"' | head -n 5
else
    echo -e "${RED}✗ Failed to retrieve Regional data.${NC}"
    echo -e "${RED}Response: ${NC}"
    echo "$REGIONAL_RESPONSE" | jq '.'
fi

# Test 4: Get International Trade data
echo -e "\n${YELLOW}Test 4: Retrieving International Trade data...${NC}"
TRADE_RESPONSE=$(curl -s "https://apps.bea.gov/api/data?&UserID=$BEA_API_KEY&method=GetData&DataSetName=ITA&DirectionOfInvestment=Outward&AreaOrCountry=All&Year=2022&Frequency=A&ResultFormat=JSON")

# Check if the response contains International Trade data
if echo "$TRADE_RESPONSE" | grep -q "BEAAPI" && ! echo "$TRADE_RESPONSE" | grep -q "Error"; then
    echo -e "${GREEN}✓ International Trade data retrieved successfully!${NC}"
    
    # Extract and display trade data
    echo -e "${YELLOW}Sample international trade data:${NC}"
    echo "$TRADE_RESPONSE" | jq -r '.BEAAPI.Results.Data[] | select(.AreaOrCountry=="China" or .AreaOrCountry=="Canada" or .AreaOrCountry=="Mexico") | "\(.AreaOrCountry): \(.TimeSeriesDescription) - \(.DataValue) \(.CL_UNIT)"' | head -n 5
else
    echo -e "${RED}✗ Failed to retrieve International Trade data.${NC}"
    echo -e "${RED}Response: ${NC}"
    echo "$TRADE_RESPONSE" | jq '.'
fi

echo -e "\n${BLUE}===========================================================${NC}"
echo -e "${BLUE}               BEA API Testing Complete                    ${NC}"
echo -e "${BLUE}===========================================================${NC}"

echo -e "\n${YELLOW}Would you like to add BEA API integration to your project? (y/n)${NC}"
read ADD_BEA

if [[ "$ADD_BEA" == "y" || "$ADD_BEA" == "Y" ]]; then
    echo -e "${YELLOW}Creating BEA API service...${NC}"
    
    # Create BEA API service
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
   * @param year Year to fetch data for
   * @param frequency Data frequency (A for annual, Q for quarterly)
   * @returns Array of DataPoints
   */
  async fetchGDP(year: string = 'X', frequency: string = 'Q'): Promise<DataPoint[]> {
    try {
      // Validate frequency
      if (!['A', 'Q'].includes(frequency)) {
        throw new AppError('Invalid frequency. Use "A" for annual or "Q" for quarterly.', 'API');
      }
      
      const params = {
        UserID: this.apiKey,
        method: 'GetData',
        DataSetName: 'NIPA',
        TableName: 'T10101', // GDP table
        Frequency: frequency,
        Year: year,
        ResultFormat: 'JSON'
      };
      
      // Add Quarter parameter if frequency is quarterly
      if (frequency === 'Q') {
        params['Quarter'] = 'All';
      }
      
      const response = await axios.get('https://apps.bea.gov/api/data', { params });
      
      if (response.data && response.data.BEAAPI && response.data.BEAAPI.Results) {
        // Filter for GDP data (Line Number 1)
        const gdpData = response.data.BEAAPI.Results.Data
          .filter(item => item.LineNumber === '1')
          .map(item => {
            // Parse the time period to create a proper date
            const date = this.parseTimePeriod(item.TimePeriod);
            
            return {
              date,
              value: parseFloat(item.DataValue),
              rawValue: parseFloat(item.DataValue),
              metadata: {
                unit: item.CL_UNIT,
                description: item.LineDescription
              }
            };
          });
        
        // Sort by date (oldest first)
        return gdpData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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
   * @param states Array of state FIPS codes or 'All' for all states
   * @returns Array of State GDP DataPoints
   */
  async fetchStateGDP(year: string = 'LAST', states: string | string[] = 'All'): Promise<any[]> {
    try {
      const geoFips = Array.isArray(states) ? states.join(',') : states;
      
      const params = {
        UserID: this.apiKey,
        method: 'GetData',
        DataSetName: 'Regional',
        TableName: 'CAGDP1',
        GeoFips: geoFips,
        Year: year,
        ResultFormat: 'JSON'
      };
      
      const response = await axios.get('https://apps.bea.gov/api/data', { params });
      
      if (response.data && response.data.BEAAPI && response.data.BEAAPI.Results) {
        return response.data.BEAAPI.Results.Data.map(item => ({
          state: item.GeoName,
          fips: item.GeoFips,
          year: item.TimePeriod,
          value: parseFloat(item.DataValue),
          metric: item.LineDescription,
          unit: item.CL_UNIT
        }));
      }
      
      throw new AppError('No data returned from BEA API', 'API');
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
      
      if (response.data && response.data.BEAAPI && response.data.BEAAPI.Results) {
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
      const monthMap = {
        1: '03-31',
        2: '06-30',
        3: '09-30',
        4: '12-31'
      };
      
      return `${year}-${monthMap[quarter]}`;
    }
    
    // If unknown format, return as-is
    return timePeriod;
  }
}

export default BEAService;
EOT

    # Create a BEA data component
    mkdir -p src/components/Dashboard
    
    cat > src/components/Dashboard/BEAPanel.tsx << 'EOT'
import React, { useState, useEffect } from 'react';
import { DataPoint } from '../../types';
import { BEAService } from '../../services/BEAService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface BEAPanelProps {
  years?: number;
}

const BEAPanel: React.FC<BEAPanelProps> = ({ years = 5 }) => {
  const [gdpData, setGDPData] = useState<DataPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch GDP data
  const fetchGDPData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const beaService = new BEAService();
      const currentYear = new Date().getFullYear();
      const startYear = currentYear - years;
      
      // Fetch data for the last 'years' years
      const data = await beaService.fetchGDP('LAST5', 'Q');
      
      setGDPData(data);
    } catch (error) {
      console.error("Error fetching BEA GDP data:", error);
      setError("Failed to load GDP data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchGDPData();
  }, [years]);

  // Calculate growth rates
  const calculateGrowthRates = (data: DataPoint[]): DataPoint[] => {
    if (!data || data.length <= 1) return [];
    
    return data.map((item, index) => {
      if (index === 0) {
        return {
          ...item,
          value: 0 // First item has no previous to compare
        };
      }
      
      const prevValue = data[index - 1].rawValue || 0;
      const currentValue = item.rawValue || 0;
      const growthRate = prevValue ? ((currentValue - prevValue) / prevValue) * 100 : 0;
      
      return {
        ...item,
        value: parseFloat(growthRate.toFixed(2))
      };
    });
  };

  // Format GDP value for display
  const formatGDPValue = (value: number): string => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)} trillion`;
    }
    return `$${value.toFixed(1)} billion`;
  };

  // Calculate latest growth rate
  const getLatestGrowthRate = (): { value: number, period: string } => {
    if (gdpData.length < 2) return { value: 0, period: '' };
    
    const latest = gdpData[gdpData.length - 1];
    const previous = gdpData[gdpData.length - 2];
    
    const growth = ((latest.rawValue! - previous.rawValue!) / previous.rawValue!) * 100;
    
    return {
      value: parseFloat(growth.toFixed(1)),
      period: latest.date
    };
  };

  const growthData = calculateGrowthRates(gdpData);
  const latestGrowth = getLatestGrowthRate();

  return (
    <div className="bea-panel">
      <h2>Bureau of Economic Analysis: GDP Data</h2>
      
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
              <h3>Current GDP</h3>
              <p className="gdp-value">{formatGDPValue(gdpData[gdpData.length - 1].rawValue!)}</p>
              <p className="date">As of Q{new Date(gdpData[gdpData.length - 1].date).getMonth() / 3 + 1} {new Date(gdpData[gdpData.length - 1].date).getFullYear()}</p>
            </div>
            
            <div className="highlight-card">
              <h3>Quarterly Growth</h3>
              <p className={`growth-value ${latestGrowth.value >= 0 ? 'positive' : 'negative'}`}>
                {latestGrowth.value >= 0 ? '+' : ''}{latestGrowth.value}%
              </p>
              <p className="date">Quarter-over-Quarter</p>
            </div>
          </div>
          
          <div className="gdp-chart">
            <h3>GDP History (Last {gdpData.length} Quarters)</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={gdpData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(date) => {
                      const d = new Date(date);
                      return `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`;
                    }}
                  />
                  <YAxis 
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(1)}T`}
                  />
                  <Tooltip 
                    formatter={(value) => [formatGDPValue(value as number), 'GDP']}
                    labelFormatter={(date) => {
                      const d = new Date(date);
                      return `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`;
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="rawValue" 
                    name="GDP" 
                    stroke="#2E86C1" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="growth-chart">
            <h3>GDP Quarterly Growth Rate (%)</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={growthData.slice(1)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(date) => {
                      const d = new Date(date);
                      return `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`;
                    }}
                  />
                  <YAxis 
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Growth Rate']}
                    labelFormatter={(date) => {
                      const d = new Date(date);
                      return `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`;
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    name="Growth Rate" 
                    stroke="#27AE60" 
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
              Gross Domestic Product (GDP) is the most comprehensive measure of U.S. economic activity.
              It represents the total value of all goods and services produced within the United States over a specific time period.
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

    # Create CSS for BEAPanel
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

.gdp-chart, .growth-chart {
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

    # Update the .env file to include BEA API key
    if grep -q "BEA_API_KEY" .env; then
        echo -e "${GREEN}BEA API key already in .env file${NC}"
    else
        echo "REACT_APP_BEA_API_KEY=$BEA_API_KEY" >> .env
        echo -e "${GREEN}Added BEA API key to .env file${NC}"
    fi
    
    echo -e "${GREEN}BEA API integration added to your project!${NC}"
    echo -e "${YELLOW}To use the BEA data panel, import BEAPanel in your Dashboard component.${NC}"
fi

echo -e "\n${GREEN}API Test Complete!${NC}"
