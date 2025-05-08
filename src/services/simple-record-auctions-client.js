/**
 * Simple Treasury Record-Setting Auction Client
 * 
 * A direct client for accessing the Record-Setting Treasury Securities Auction Data API.
 * This implementation uses a very minimal approach to avoid any parameter issues.
 * 
 * @version 1.0.0
 */

/**
 * Simple client for accessing Treasury record-setting auction data
 */
class SimpleRecordAuctionsClient {
  constructor() {
    this.baseUrl = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service';
    this.endpoint = 'v2/accounting/od/record_setting_auction';
  }
  
  /**
   * Makes a simple API request with minimal parameters
   * 
   * @param {Object} options - Request options
   * @returns {Promise<Object>} API response
   */
  async makeRequest(options = {}) {
    const { sortOrder = 'desc', pageSize = 10 } = options;
    
    // Build a very minimal query string
    const sort = sortOrder === 'desc' ? '-auction_date' : 'auction_date';
    const url = `${this.baseUrl}/${this.endpoint}?format=json&sort=${sort}&page[size]=${pageSize}&page[number]=1`;
    
    console.log('Making request to:', url);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Request failed:', error.message);
      throw error;
    }
  }
  
  /**
   * Gets a specific record-setting auction using explicit URL
   * 
   * @param {string} id - Auction identifier
   * @returns {Promise<Object>} Auction data
   */
  async getRecordById(id) {
    const url = `${this.baseUrl}/${this.endpoint}/${id}?format=json`;
    
    console.log('Making request to:', url);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Request failed:', error.message);
      throw error;
    }
  }
  
  /**
   * Gets the available fields for the record_setting_auction endpoint
   * 
   * @returns {Promise<Object>} Available fields data
   */
  async getAvailableFields() {
    const url = `${this.baseUrl}/${this.endpoint}/metadata`;
    
    console.log('Making request to:', url);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Request failed:', error.message);
      throw error;
    }
  }
}

/**
 * Simple test function for the Record-Setting Auction client
 */
async function testSimpleClient() {
  const client = new SimpleRecordAuctionsClient();
  
  try {
    console.log('Checking endpoint metadata...');
    
    try {
      const metadata = await client.getAvailableFields();
      console.log('\nEndpoint metadata:', metadata);
    } catch (metadataError) {
      console.log('Could not fetch metadata, trying direct data request...');
    }
    
    console.log('\nFetching record-setting auction data (minimal parameters)...');
    const data = await client.makeRequest();
    
    console.log('\nAPI Response:');
    console.log(`Status: ${data.status || 'OK'}`);
    console.log(`Total Records: ${data.meta?.total_count || 'Unknown'}`);
    console.log(`Records Returned: ${data.data?.length || 0}`);
    
    if (data.data && data.data.length > 0) {
      console.log('\nFirst Record:');
      console.log(JSON.stringify(data.data[0], null, 2));
      
      console.log('\nAvailable Fields:');
      console.log(Object.keys(data.data[0]).join(', '));
    } else {
      console.log('No records found.');
    }
    
    return data;
  } catch (error) {
    console.error('Test failed:', error.message);
    throw error;
  }
}

module.exports = {
  SimpleRecordAuctionsClient,
  testSimpleClient
};
