// src/services/CensusApiService.js

class CensusApiService {
  constructor() {
    this.API_KEY = process.env.CENSUS_API_KEY || '8423ffa543d0e95cdba580f2e381649b6772f515';
    this.BASE_URL = 'https://api.census.gov/data';
  }

  /**
   * Fetches data from the Census API
   * @param {string} dataset - Dataset name (e.g., 'acs/acs5')
   * @param {string} year - Year of data
   * @param {string[]} variables - Variables to fetch (e.g., ['NAME', 'B01001_001E'])
   * @param {string} forClause - Geographic scope (e.g., 'state:*')
   * @param {Object} additionalParams - Any additional parameters
   * @returns {Promise<Array>} - Census data as array
   */
  async fetchData(dataset, year, variables, forClause, additionalParams = {}) {
    try {
      // Construct URL
      const getClause = variables.join(',');
      let url = `${this.BASE_URL}/${year}/${dataset}?get=${getClause}&for=${forClause}&key=${this.API_KEY}`;
      
      // Add any additional parameters
      for (const [key, value] of Object.entries(additionalParams)) {
        url += `&${key}=${value}`;
      }
      
      console.log(`Fetching Census data from: ${url.replace(this.API_KEY, 'API_KEY')}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Census API error: ${response.status} - ${await response.text()}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching Census data:', error);
      throw error;
    }
  }
  
  /**
   * Gets population data by state
   * @returns {Promise<Object>} - Formatted population data
   */
  async getPopulationByState() {
    try {
      const data = await this.fetchData(
        'acs/acs5',
        '2021',
        ['NAME', 'B01001_001E'],
        'state:*'
      );
      
      // Format the data (first row contains headers)
      const headers = data[0];
      const nameIndex = headers.indexOf('NAME');
      const popIndex = headers.indexOf('B01001_001E');
      
      const result = data.slice(1).map(row => ({
        state: row[nameIndex],
        population: parseInt(row[popIndex], 10)
      }));
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Gets median household income by state
   * @returns {Promise<Object>} - Formatted income data
   */
  async getMedianIncomeByState() {
    try {
      const data = await this.fetchData(
        'acs/acs5',
        '2021',
        ['NAME', 'B19013_001E'],
        'state:*'
      );
      
      // Format the data
      const headers = data[0];
      const nameIndex = headers.indexOf('NAME');
      const incomeIndex = headers.indexOf('B19013_001E');
      
      const result = data.slice(1).map(row => ({
        state: row[nameIndex],
        medianIncome: parseInt(row[incomeIndex], 10)
      }));
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Gets housing data by state
   * @returns {Promise<Object>} - Formatted housing data
   */
  async getHousingDataByState() {
    try {
      // B25077_001E is median home value
      // B25003_002E is owner-occupied housing units
      // B25003_003E is renter-occupied housing units
      const data = await this.fetchData(
        'acs/acs5',
        '2021',
        ['NAME', 'B25077_001E', 'B25003_002E', 'B25003_003E'],
        'state:*'
      );
      
      // Format the data
      const headers = data[0];
      const result = data.slice(1).map(row => ({
        state: row[headers.indexOf('NAME')],
        medianHomeValue: parseInt(row[headers.indexOf('B25077_001E')], 10),
        ownerOccupied: parseInt(row[headers.indexOf('B25003_002E')], 10),
        renterOccupied: parseInt(row[headers.indexOf('B25003_003E')], 10)
      }));
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Gets educational attainment data by state
   * @returns {Promise<Object>} - Formatted education data
   */
  async getEducationByState() {
    try {
      // B15003_022E is "Bachelor's degree"
      // B15003_023E is "Master's degree" 
      // B15003_024E is "Professional school degree"
      // B15003_025E is "Doctorate degree"
      // B15003_001E is "Total" (population 25 years and over)
      const data = await this.fetchData(
        'acs/acs5',
        '2021',
        ['NAME', 'B15003_001E', 'B15003_022E', 'B15003_023E', 'B15003_024E', 'B15003_025E'],
        'state:*'
      );
      
      // Format the data
      const headers = data[0];
      const result = data.slice(1).map(row => {
        const total = parseInt(row[headers.indexOf('B15003_001E')], 10);
        const bachelors = parseInt(row[headers.indexOf('B15003_022E')], 10);
        const masters = parseInt(row[headers.indexOf('B15003_023E')], 10);
        const professional = parseInt(row[headers.indexOf('B15003_024E')], 10);
        const doctorate = parseInt(row[headers.indexOf('B15003_025E')], 10);
        
        return {
          state: row[headers.indexOf('NAME')],
          totalPopulation25Plus: total,
          bachelorsOrHigher: bachelors + masters + professional + doctorate,
          bachelorsOrHigherPercent: ((bachelors + masters + professional + doctorate) / total * 100).toFixed(2)
        };
      });
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Gets county-level data for a specific state
   * @param {string} stateCode - State FIPS code (e.g., '06' for California)
   * @returns {Promise<Object>} - Formatted county data
   */
  async getCountyDataByState(stateCode) {
    try {
      const data = await this.fetchData(
        'acs/acs5',
        '2021',
        ['NAME', 'B01001_001E', 'B19013_001E'],
        `county:*`,
        { 'in': `state:${stateCode}` }
      );
      
      // Format the data
      const headers = data[0];
      const result = data.slice(1).map(row => ({
        county: row[headers.indexOf('NAME')],
        population: parseInt(row[headers.indexOf('B01001_001E')], 10),
        medianIncome: parseInt(row[headers.indexOf('B19013_001E')], 10)
      }));
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = CensusApiService;
