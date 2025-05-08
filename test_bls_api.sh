#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get BLS API key from argument or prompt
if [ $# -eq 1 ]; then
    BLS_API_KEY="$1"
else
    echo -e "${YELLOW}Enter your BLS API Key:${NC}"
    read BLS_API_KEY
fi

echo -e "${BLUE}===========================================================${NC}"
echo -e "${BLUE}         Testing BLS API with your API Key                 ${NC}"
echo -e "${BLUE}===========================================================${NC}"

# Save API key to .env file for future use
if [ -f .env ]; then
    if grep -q "REACT_APP_BLS_API_KEY" .env; then
        # Update existing key
        sed -i "s/REACT_APP_BLS_API_KEY=.*/REACT_APP_BLS_API_KEY=$BLS_API_KEY/" .env
    else
        # Add new key
        echo "REACT_APP_BLS_API_KEY=$BLS_API_KEY" >> .env
    fi
else
    # Create new .env file
    echo "REACT_APP_BLS_API_KEY=$BLS_API_KEY" > .env
fi

echo -e "${GREEN}API key saved to .env file${NC}"

# Check if jq is installed (used for JSON formatting)
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}Installing jq for JSON formatting...${NC}"
    apt-get update && apt-get install -y jq
fi

# Test 1: Get CPI (Consumer Price Index) data
echo -e "\n${YELLOW}Test 1: Retrieving CPI data...${NC}"

# Create JSON payload for BLS API
cat > bls_request.json << EOD
{
  "seriesid": ["CUUR0000SA0"],
  "startyear": "2023",
  "endyear": "2024",
  "registrationkey": "$BLS_API_KEY"
}
EOD

# Send request to BLS API
CPI_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d @bls_request.json \
    "https://api.bls.gov/publicAPI/v2/timeseries/data/")

# Check if the response contains data
if echo "$CPI_RESPONSE" | jq -e '.status == "REQUEST_SUCCEEDED"' > /dev/null; then
    echo -e "${GREEN}✓ CPI data retrieved successfully!${NC}"
    
    # Extract and display data
    echo -e "${YELLOW}Recent CPI data points:${NC}"
    echo "$CPI_RESPONSE" | jq -r '.Results.series[0].data[] | "\(.periodName) \(.year): \(.value)"' | head -5
    
    # Get the status message
    STATUS=$(echo "$CPI_RESPONSE" | jq -r '.status')
    MESSAGE=$(echo "$CPI_RESPONSE" | jq -r '.message[] // empty')
    
    echo -e "\n${YELLOW}API Status: ${GREEN}$STATUS${NC}"
    if [ ! -z "$MESSAGE" ]; then
        echo -e "${YELLOW}Message: ${NC}$MESSAGE"
    fi
else
    echo -e "${RED}✗ Failed to retrieve CPI data.${NC}"
    echo -e "${RED}Response: ${NC}"
    echo "$CPI_RESPONSE" | jq '.'
fi

# Test 2: Get unemployment rate data
echo -e "\n${YELLOW}Test 2: Retrieving unemployment rate data...${NC}"

# Create JSON payload for BLS API
cat > bls_request.json << EOD
{
  "seriesid": ["LNS14000000"],
  "startyear": "2023",
  "endyear": "2024",
  "registrationkey": "$BLS_API_KEY"
}
EOD

# Send request to BLS API
UNEMPLOYMENT_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d @bls_request.json \
    "https://api.bls.gov/publicAPI/v2/timeseries/data/")

# Check if the response contains data
if echo "$UNEMPLOYMENT_RESPONSE" | jq -e '.status == "REQUEST_SUCCEEDED"' > /dev/null; then
    echo -e "${GREEN}✓ Unemployment data retrieved successfully!${NC}"
    
    # Extract and display data
    echo -e "${YELLOW}Recent unemployment rate data points:${NC}"
    echo "$UNEMPLOYMENT_RESPONSE" | jq -r '.Results.series[0].data[] | "\(.periodName) \(.year): \(.value)%"' | head -5
    
    # Get the status message
    STATUS=$(echo "$UNEMPLOYMENT_RESPONSE" | jq -r '.status')
    MESSAGE=$(echo "$UNEMPLOYMENT_RESPONSE" | jq -r '.message[] // empty')
    
    echo -e "\n${YELLOW}API Status: ${GREEN}$STATUS${NC}"
    if [ ! -z "$MESSAGE" ]; then
        echo -e "${YELLOW}Message: ${NC}$MESSAGE"
    fi
else
    echo -e "${RED}✗ Failed to retrieve unemployment data.${NC}"
    echo -e "${RED}Response: ${NC}"
    echo "$UNEMPLOYMENT_RESPONSE" | jq '.'
fi

# Test 3: Get employment data for a specific industry
echo -e "\n${YELLOW}Test 3: Retrieving employment data for a specific industry...${NC}"

# Create JSON payload for BLS API
cat > bls_request.json << EOD
{
  "seriesid": ["CEU5500000001"],
  "startyear": "2023",
  "endyear": "2024",
  "registrationkey": "$BLS_API_KEY"
}
EOD

# Send request to BLS API
INDUSTRY_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d @bls_request.json \
    "https://api.bls.gov/publicAPI/v2/timeseries/data/")

# Check if the response contains data
if echo "$INDUSTRY_RESPONSE" | jq -e '.status == "REQUEST_SUCCEEDED"' > /dev/null; then
    echo -e "${GREEN}✓ Industry employment data retrieved successfully!${NC}"
    
    # Extract and display data
    echo -e "${YELLOW}Recent industry employment data points:${NC}"
    echo "$INDUSTRY_RESPONSE" | jq -r '.Results.series[0].data[] | "\(.periodName) \(.year): \(.value) thousand jobs"' | head -5
    
    # Get the status message
    STATUS=$(echo "$INDUSTRY_RESPONSE" | jq -r '.status')
    MESSAGE=$(echo "$INDUSTRY_RESPONSE" | jq -r '.message[] // empty')
    
    echo -e "\n${YELLOW}API Status: ${GREEN}$STATUS${NC}"
    if [ ! -z "$MESSAGE" ]; then
        echo -e "${YELLOW}Message: ${NC}$MESSAGE"
    fi
else
    echo -e "${RED}✗ Failed to retrieve industry employment data.${NC}"
    echo -e "${RED}Response: ${NC}"
    echo "$INDUSTRY_RESPONSE" | jq '.'
fi

# Clean up
rm -f bls_request.json

echo -e "\n${BLUE}===========================================================${NC}"
echo -e "${BLUE}               BLS API Testing Complete                    ${NC}"
echo -e "${BLUE}===========================================================${NC}"

# Check if we want to add BLS functionality to the project
echo -e "\n${YELLOW}Would you like to add BLS API integration to your project? (y/n)${NC}"
read ADD_BLS

if [[ "$ADD_BLS" == "y" || "$ADD_BLS" == "Y" ]]; then
    echo -e "${YELLOW}Creating BLS API service...${NC}"
    
    # Create BLS API service
    mkdir -p src/services
    
    cat > src/services/BLSService.ts << 'EOT'
import axios from 'axios';
import { DataPoint } from '../types';
import { AppError } from '../utils/error';

export class BLSService {
  private apiKey: string;
  
  constructor(apiKey = process.env.REACT_APP_BLS_API_KEY || '') {
    this.apiKey = apiKey;
  }
  
  /**
   * Fetch data from BLS API
   * @param seriesId BLS series ID
   * @param startYear Start year (YYYY)
   * @param endYear End year (YYYY)
   * @returns Array of DataPoints
   */
  async fetchSeries(seriesId: string, startYear: string = '', endYear: string = ''): Promise<DataPoint[]> {
    try {
      // If no years provided, get last 5 years
      if (!startYear || !endYear) {
        const currentYear = new Date().getFullYear();
        endYear = currentYear.toString();
        startYear = (currentYear - 5).toString();
      }
      
      const payload = {
        seriesid: [seriesId],
        startyear: startYear,
        endyear: endYear,
        registrationkey: this.apiKey
      };
      
      const response = await axios.post(
        'https://api.bls.gov/publicAPI/v2/timeseries/data/',
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data && response.data.status === 'REQUEST_SUCCEEDED' && 
          response.data.Results && response.data.Results.series && 
          response.data.Results.series.length > 0) {
        
        const series = response.data.Results.series[0];
        
        // Transform BLS data to DataPoint format
        return series.data.map((item: any) => {
          // Convert period (e.g., 'M01') to month number
          const month = parseInt(item.period.substring(1));
          // Create date in YYYY-MM-DD format (using first day of month)
          const date = `${item.year}-${month.toString().padStart(2, '0')}-01`;
          
          return {
            date,
            value: parseFloat(item.value),
            rawValue: parseFloat(item.value),
            metadata: {
              year: item.year,
              period: item.period,
              periodName: item.periodName,
              seriesId: seriesId
            }
          };
        }).sort((a: DataPoint, b: DataPoint) => {
          // Sort by date (oldest first)
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
      }
      
      // Handle API error messages
      if (response.data && response.data.status !== 'REQUEST_SUCCEEDED') {
        throw new AppError(
          `BLS API error: ${response.data.message || 'Unknown error'}`,
          'API'
        );
      }
      
      throw new AppError('No data returned from BLS API', 'API');
    } catch (error) {
      console.error('Error fetching data from BLS:', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw AppError.fromApiError(error);
    }
  }
  
  /**
   * Fetch unemployment rate data
   * @param startYear Start year (YYYY)
   * @param endYear End year (YYYY)
   * @returns Array of DataPoints with unemployment rate values
   */
  async fetchUnemploymentRate(startYear: string = '', endYear: string = ''): Promise<DataPoint[]> {
    // LNS14000000 is the series ID for the unemployment rate
    return this.fetchSeries('LNS14000000', startYear, endYear);
  }
  
  /**
   * Fetch Consumer Price Index (CPI) data
   * @param startYear Start year (YYYY)
   * @param endYear End year (YYYY)
   * @returns Array of DataPoints with CPI values
   */
  async fetchCPI(startYear: string = '', endYear: string = ''): Promise<DataPoint[]> {
    // CUUR0000SA0 is the series ID for CPI for All Urban Consumers
    return this.fetchSeries('CUUR0000SA0', startYear, endYear);
  }
  
  /**
   * Fetch employment data for a specific industry
   * @param industryCode BLS industry code
   * @param startYear Start year (YYYY)
   * @param endYear End year (YYYY)
   * @returns Array of DataPoints with employment values
   */
  async fetchIndustryEmployment(industryCode: string, startYear: string = '', endYear: string = ''): Promise<DataPoint[]> {
    // Construct series ID for the industry employment
    // Format: CEU[industry code]01
    const seriesId = `CEU${industryCode}01`;
    return this.fetchSeries(seriesId, startYear, endYear);
  }
  
  /**
   * Calculate inflation rate from CPI data
   * @param cpiData Array of DataPoints with CPI values
   * @returns Array of DataPoints with inflation rate values (year-over-year percent change)
   */
  calculateInflationRate(cpiData: DataPoint[]): DataPoint[] {
    if (!cpiData || cpiData.length < 13) {
      // Need at least 13 months to calculate 12-month change
      return [];
    }
    
    return cpiData.map((item, index) => {
      // Find the data point from 12 months ago
      const yearAgoIndex = cpiData.findIndex(p => {
        const itemDate = new Date(item.date);
        const pDate = new Date(p.date);
        return pDate.getMonth() === itemDate.getMonth() && 
               pDate.getFullYear() === itemDate.getFullYear() - 1;
      });
      
      if (yearAgoIndex >= 0) {
        const yearAgoValue = cpiData[yearAgoIndex].value;
        const currentValue = item.value;
        const inflationRate = ((currentValue - yearAgoValue) / yearAgoValue) * 100;
        
        return {
          date: item.date,
          value: parseFloat(inflationRate.toFixed(1)),
          rawValue: item.rawValue,
          metadata: {
            ...item.metadata,
            calculationType: 'YearOverYearPercentChange'
          }
        };
      }
      
      // If we don't have data from a year ago, return null value
      return {
        date: item.date,
        value: null as any,
        rawValue: item.rawValue,
        metadata: item.metadata
      };
    }).filter(item => item.value !== null);
  }
}

export default BLSService;
EOT

    echo -e "${GREEN}BLS API service has been created!${NC}"
    echo -e "${YELLOW}Now you can integrate BLS data into your dashboard.${NC}"
fi

echo -e "\n${GREEN}BLS API Test Complete!${NC}"
