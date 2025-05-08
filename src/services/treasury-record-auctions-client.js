/**
 * Treasury Record-Setting Auction Client
 * 
 * A client for accessing the Record-Setting Treasury Securities Auction Data API.
 * This implementation is based on verified working endpoint parameters.
 * 
 * @version 2.0.2
 */

// If you're using CommonJS
const { TreasuryAuctionsClient } = require('./treasury-api-client');

/**
 * Treasury Record-Setting Auction Client
 * 
 * Extends the core TreasuryAuctionsClient with specific methods for
 * accessing data about record-setting Treasury securities auctions.
 */
class TreasuryRecordAuctionsClient extends TreasuryAuctionsClient {
  /**
   * Creates a new Treasury Record-Setting Auction client
   * 
   * @param {Object} options - Configuration options (passed to parent class)
   */
  constructor(options = {}) {
    super(options);
    
    // Base endpoint for record-setting auctions (confirmed working)
    this.recordAuctionEndpoint = 'v2/accounting/od/record_setting_auction';
  }

  /**
   * Gets record-setting Treasury auction data with working parameters
   * 
   * This method uses only parameters verified to work with the record_setting_auction endpoint.
   * 
   * @param {Object} [params={}] - Query parameters
   * @param {string} [params.sort] - Sort criteria (e.g., "security_type" or "-record_date")
   * @returns {Promise<Object>} Record-setting auction data
   */
  async getRecordSettingAuctions(params = {}) {
    // Create a valid query parameter object
    const validParams = new URLSearchParams();
    
    // Always include format (confirmed working)
    validParams.append('format', 'json');
    
    // Add sort if provided (confirmed working)
    if (params.sort) {
      validParams.append('sort', params.sort);
    }
    
    // Add pagination with correct format (confirmed working)
    if (params.pageSize) {
      validParams.append('page[size]', params.pageSize);
    }
    
    if (params.pageNumber) {
      validParams.append('page[number]', params.pageNumber);
    }
    
    // Make a direct request to avoid any issues with the parent fetchData method
    const url = `${this.baseUrl}/${this.recordAuctionEndpoint}?${validParams.toString()}`;
    
    try {
      console.log('Making request to:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}\n${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching record-setting auctions:', error.message);
      throw error;
    }
  }
  
  /**
   * Gets record-setting auctions filtered by security type
   * 
   * @param {string} securityType - Security type to filter by (e.g., "Bill", "Note", "Bond", "TIPS", "FRN")
   * @param {Object} [params={}] - Additional query parameters
   * @returns {Promise<Object>} Record-setting auctions for the specified security type
   */
  async getRecordsBySecurityType(securityType, params = {}) {
    // Get all records first (since filtering isn't supported directly)
    const allRecords = await this.getRecordSettingAuctions(params);
    
    // Filter the records manually
    if (allRecords.data && allRecords.data.length > 0) {
      const filteredData = allRecords.data.filter(record => 
        record.security_type && 
        record.security_type.toLowerCase() === securityType.toLowerCase()
      );
      
      // Return a response with the same structure but filtered data
      return {
        ...allRecords,
        data: filteredData,
        meta: {
          ...allRecords.meta,
          count: filteredData.length
        }
      };
    }
    
    return allRecords;
  }
  
  /**
   * Gets record-setting auctions by date range (client-side filtering)
   * 
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @param {Object} [params={}] - Additional query parameters
   * @returns {Promise<Object>} Record-setting auctions within the date range
   */
  async getRecordsByDateRange(startDate, endDate, params = {}) {
    // Get all records first (since filtering isn't supported directly)
    const allRecords = await this.getRecordSettingAuctions(params);
    
    // Filter the records manually by date
    if (allRecords.data && allRecords.data.length > 0) {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      const filteredData = allRecords.data.filter(record => {
        if (!record.record_date) return false;
        
        const recordDate = new Date(record.record_date);
        return recordDate >= startDateObj && recordDate <= endDateObj;
      });
      
      // Return a response with the same structure but filtered data
      return {
        ...allRecords,
        data: filteredData,
        meta: {
          ...allRecords.meta,
          count: filteredData.length
        }
      };
    }
    
    return allRecords;
  }
  
  /**
   * Gets the most recent record-setting auction for each security type
   * 
   * @returns {Promise<Object>} Latest record-setting auction for each security type
   */
  async getLatestRecordsBySecurityType() {
    // Get all recent record-setting auctions
    const allRecords = await this.getRecordSettingAuctions({
      sort: '-record_date',
      pageSize: 1000 // Get a large sample to ensure we have records for all types
    });
    
    if (!allRecords.data || allRecords.data.length === 0) {
      return { records: {} };
    }
    
    // Group by security type and find the most recent for each type
    const recordsByType = {};
    
    allRecords.data.forEach(record => {
      const securityType = record.security_type || 'Unknown';
      
      // If we haven't seen this type yet, or this record is more recent
      if (!recordsByType[securityType] || 
          new Date(record.record_date) > new Date(recordsByType[securityType].record_date)) {
        recordsByType[securityType] = record;
      }
    });
    
    return { records: recordsByType };
  }
  
  /**
   * Analyzes record-setting auctions to identify trends and patterns
   * 
   * @param {Object} [params={}] - Analysis parameters
   * @param {number} [params.years=5] - Number of years to analyze
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeRecordTrends(params = {}) {
    const { years = 5 } = params;
    
    // Calculate start date (years ago from today)
    const endDate = new Date().toISOString().slice(0, 10);
    const startDate = new Date(new Date().setFullYear(new Date().getFullYear() - years))
                      .toISOString().slice(0, 10);
    
    // Get record-setting auctions for the date range
    const recordsData = await this.getRecordsByDateRange(startDate, endDate, {
      pageSize: 1000 // Get a large sample for comprehensive analysis
    });
    
    if (!recordsData.data || recordsData.data.length === 0) {
      return {
        totalRecords: 0,
        byYear: {},
        bySecurityType: {},
        byRecordType: {},
        rankedRecordTypes: []
      };
    }
    
    // Initialize analysis structures
    const byYear = {};
    const bySecurityType = {};
    const byRecordType = {};
    
    // Process all records
    recordsData.data.forEach(record => {
      // Extract year from record date
      const year = new Date(record.record_date).getFullYear();
      const securityType = record.security_type || 'Unknown';
      
      // Determine record type based on available fields
      let recordType = 'Unknown';
      if (record.high_rate_pct) recordType = 'High Rate';
      else if (record.low_rate_pct) recordType = 'Low Rate';
      else if (record.high_offer_amt) recordType = 'High Offer';
      else if (record.high_bid_cover_ratio) recordType = 'High Bid-to-Cover';
      
      // Count by year
      if (!byYear[year]) {
        byYear[year] = { count: 0, byType: {} };
      }
      byYear[year].count++;
      
      // Count by security type within each year
      if (!byYear[year].byType[securityType]) {
        byYear[year].byType[securityType] = 0;
      }
      byYear[year].byType[securityType]++;
      
      // Count by security type overall
      if (!bySecurityType[securityType]) {
        bySecurityType[securityType] = { count: 0, byRecordType: {} };
      }
      bySecurityType[securityType].count++;
      
      // Count by record type within each security type
      if (!bySecurityType[securityType].byRecordType[recordType]) {
        bySecurityType[securityType].byRecordType[recordType] = 0;
      }
      bySecurityType[securityType].byRecordType[recordType]++;
      
      // Count by record type overall
      if (!byRecordType[recordType]) {
        byRecordType[recordType] = { count: 0, bySecurityType: {} };
      }
      byRecordType[recordType].count++;
      
      // Count by security type within each record type
      if (!byRecordType[recordType].bySecurityType[securityType]) {
        byRecordType[recordType].bySecurityType[securityType] = 0;
      }
      byRecordType[recordType].bySecurityType[securityType]++;
    });
    
    // Calculate record frequency (records per year)
    const totalYears = Object.keys(byYear).length;
    const recordFrequency = totalYears > 0 ? 
      recordsData.data.length / totalYears : 0;
    
    // Identify most common record types
    const rankedRecordTypes = Object.entries(byRecordType)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([type, data]) => ({
        type,
        count: data.count,
        percentage: (data.count / recordsData.data.length) * 100
      }));
    
    // Return comprehensive analysis
    return {
      totalRecords: recordsData.data.length,
      timeframe: {
        startDate,
        endDate,
        years
      },
      recordFrequency,
      byYear,
      bySecurityType,
      byRecordType,
      rankedRecordTypes
    };
  }
}

/**
 * Test method for the Record-Setting Auction client
 */
async function testRecordAuctionsClient() {
  const client = new TreasuryRecordAuctionsClient();
  
  try {
    console.log('Fetching recent record-setting Treasury auctions...');
    // Use only parameters that are confirmed to work
    const recentRecords = await client.getRecordSettingAuctions({
      sort: '-record_date',
      pageSize: 10
    });
    
    console.log(`\nFound ${recentRecords.data?.length || 0} recent record-setting auctions:`);
    
    if (recentRecords.data && recentRecords.data.length > 0) {
      // Print field names
      console.log('\nAvailable fields:');
      console.log(Object.keys(recentRecords.data[0]).join(', '));
      
      // Display recent records
      recentRecords.data.forEach((record, index) => {
        console.log(`\n${index + 1}. ${record.security_type || 'Unknown'} - ${record.record_date}`);
        console.log(`   Security Term: ${record.security_term || 'Unknown'}`);
        
        // Display additional data if available
        if (record.high_rate_pct) console.log(`   High Rate: ${record.high_rate_pct}%`);
        if (record.low_rate_pct) console.log(`   Low Rate: ${record.low_rate_pct}%`);
        if (record.high_offer_amt) console.log(`   High Offer: ${record.high_offer_amt}`);
        if (record.high_bid_cover_ratio) console.log(`   Bid-to-Cover: ${record.high_bid_cover_ratio}`);
      });
      
      // Get records by security type
      console.log('\nFetching Bill records...');
      const billRecords = await client.getRecordsBySecurityType('Bill', { pageSize: 5 });
      console.log(`Found ${billRecords.data?.length || 0} Bill records`);
      
      // Get latest records by security type
      console.log('\nFetching latest record for each security type...');
      const latestByType = await client.getLatestRecordsBySecurityType();
      
      console.log('\nLatest Records by Security Type:');
      Object.entries(latestByType.records).forEach(([type, record]) => {
        console.log(`${type}: ${record.record_date}`);
      });
      
      // Analyze trends
      console.log('\nAnalyzing record trends over past 3 years...');
      const trends = await client.analyzeRecordTrends({ years: 3 });
      
      console.log(`\nFound ${trends.totalRecords} record-setting auctions from ${trends.timeframe.startDate} to ${trends.timeframe.endDate}`);
      console.log(`Average: ${trends.recordFrequency.toFixed(1)} records per year`);
      
      if (trends.rankedRecordTypes && trends.rankedRecordTypes.length > 0) {
        console.log('\nTop Record Types:');
        trends.rankedRecordTypes.slice(0, 3).forEach(record => {
          console.log(`- ${record.type}: ${record.count} (${record.percentage.toFixed(1)}%)`);
        });
      }
    }
    
    return {
      recentRecords: recentRecords.data,
      trends: await client.analyzeRecordTrends({ years: 5 })
    };
  } catch (error) {
    console.error('Error in Record-Setting Auction client test:', error.message);
    throw error;
  }
}

// For Node.js/CommonJS environments
module.exports = {
  TreasuryRecordAuctionsClient,
  testRecordAuctionsClient
};
