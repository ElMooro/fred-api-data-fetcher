/**
 * Treasury Securities Buybacks Example
 * 
 * This example demonstrates how to use the TreasuryBuybacksClient to analyze
 * Treasury securities buyback operations and generate detailed reports.
 */

const { TreasuryBuybacksClient } = require('../src/services/treasury-buybacks-client');

/**
 * Generates a comprehensive report on Treasury buyback operations
 */
async function generateBuybackReport() {
  console.log('Treasury Securities Buybacks Analysis');
  console.log('=====================================\n');
  
  const buybacksClient = new TreasuryBuybacksClient({
    enableCaching: true
  });
  
  try {
    // 1. Get recent buyback operations (last 5)
    console.log('Fetching recent buyback operations...');
    const operations = await buybacksClient.getBuybackOperations({
      sort: '-operation_date',
      page_size: 5
    });
    
    if (!operations.data || operations.data.length === 0) {
      console.log('No buyback operations found.');
      return;
    }
    
    console.log(`\nFound ${operations.data.length} recent buyback operations:`);
    operations.data.forEach((op, index) => {
      console.log(`${index + 1}. Operation ID: ${op.operation_id}`);
      console.log(`   Date: ${op.operation_date}`);
      console.log(`   Status: ${op.status}`);
      console.log(`   Settlement Date: ${op.settlement_date || 'N/A'}`);
      console.log('');
    });
    
    // 2. Detailed analysis of the most recent operation
    const mostRecentOp = operations.data[0];
    console.log(`\nDetailed Analysis of Operation: ${mostRecentOp.operation_id}`);
    console.log('--------------------------------------------------');
    
    // Get securities for this operation
    const securityDetails = await buybacksClient.getBuybackSecurityDetails({
      filter: `operation_id:eq:${mostRecentOp.operation_id}`
    });
    
    if (!securityDetails.data || securityDetails.data.length === 0) {
      console.log('No securities found for this operation.');
    } else {
      console.log(`Found ${securityDetails.data.length} securities in this operation:\n`);
      
      // Group securities by type
      const securityByType = {};
      securityDetails.data.forEach(security => {
        const type = security.security_type_desc || 'Unknown';
        if (!securityByType[type]) {
          securityByType[type] = [];
        }
        securityByType[type].push(security);
      });
      
      // Display securities by type
      Object.entries(securityByType).forEach(([type, securities]) => {
        console.log(`${type} (${securities.length}):`);
        
        // Calculate total par amount for this type
        const totalParAmount = securities.reduce((sum, security) => {
          return sum + parseFloat(security.par_amount_accepted || 0);
        }, 0);
        
        console.log(`  Total Par Amount: $${(totalParAmount / 1e9).toFixed(3)} billion`);
        
        // Display first 3 securities of each type
        securities.slice(0, 3).forEach(security => {
          console.log(`  - CUSIP: ${security.cusip}`);
          console.log(`    Maturity Date: ${security.maturity_date}`);
          console.log(`    Par Amount Accepted: $${formatAmount(parseFloat(security.par_amount_accepted || 0))}`);
          console.log(`    Price: ${security.price || 'N/A'}`);
          console.log('');
        });
        
        if (securities.length > 3) {
          console.log(`  ... and ${securities.length - 3} more ${type} securities\n`);
        }
      });
    }
    
    // 3. Generate annual statistics for the current year
    const currentYear = new Date().getFullYear();
    console.log(`\nAnnual Statistics for ${currentYear}`);
    console.log('----------------------------------');
    
    const yearStats = await buybacksClient.analyzeBuybackStatistics({
      startDate: `${currentYear}-01-01`,
      endDate: `${currentYear}-12-31`
    });
    
    if (yearStats.totalOperations === 0) {
      console.log(`No buyback operations found for ${currentYear}.`);
    } else {
      // Display summary statistics
      console.log(`Total Operations: ${yearStats.totalOperations}`);
      console.log(`Total Amount Purchased: $${(yearStats.totalAmountPurchased / 1e9).toFixed(2)} billion`);
      
      // Display operations by month
      console.log('\nOperations by Month:');
      Object.entries(yearStats.operationsByMonth)
        .sort((a, b) => a[0].localeCompare(b[0])) // Sort by month
        .forEach(([month, count]) => {
          console.log(`  ${formatYearMonth(month)}: ${count} operation(s)`);
        });
      
      // Display security type breakdown
      console.log('\nSecurity Type Breakdown:');
      Object.entries(yearStats.securityTypeBreakdown)
        .sort((a, b) => b[1].totalAmount - a[1].totalAmount) // Sort by amount (descending)
        .forEach(([type, data]) => {
          console.log(`  ${type}:`);
          console.log(`    Count: ${data.count}`);
          console.log(`    Amount: $${(data.totalAmount / 1e9).toFixed(2)} billion (${data.percentage.toFixed(1)}%)`);
        });
      
      // Display average prices
      console.log('\nAverage Prices:');
      Object.entries(yearStats.averagePrices)
        .forEach(([type, price]) => {
          console.log(`  ${type}: ${price.toFixed(4)}`);
        });
    }
    
    // 4. Historical comparison (last 3 years)
    console.log('\nHistorical Comparison (Last 3 Years)');
    console.log('------------------------------------');
    
    const historicalStats = await Promise.all([
      buybacksClient.analyzeBuybackStatistics({
        startDate: `${currentYear-2}-01-01`,
        endDate: `${currentYear-2}-12-31`
      }),
      buybacksClient.analyzeBuybackStatistics({
        startDate: `${currentYear-1}-01-01`,
        endDate: `${currentYear-1}-12-31`
      }),
      yearStats // Reuse current year stats
    ]);
    
    console.log('Total Operations:');
    console.log(`  ${currentYear-2}: ${historicalStats[0].totalOperations}`);
    console.log(`  ${currentYear-1}: ${historicalStats[1].totalOperations}`);
    console.log(`  ${currentYear}: ${historicalStats[2].totalOperations}`);
    
    console.log('\nTotal Amount Purchased (billions):');
    console.log(`  ${currentYear-2}: $${(historicalStats[0].totalAmountPurchased / 1e9).toFixed(2)}`);
    console.log(`  ${currentYear-1}: $${(historicalStats[1].totalAmountPurchased / 1e9).toFixed(2)}`);
    console.log(`  ${currentYear}: $${(historicalStats[2].totalAmountPurchased / 1e9).toFixed(2)}`);
    
    console.log('\nReport completed successfully.');
    
  } catch (error) {
    console.error('Error generating buyback report:', error);
  }
}

/**
 * Formats a numerical amount with appropriate scale
 */
function formatAmount(amount) {
  if (amount >= 1e9) {
    return `${(amount / 1e9).toFixed(3)} billion`;
  } else if (amount >= 1e6) {
    return `${(amount / 1e6).toFixed(3)} million`;
  } else if (amount >= 1e3) {
    return `${(amount / 1e3).toFixed(2)} thousand`;
  } else {
    return amount.toFixed(2);
  }
}

/**
 * Formats a year-month string (YYYY-MM) to a readable format (Month Year)
 */
function formatYearMonth(yearMonth) {
  const [year, month] = yearMonth.split('-');
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const monthName = months[parseInt(month, 10) - 1];
  return `${monthName} ${year}`;
}

// Run the report if this script is executed directly
if (require.main === module) {
  generateBuybackReport()
    .then(() => {
      console.log('\nExiting...');
    })
    .catch(error => {
      console.error('Failed to generate report:', error);
      process.exit(1);
    });
}

module.exports = {
  generateBuybackReport
};
