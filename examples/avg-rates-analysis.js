/**
 * Treasury Average Interest Rates Analysis
 * 
 * This example demonstrates how to use the TreasuryAvgRatesClient to analyze
 * average interest rates for U.S. Treasury securities and generate insightful reports.
 */

const { TreasuryAvgRatesClient } = require('../src/services/treasury-avg-rates-client');

/**
 * Generates a comprehensive report on Treasury average interest rates
 */
async function generateRatesReport() {
  console.log('Treasury Average Interest Rates Analysis');
  console.log('=======================================\n');
  
  const ratesClient = new TreasuryAvgRatesClient({
    enableCaching: true
  });
  
  try {
    // 1. Get current rates for all security types
    console.log('Fetching current average interest rates...');
    const latestRates = await ratesClient.getLatestRatesBySecurityDesc();
    
    if (!latestRates.rates || Object.keys(latestRates.rates).length === 0) {
      console.log('No average interest rate data found.');
      return;
    }
    
    console.log('\nCurrent Average Interest Rates:');
    console.log('-----------------------------');
    
    // Group by security type
    const ratesByType = {};
    Object.entries(latestRates.rates).forEach(([desc, rate]) => {
      const type = rate.security_type_desc || 'Unknown';
      
      if (!ratesByType[type]) {
        ratesByType[type] = [];
      }
      
      ratesByType[type].push({
        description: desc,
        rate: parseFloat(rate.avg_interest_rate_amt),
        date: rate.record_date
      });
    });
    
    // Display grouped rates
    Object.entries(ratesByType).forEach(([type, rates]) => {
      console.log(`\n${type}:`);
      
      // Sort by rate (descending)
      rates.sort((a, b) => b.rate - a.rate);
      
      rates.forEach(rate => {
        console.log(`  ${rate.description}: ${rate.rate.toFixed(3)}% (as of ${rate.date})`);
      });
    });
    
    // 2. Analyze historical trends
    console.log('\n\nHistorical Trend Analysis');
    console.log('------------------------');
    
    // Select key security types to analyze
    const keySecurityDescs = [
      'Treasury Bills',
      'Treasury Notes',
      'Treasury Bonds',
      'Treasury Inflation-Protected Securities (TIPS)'
    ];
    
    for (const secDesc of keySecurityDescs) {
      if (!Object.keys(latestRates.rates).includes(secDesc)) {
        console.log(`\n${secDesc}: No data available`);
        continue;
      }
      
      console.log(`\n${secDesc}:`);
      
      try {
        // Calculate trends over the past 24 months
        const trends = await ratesClient.calculateRateTrends(secDesc, { months: 24 });
        
        if (trends.dataPoints === 0) {
          console.log('  No historical data available for trend analysis.');
          continue;
        }
        
        console.log(`  Analysis period: ${trends.timeframe.startDate} to ${trends.timeframe.endDate}`);
        console.log(`  Current rate: ${trends.statistics.currentRate.toFixed(3)}%`);
        console.log(`  Change over period: ${trends.statistics.totalChange >= 0 ? '+' : ''}${trends.statistics.totalChange.toFixed(3)}% (${trends.statistics.percentChange >= 0 ? '+' : ''}${trends.statistics.percentChange.toFixed(2)}%)`);
        console.log(`  Range: ${trends.statistics.minRate.toFixed(3)}% to ${trends.statistics.maxRate.toFixed(3)}%`);
        console.log(`  Current trend: ${trends.currentTrend}`);
        
        // Show significant trends
        if (trends.significantTrends && trends.significantTrends.length > 0) {
          console.log('\n  Significant rate movements:');
          
          trends.significantTrends
            .sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange))
            .slice(0, 3)
            .forEach((trend, index) => {
              console.log(`    ${index + 1}. ${trend.direction === 'increase' ? 'Increase' : 'Decrease'} from ${trend.startDate} to ${trend.endDate}:`);
              console.log(`       ${trend.startRate.toFixed(3)}% → ${trend.endRate.toFixed(3)}% (${trend.totalChange >= 0 ? '+' : ''}${trend.totalChange.toFixed(3)}%, ${trend.percentChange >= 0 ? '+' : ''}${trend.percentChange.toFixed(2)}%)`);
            });
        }
      } catch (error) {
        console.log(`  Error analyzing trends: ${error.message}`);
      }
    }
    
    // 3. Rate comparisons
    console.log('\n\nRate Comparisons');
    console.log('---------------');
    
    try {
      // Compare marketable securities
      console.log('\nMarketable Securities Comparison:');
      
      const marketableRates = await ratesClient.getRatesBySecurityType('Marketable', {
        sort: '-record_date',
        pageSize: 20
      });
      
      if (!marketableRates.data || marketableRates.data.length === 0) {
        console.log('  No data available for marketable securities.');
      } else {
        // Get unique security descriptions
        const marketableDescs = [...new Set(
          marketableRates.data
            .filter(item => item.security_desc)
            .map(item => item.security_desc)
        )];
        
        // Compare rates
        const comparison = await ratesClient.compareRates(marketableDescs, { months: 12 });
        
        // Format comparison results
        console.log('\n  Current rates (ranked from highest to lowest):');
        
        Object.entries(comparison.comparison)
          .filter(([_, data]) => data.available)
          .sort((a, b) => b[1].currentRate - a[1].currentRate)
          .forEach(([desc, data], index) => {
            console.log(`    ${index + 1}. ${desc}: ${data.currentRate.toFixed(3)}%`);
          });
        
        // Show rate spreads between key securities
        console.log('\n  Key rate spreads:');
        
        // Get Treasury Bills and Notes if available
        const billsData = comparison.comparison['Treasury Bills'];
        const notesData = comparison.comparison['Treasury Notes'];
        const bondsData = comparison.comparison['Treasury Bonds'];
        const tipsData = comparison.comparison['Treasury Inflation-Protected Securities (TIPS)'];
        
        if (billsData?.available && notesData?.available) {
          const spread = notesData.currentRate - billsData.currentRate;
          console.log(`    Bills-Notes spread: ${Math.abs(spread).toFixed(3)}% (Notes ${spread >= 0 ? 'higher' : 'lower'})`);
        }
        
        if (notesData?.available && bondsData?.available) {
          const spread = bondsData.currentRate - notesData.currentRate;
          console.log(`    Notes-Bonds spread: ${Math.abs(spread).toFixed(3)}% (Bonds ${spread >= 0 ? 'higher' : 'lower'})`);
        }
        
        if (notesData?.available && tipsData?.available) {
          const spread = notesData.currentRate - tipsData.currentRate;
          console.log(`    Notes-TIPS spread: ${Math.abs(spread).toFixed(3)}% (nominal ${spread >= 0 ? 'higher' : 'lower'})`);
        }
        
        // Show volatility comparison
        console.log('\n  Rate volatility (past 12 months):');
        
        Object.entries(comparison.comparison)
          .filter(([_, data]) => data.available)
          .sort((a, b) => b[1].volatility - a[1].volatility)
          .forEach(([desc, data], index) => {
            console.log(`    ${index + 1}. ${desc}: ${data.volatility.toFixed(4)}`);
          });
      }
      
      // Compare non-marketable securities
      console.log('\nNon-marketable Securities Comparison:');
      
      const nonMarketableRates = await ratesClient.getRatesBySecurityType('Non-marketable', {
        sort: '-record_date',
        pageSize: 20
      });
      
      if (!nonMarketableRates.data || nonMarketableRates.data.length === 0) {
        console.log('  No data available for non-marketable securities.');
      } else {
        // Get unique security descriptions
        const nonMarketableDescs = [...new Set(
          nonMarketableRates.data
            .filter(item => item.security_desc)
            .map(item => item.security_desc)
        )];
        
        // Compare rates
        const comparison = await ratesClient.compareRates(nonMarketableDescs, { months: 12 });
        
        // Format comparison results
        console.log('\n  Current rates (ranked from highest to lowest):');
        
        Object.entries(comparison.comparison)
          .filter(([_, data]) => data.available)
          .sort((a, b) => b[1].currentRate - a[1].currentRate)
          .forEach(([desc, data], index) => {
            console.log(`    ${index + 1}. ${desc}: ${data.currentRate.toFixed(3)}%`);
          });
      }
    } catch (error) {
      console.log(`Error in rate comparisons: ${error.message}`);
    }
    
    console.log('\nReport completed successfully.');
    
  } catch (error) {
    console.error('Error generating average rates report:', error);
  }
}

// Run the report if this script is executed directly
if (require.main === module) {
  generateRatesReport()
    .then(() => {
      console.log('\nExiting...');
    })
    .catch(error => {
      console.error('Failed to generate report:', error);
      process.exit(1);
    });
}

module.exports = {
  generateRatesReport
};
