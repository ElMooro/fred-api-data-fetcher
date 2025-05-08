/**
 * Treasury Average Interest Rates Client
 * 
 * A client for accessing the Average Interest Rates on U.S. Treasury Securities API.
 * This client provides comprehensive access to average interest rate data for
 * various types of Treasury securities.
 * 
 * Endpoint: https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/avg_interest_rates
 * 
 * @version 2.0.0
 */

// If you're using CommonJS
const { TreasuryAuctionsClient } = require('./treasury-api-client');

/**
 * Treasury Average Interest Rates Client
 * 
 * Extends the core TreasuryAuctionsClient with specific methods for
 * accessing average interest rate data for Treasury securities.
 */
class TreasuryAvgRatesClient extends TreasuryAuctionsClient {
  /**
   * Creates a new Treasury Average Interest Rates client
   * 
   * @param {Object} options - Configuration options (passed to parent class)
   */
  constructor(options = {}) {
    super(options);
    
    // Base endpoint for average interest rates (confirmed working)
    this.avgRatesEndpoint = 'v2/accounting/od/avg_interest_rates';
  }

  /**
   * Gets average interest rates data with working parameters
   * 
   * @param {Object} [params={}] - Query parameters
   * @param {string|string[]} [params.fields] - Specific fields to return
   * @param {string} [params.filter] - Filter criteria (e.g., "security_type_desc:eq:Marketable")
   * @param {string} [params.sort] - Sort criteria (e.g., "-record_date" for most recent first)
   * @param {number} [params.pageSize] - Number of results per page
   * @param {number} [params.pageNumber] - Page number to retrieve
   * @returns {Promise<Object>} Average interest rates data
   */
  async getAverageRates(params = {}) {
    // Create a valid query parameter object
    const validParams = new URLSearchParams();
    
    // Add format
    validParams.append('format', 'json');
    
    // Add fields if provided
    if (params.fields) {
      const fields = Array.isArray(params.fields) ? params.fields.join(',') : params.fields;
      validParams.append('fields', fields);
    }
    
    // Add filter if provided
    if (params.filter) {
      validParams.append('filter', params.filter);
    }
    
    // Add sort if provided
    if (params.sort) {
      validParams.append('sort', params.sort);
    }
    
    // Add pagination with correct format
    if (params.pageSize) {
      validParams.append('page[size]', params.pageSize);
    }
    
    if (params.pageNumber) {
      validParams.append('page[number]', params.pageNumber);
    }
    
    // Make a direct request
    const url = `${this.baseUrl}/${this.avgRatesEndpoint}?${validParams.toString()}`;
    
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
      console.error('Error fetching average interest rates:', error.message);
      throw error;
    }
  }
  
  /**
   * Gets historical average rates for a specific security type
   * 
   * @param {string} securityType - Security type (e.g., "Marketable", "Non-marketable")
   * @param {Object} [params={}] - Additional query parameters
   * @returns {Promise<Object>} Historical average rates for the specified security type
   */
  async getRatesBySecurityType(securityType, params = {}) {
    return this.getAverageRates({
      ...params,
      filter: `security_type_desc:eq:${securityType}`,
      sort: params.sort || '-record_date'
    });
  }
  
  /**
   * Gets historical average rates for a specific security description
   * 
   * @param {string} securityDesc - Security description (e.g., "Treasury Bills", "Treasury Notes")
   * @param {Object} [params={}] - Additional query parameters
   * @returns {Promise<Object>} Historical average rates for the specified security description
   */
  async getRatesBySecurityDesc(securityDesc, params = {}) {
    return this.getAverageRates({
      ...params,
      filter: `security_desc:eq:${securityDesc}`,
      sort: params.sort || '-record_date'
    });
  }
  
  /**
   * Gets average rates within a specific date range
   * 
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @param {Object} [params={}] - Additional query parameters
   * @returns {Promise<Object>} Average rates within the date range
   */
  async getRatesByDateRange(startDate, endDate, params = {}) {
    return this.getAverageRates({
      ...params,
      filter: `record_date:gte:${startDate},record_date:lte:${endDate}`,
      sort: params.sort || 'record_date'
    });
  }
  
  /**
   * Gets the most recent average rates for each security description
   * 
   * @returns {Promise<Object>} Latest average rates for each security description
   */
  async getLatestRatesBySecurityDesc() {
    // First, get all security descriptions from recent data
    const recentData = await this.getAverageRates({
      sort: '-record_date',
      pageSize: 1000
    });
    
    if (!recentData.data || recentData.data.length === 0) {
      return { rates: {} };
    }
    
    // Extract unique security descriptions
    const securityDescs = [...new Set(
      recentData.data
        .filter(item => item.security_desc)
        .map(item => item.security_desc)
    )];
    
    // Get latest rates for each security description
    const latestRates = {};
    
    // Group by security description and find the most recent for each
    recentData.data.forEach(rateData => {
      const secDesc = rateData.security_desc;
      if (!secDesc) return;
      
      if (!latestRates[secDesc] || 
          new Date(rateData.record_date) > new Date(latestRates[secDesc].record_date)) {
        latestRates[secDesc] = rateData;
      }
    });
    
    return { rates: latestRates };
  }
  
  /**
   * Calculates rate trends for a specific security description
   * 
   * @param {string} securityDesc - Security description (e.g., "Treasury Bills")
   * @param {Object} [params={}] - Analysis parameters
   * @param {number} [params.months=12] - Number of months of data to analyze
   * @returns {Promise<Object>} Rate trend analysis
   */
  async calculateRateTrends(securityDesc, params = {}) {
    const { months = 12 } = params;
    
    // Calculate start date (months ago from today)
    const endDate = new Date().toISOString().slice(0, 10);
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    const startDateStr = startDate.toISOString().slice(0, 10);
    
    // Get rates for the date range
    const ratesData = await this.getRatesBySecurityDesc(securityDesc, {
      filter: `record_date:gte:${startDateStr},record_date:lte:${endDate}`,
      sort: 'record_date',
      pageSize: 1000
    });
    
    if (!ratesData.data || ratesData.data.length === 0) {
      return {
        securityDesc,
        startDate: startDateStr,
        endDate,
        dataPoints: 0,
        rateData: []
      };
    }
    
    // Process data points for trend analysis
    const rateData = ratesData.data.map(item => ({
      date: item.record_date,
      rate: parseFloat(item.avg_interest_rate_amt)
    }));
    
    // Calculate basic statistics
    const rates = rateData.map(item => item.rate);
    const minRate = Math.min(...rates);
    const maxRate = Math.max(...rates);
    const avgRate = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
    
    // Calculate month-over-month changes
    const monthlyChanges = [];
    for (let i = 1; i < rateData.length; i++) {
      const prevRate = rateData[i-1].rate;
      const currRate = rateData[i].rate;
      const change = currRate - prevRate;
      const percentChange = (change / prevRate) * 100;
      
      monthlyChanges.push({
        fromDate: rateData[i-1].date,
        toDate: rateData[i].date,
        fromRate: prevRate,
        toRate: currRate,
        change,
        percentChange
      });
    }
    
    // Find periods of consecutive increases/decreases
    const trends = [];
    let currentTrend = null;
    
    for (let i = 0; i < monthlyChanges.length; i++) {
      const change = monthlyChanges[i];
      
      if (!currentTrend) {
        // Start a new trend
        currentTrend = {
          direction: change.change > 0 ? 'increase' : 'decrease',
          startDate: change.fromDate,
          startRate: change.fromRate,
          endDate: change.toDate,
          endRate: change.toRate,
          duration: 1,
          totalChange: change.change,
          percentChange: change.percentChange
        };
      } else if ((currentTrend.direction === 'increase' && change.change > 0) ||
                 (currentTrend.direction === 'decrease' && change.change < 0)) {
        // Continue the current trend
        currentTrend.endDate = change.toDate;
        currentTrend.endRate = change.toRate;
        currentTrend.duration++;
        currentTrend.totalChange += change.change;
        currentTrend.percentChange = ((currentTrend.endRate - currentTrend.startRate) / currentTrend.startRate) * 100;
      } else {
        // End the current trend and start a new one
        trends.push(currentTrend);
        currentTrend = {
          direction: change.change > 0 ? 'increase' : 'decrease',
          startDate: change.fromDate,
          startRate: change.fromRate,
          endDate: change.toDate,
          endRate: change.toRate,
          duration: 1,
          totalChange: change.change,
          percentChange: change.percentChange
        };
      }
    }
    
    // Add the last trend if it exists
    if (currentTrend) {
      trends.push(currentTrend);
    }
    
    // Calculate current trend (last 3 data points)
    let currentTrendDesc = 'stable';
    if (rateData.length >= 3) {
      const last3 = rateData.slice(-3);
      const changes = [
        last3[1].rate - last3[0].rate,
        last3[2].rate - last3[1].rate
      ];
      
      if (changes[0] > 0 && changes[1] > 0) {
        currentTrendDesc = 'increasing';
      } else if (changes[0] < 0 && changes[1] < 0) {
        currentTrendDesc = 'decreasing';
      } else if (Math.abs(changes[0]) < 0.05 && Math.abs(changes[1]) < 0.05) {
        currentTrendDesc = 'stable';
      } else {
        currentTrendDesc = 'volatile';
      }
    }
    
    return {
      securityDesc,
      timeframe: {
        startDate: startDateStr,
        endDate,
        months
      },
      dataPoints: rateData.length,
      statistics: {
        minRate,
        maxRate,
        avgRate,
        currentRate: rateData[rateData.length - 1].rate,
        totalChange: rateData[rateData.length - 1].rate - rateData[0].rate,
        percentChange: ((rateData[rateData.length - 1].rate - rateData[0].rate) / rateData[0].rate) * 100
      },
      currentTrend: currentTrendDesc,
      significantTrends: trends.filter(trend => trend.duration >= 2),
      rateData
    };
  }
  
  /**
   * Compares rates across different security types
   * 
   * @param {string[]} securityDescs - Array of security descriptions to compare
   * @param {Object} [params={}] - Comparison parameters
   * @param {number} [params.months=12] - Number of months to analyze
   * @returns {Promise<Object>} Comparison results
   */
  async compareRates(securityDescs, params = {}) {
    const { months = 12 } = params;
    
    // Calculate start date (months ago from today)
    const endDate = new Date().toISOString().slice(0, 10);
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    const startDateStr = startDate.toISOString().slice(0, 10);
    
    // Get rates for all security types
    const ratesPromises = securityDescs.map(desc => 
      this.getRatesBySecurityDesc(desc, {
        filter: `record_date:gte:${startDateStr},record_date:lte:${endDate}`,
        sort: 'record_date',
        pageSize: 1000
      })
    );
    
    const ratesResults = await Promise.all(ratesPromises);
    
    // Process results for each security type
    const comparison = {};
    ratesResults.forEach((result, index) => {
      const secDesc = securityDescs[index];
      
      if (!result.data || result.data.length === 0) {
        comparison[secDesc] = {
          dataPoints: 0,
          available: false
        };
        return;
      }
      
      // Process data points
      const rateData = result.data.map(item => ({
        date: item.record_date,
        rate: parseFloat(item.avg_interest_rate_amt)
      }));
      
      // Calculate statistics
      const rates = rateData.map(item => item.rate);
      const minRate = Math.min(...rates);
      const maxRate = Math.max(...rates);
      const avgRate = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
      
      comparison[secDesc] = {
        dataPoints: rateData.length,
        available: true,
        currentRate: rateData[rateData.length - 1].rate,
        minRate,
        maxRate,
        avgRate,
        volatility: calculateVolatility(rates),
        totalChange: rateData[rateData.length - 1].rate - rateData[0].rate,
        percentChange: ((rateData[rateData.length - 1].rate - rateData[0].rate) / rateData[0].rate) * 100
      };
    });
    
    // Calculate relative performance metrics
    const secDescsWithData = securityDescs.filter(desc => comparison[desc].available);
    
    // Find highest and lowest current rates
    if (secDescsWithData.length > 1) {
      const highestCurrentRate = secDescsWithData.reduce((prev, curr) => 
        comparison[curr].currentRate > comparison[prev].currentRate ? curr : prev
      );
      
      const lowestCurrentRate = secDescsWithData.reduce((prev, curr) => 
        comparison[curr].currentRate < comparison[prev].currentRate ? curr : prev
      );
      
      // Add relative performance indicators
      secDescsWithData.forEach(desc => {
        comparison[desc].relativeTo = {};
        
        secDescsWithData.forEach(otherDesc => {
          if (desc !== otherDesc) {
            const diff = comparison[desc].currentRate - comparison[otherDesc].currentRate;
            const ratio = comparison[desc].currentRate / comparison[otherDesc].currentRate;
            
            comparison[desc].relativeTo[otherDesc] = {
              difference: diff,
              ratio: ratio
            };
          }
        });
        
        comparison[desc].isHighestRate = (desc === highestCurrentRate);
        comparison[desc].isLowestRate = (desc === lowestCurrentRate);
      });
    }
    
    return {
      timeframe: {
        startDate: startDateStr,
        endDate,
        months
      },
      comparison
    };
  }
}

/**
 * Calculate volatility (standard deviation of rates)
 */
function calculateVolatility(rates) {
  const mean = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
  const variance = rates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / rates.length;
  return Math.sqrt(variance);
}

/**
 * Test method for the Average Interest Rates client
 */
async function testAvgRatesClient() {
  const client = new TreasuryAvgRatesClient();
  
  try {
    console.log('Fetching recent average interest rates...');
    // Test basic rates retrieval
    const recentRates = await client.getAverageRates({
      sort: '-record_date',
      pageSize: 20
    });
    
    console.log(`\nFound ${recentRates.data?.length || 0} recent interest rate records.`);
    
    if (recentRates.data && recentRates.data.length > 0) {
      // Print field names from first record
      console.log('\nAvailable fields:');
      console.log(Object.keys(recentRates.data[0]).join(', '));
      
      // Group data by security type and description
      const groupedData = {};
      recentRates.data.forEach(rate => {
        const secType = rate.security_type_desc || 'Unknown';
        const secDesc = rate.security_desc || 'Unknown';
        
        if (!groupedData[secType]) {
          groupedData[secType] = {};
        }
        
        if (!groupedData[secType][secDesc]) {
          groupedData[secType][secDesc] = [];
        }
        
        groupedData[secType][secDesc].push(rate);
      });
      
      // Display grouped data
      console.log('\nRecent average rates by security type and description:');
      Object.entries(groupedData).forEach(([secType, descGroup]) => {
        console.log(`\n${secType}:`);
        
        Object.entries(descGroup).forEach(([secDesc, rates]) => {
          // Get most recent rate for this security description
          const latestRate = rates.reduce((latest, current) => 
            new Date(current.record_date) > new Date(latest.record_date) ? current : latest
          );
          
          console.log(`  ${secDesc}: ${latestRate.avg_interest_rate_amt}% (${latestRate.record_date})`);
        });
      });
      
      // Test getting rates by security type
      console.log('\nFetching rates for Marketable securities...');
      const marketableRates = await client.getRatesBySecurityType('Marketable', { pageSize: 10 });
      console.log(`Found ${marketableRates.data?.length || 0} Marketable securities rate records.`);
      
      // Test getting rates by security description
      console.log('\nFetching rates for Treasury Bills...');
      const billRates = await client.getRatesBySecurityDesc('Treasury Bills', { pageSize: 10 });
      console.log(`Found ${billRates.data?.length || 0} Treasury Bills rate records.`);
      
      // Test getting latest rates
      console.log('\nFetching latest rates for each security description...');
      const latestRates = await client.getLatestRatesBySecurityDesc();
      
      console.log('\nLatest rates by security description:');
      Object.entries(latestRates.rates).forEach(([desc, rate]) => {
        console.log(`${desc}: ${rate.avg_interest_rate_amt}% (${rate.record_date})`);
      });
      
      // Test trend analysis
      console.log('\nAnalyzing rate trends for Treasury Bills over past 12 months...');
      const trends = await client.calculateRateTrends('Treasury Bills', { months: 12 });
      
      console.log(`\nTrend analysis for ${trends.securityDesc}:`);
      console.log(`Timeframe: ${trends.timeframe.startDate} to ${trends.timeframe.endDate} (${trends.timeframe.months} months)`);
      console.log(`Data points: ${trends.dataPoints}`);
      console.log(`Current trend: ${trends.currentTrend}`);
      
      if (trends.statistics) {
        console.log('\nStatistics:');
        console.log(`Current rate: ${trends.statistics.currentRate.toFixed(3)}%`);
        console.log(`Min rate: ${trends.statistics.minRate.toFixed(3)}%`);
        console.log(`Max rate: ${trends.statistics.maxRate.toFixed(3)}%`);
        console.log(`Average rate: ${trends.statistics.avgRate.toFixed(3)}%`);
        console.log(`Total change: ${trends.statistics.totalChange.toFixed(3)}% (${trends.statistics.percentChange.toFixed(2)}%)`);
      }
      
      if (trends.significantTrends && trends.significantTrends.length > 0) {
        console.log('\nSignificant trends:');
        trends.significantTrends.forEach((trend, index) => {
          console.log(`${index + 1}. ${trend.direction.charAt(0).toUpperCase() + trend.direction.slice(1)}: ${trend.startDate} to ${trend.endDate} (${trend.duration} months)`);
          console.log(`   From ${trend.startRate.toFixed(3)}% to ${trend.endRate.toFixed(3)}% (${trend.totalChange.toFixed(3)}% change, ${trend.percentChange.toFixed(2)}%)`);
        });
      }
      
      // Test rate comparison
      console.log('\nComparing rates between Treasury Bills and Treasury Notes...');
      const comparison = await client.compareRates(['Treasury Bills', 'Treasury Notes'], { months: 6 });
      
      console.log('\nRate comparison:');
      Object.entries(comparison.comparison).forEach(([desc, data]) => {
        if (!data.available) {
          console.log(`${desc}: No data available`);
          return;
        }
        
        console.log(`\n${desc}:`);
        console.log(`Current rate: ${data.currentRate.toFixed(3)}%`);
        console.log(`Min/Max: ${data.minRate.toFixed(3)}% - ${data.maxRate.toFixed(3)}%`);
        console.log(`Volatility: ${data.volatility.toFixed(4)}`);
        console.log(`Total change: ${data.totalChange.toFixed(3)}% (${data.percentChange.toFixed(2)}%)`);
        
        if (data.isHighestRate) console.log('* Highest current rate among compared securities');
        if (data.isLowestRate) console.log('* Lowest current rate among compared securities');
      });
    }
    
    return {
      recentRates: recentRates.data,
      trends: await client.calculateRateTrends('Treasury Bills', { months: 12 })
    };
  } catch (error) {
    console.error('Error in Average Interest Rates client test:', error.message);
    throw error;
  }
}

// For Node.js/CommonJS environments
module.exports = {
  TreasuryAvgRatesClient,
  testAvgRatesClient
};
