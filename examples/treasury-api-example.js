/**
 * Treasury API Usage Example
 * 
 * This example demonstrates how to use the Treasury API client
 * to fetch and analyze Treasury data for financial applications.
 */
const { TreasuryAuctionsClient } = require('../src/services/treasury-api-client');

// Create a client instance with caching enabled
const treasuryClient = new TreasuryAuctionsClient({
  enableCaching: true,
  cacheTTL: 600000 // 10 minutes
});

/**
 * Get recent Treasury interest rates, filtered by security type
 */
async function getTreasuryInterestRatesByType(securityType) {
  try {
    // Query for the most recent interest rates for the specified security type
    const response = await treasuryClient.getTreasuryInterestRates({
      filter: `security_type_desc:eq:${securityType}`,
      sort: '-record_date',
      page_size: 20
    });
    
    console.log(`Retrieved ${response.data.length} ${securityType} interest rate records`);
    
    // Calculate average rate
    const avgRate = response.data.reduce((sum, record) => {
      return sum + parseFloat(record.avg_interest_rate_amt);
    }, 0) / response.data.length;
    
    console.log(`Average ${securityType} interest rate: ${avgRate.toFixed(3)}%`);
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${securityType} interest rates:`, error.message);
    throw error;
  }
}

/**
 * Compare interest rates across different Treasury security types
 */
async function compareInterestRates() {
  try {
    // Get rates for different security types
    const [marketableRates, nonmarketableRates] = await Promise.all([
      getTreasuryInterestRatesByType('Marketable'),
      getTreasuryInterestRatesByType('Non-marketable')
    ]);
    
    // Organize data by security description
    const ratesByDesc = {};
    
    // Process marketable rates
    marketableRates.forEach(record => {
      const desc = record.security_desc;
      if (!ratesByDesc[desc]) {
        ratesByDesc[desc] = {
          rates: [],
          type: 'Marketable'
        };
      }
      ratesByDesc[desc].rates.push(parseFloat(record.avg_interest_rate_amt));
    });
    
    // Process non-marketable rates
    nonmarketableRates.forEach(record => {
      const desc = record.security_desc;
      if (!ratesByDesc[desc]) {
        ratesByDesc[desc] = {
          rates: [],
          type: 'Non-marketable'
        };
      }
      ratesByDesc[desc].rates.push(parseFloat(record.avg_interest_rate_amt));
    });
    
    // Calculate average for each security description
    const securityAverages = Object.entries(ratesByDesc).map(([desc, data]) => {
      const avgRate = data.rates.reduce((sum, rate) => sum + rate, 0) / data.rates.length;
      return {
        securityDesc: desc,
        type: data.type,
        averageRate: avgRate
      };
    });
    
    // Sort by average rate (descending)
    securityAverages.sort((a, b) => b.averageRate - a.averageRate);
    
    // Display results
    console.log('\nTreasury Securities Average Interest Rates:');
    console.log('===========================================');
    securityAverages.forEach(security => {
      console.log(`${security.securityDesc} (${security.type}): ${security.averageRate.toFixed(3)}%`);
    });
    
    return securityAverages;
  } catch (error) {
    console.error('Error comparing interest rates:', error.message);
    throw error;
  }
}

/**
 * Get and analyze historical debt data
 */
async function analyzeDebtTrends() {
  try {
    // Get historical debt data
    const response = await treasuryClient.getDebtToThePenny({
      sort: '-record_date',
      page_size: 365 // About a year of data
    });
    
    console.log(`\nRetrieved ${response.data.length} historical debt records`);
    
    // Calculate change over the period
    const latestDebt = parseFloat(response.data[0].tot_pub_debt_out_amt);
    const oldestDebt = parseFloat(response.data[response.data.length - 1].tot_pub_debt_out_amt);
    const debtChange = latestDebt - oldestDebt;
    const percentChange = (debtChange / oldestDebt) * 100;
    
    // Format as trillions with 2 decimal places
    const formatTrillions = (amount) => `$${(amount / 1e12).toFixed(2)} trillion`;
    
    console.log('\nDebt Analysis:');
    console.log('=================');
    console.log(`Latest Total Debt: ${formatTrillions(latestDebt)}`);
    console.log(`Oldest Total Debt: ${formatTrillions(oldestDebt)}`);
    console.log(`Change: ${formatTrillions(debtChange)} (${percentChange.toFixed(2)}%)`);
    
    // Calculate debt held by public vs. intragovernmental
    const latestPublicDebt = parseFloat(response.data[0].debt_held_public_amt);
    const latestIntragovDebt = parseFloat(response.data[0].intragov_hold_amt);
    
    const publicPct = (latestPublicDebt / latestDebt) * 100;
    const intragovPct = (latestIntragovDebt / latestDebt) * 100;
    
    console.log('\nDebt Composition:');
    console.log('=================');
    console.log(`Debt Held by Public: ${formatTrillions(latestPublicDebt)} (${publicPct.toFixed(1)}%)`);
    console.log(`Intragovernmental Holdings: ${formatTrillions(latestIntragovDebt)} (${intragovPct.toFixed(1)}%)`);
    
    return {
      latestDebt,
      oldestDebt,
      debtChange,
      percentChange,
      composition: {
        publicDebt: latestPublicDebt,
        intragovDebt: latestIntragovDebt,
        publicPct,
        intragovPct
      }
    };
  } catch (error) {
    console.error('Error analyzing debt trends:', error.message);
    throw error;
  }
}

// Run the examples if executed directly
if (require.main === module) {
  (async () => {
    try {
      await compareInterestRates();
      await analyzeDebtTrends();
    } catch (error) {
      console.error('Example execution failed:', error);
    }
  })();
}

module.exports = {
  getTreasuryInterestRatesByType,
  compareInterestRates,
  analyzeDebtTrends
};
