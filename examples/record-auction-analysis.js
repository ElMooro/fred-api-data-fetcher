/**
 * Treasury Record-Setting Auction Analysis
 * 
 * This example demonstrates how to use the TreasuryRecordAuctionsClient to analyze
 * record-setting Treasury auction data and identify significant trends.
 */

const { TreasuryRecordAuctionsClient } = require('../src/services/treasury-record-auctions-client');

/**
 * Generates a comprehensive report on record-setting Treasury auctions
 */
async function generateRecordAuctionReport() {
  console.log('Treasury Record-Setting Auction Analysis');
  console.log('=======================================\n');
  
  const recordClient = new TreasuryRecordAuctionsClient({
    enableCaching: true
  });
  
  try {
    // 1. Get recent record-setting auctions
    console.log('Fetching recent record-setting auctions...');
    const recentRecords = await recordClient.getRecordSettingAuctions({
      sort: '-record_date',
      pageSize: 20
    });
    
    if (!recentRecords.data || recentRecords.data.length === 0) {
      console.log('No record-setting auctions found.');
      return;
    }
    
    console.log(`\nFound ${recentRecords.data.length} recent record-setting auctions.`);
    
    // Group by security type
    const recordsByType = {};
    recentRecords.data.forEach(record => {
      const type = record.security_type || 'Unknown';
      if (!recordsByType[type]) {
        recordsByType[type] = [];
      }
      recordsByType[type].push(record);
    });
    
    // Display summary by security type
    console.log('\nSummary by Security Type:');
    Object.entries(recordsByType).forEach(([type, records]) => {
      console.log(`\n${type} (${records.length}):`);
      
      // Group by record type within each security type
      const byRecordFeature = {};
      records.forEach(record => {
        let recordFeature = 'Other';
        if (record.high_rate_pct) recordFeature = 'High Rate';
        else if (record.low_rate_pct) recordFeature = 'Low Rate';
        else if (record.high_offer_amt) recordFeature = 'High Offer';
        else if (record.high_bid_cover_ratio) recordFeature = 'High Bid-Cover';
        
        if (!byRecordFeature[recordFeature]) {
          byRecordFeature[recordFeature] = [];
        }
        byRecordFeature[recordFeature].push(record);
      });
      
      // Display by record feature
      Object.entries(byRecordFeature).forEach(([feature, featureRecords]) => {
        console.log(`  ${feature} (${featureRecords.length}):`);
        
        // Show most recent 2 records for each feature
        featureRecords.slice(0, 2).forEach(record => {
          console.log(`    - ${record.record_date}: ${record.security_term || ''}`);
          if (record.high_rate_pct) console.log(`      High Rate: ${record.high_rate_pct}%`);
          if (record.low_rate_pct) console.log(`      Low Rate: ${record.low_rate_pct}%`);
          if (record.high_offer_amt) console.log(`      High Offer: ${record.high_offer_amt}`);
          if (record.high_bid_cover_ratio) console.log(`      Bid-Cover: ${record.high_bid_cover_ratio}`);
          if (record.first_auc_date_single_price) console.log(`      First Single Price Auction: ${record.first_auc_date_single_price}`);
        });
        
        if (featureRecords.length > 2) {
          console.log(`    ... and ${featureRecords.length - 2} more`);
        }
      });
    });
    
    // 2. Analyze historical trends (last 10 years)
    console.log('\n\nHistorical Trend Analysis (Last 10 Years)');
    console.log('------------------------------------------');
    
    const trends = await recordClient.analyzeRecordTrends({ years: 10 });
    
    console.log(`Analyzed ${trends.totalRecords} record-setting auctions from ${trends.timeframe.startDate} to ${trends.timeframe.endDate}`);
    console.log(`Average frequency: ${trends.recordFrequency.toFixed(1)} record-setting auctions per year\n`);
    
    // Display by year
    console.log('Records by Year:');
    Object.entries(trends.byYear)
      .sort((a, b) => b[0] - a[0]) // Sort by year, descending
      .forEach(([year, data]) => {
        console.log(`  ${year}: ${data.count} records`);
        
        // Show breakdown by security type
        const topTypes = Object.entries(data.byType)
          .sort((a, b) => b[1] - a[1]) // Sort by count, descending
          .slice(0, 3); // Top 3
        
        if (topTypes.length > 0) {
          const typeBreakdown = topTypes
            .map(([type, count]) => `${type} (${count})`)
            .join(', ');
          console.log(`    Top types: ${typeBreakdown}`);
        }
      });
    
    // Display by security type
    console.log('\nRecords by Security Type:');
    Object.entries(trends.bySecurityType)
      .sort((a, b) => b[1].count - a[1].count) // Sort by count, descending
      .forEach(([type, data]) => {
        console.log(`  ${type}: ${data.count} records`);
        
        // Show breakdown by record type
        const topRecordTypes = Object.entries(data.byRecordType)
          .sort((a, b) => b[1] - a[1]) // Sort by count, descending
          .slice(0, 3); // Top 3
        
        if (topRecordTypes.length > 0) {
          const recordTypeBreakdown = topRecordTypes
            .map(([recordType, count]) => `${recordType} (${count})`)
            .join(', ');
          console.log(`    Top record types: ${recordTypeBreakdown}`);
        }
      });
    
    // 3. Find significant records
    console.log('\n\nSignificant Records');
    console.log('-----------------');
    
    // Get records with each security type
    const securityTypes = Object.keys(trends.bySecurityType);
    
    for (const secType of securityTypes) {
      console.log(`\n${secType}:`);
      
      // Get records for this security type
      const typeRecords = await recordClient.getRecordsBySecurityType(secType, {
        sort: '-record_date',
        pageSize: 100
      });
      
      if (!typeRecords.data || typeRecords.data.length === 0) {
        console.log('  No significant records found.');
        continue;
      }
      
      // Try to identify significant records for each metric
      const highRateRecord = typeRecords.data.find(record => record.high_rate_pct);
      const lowRateRecord = typeRecords.data.find(record => record.low_rate_pct);
      const highOfferRecord = typeRecords.data.find(record => record.high_offer_amt);
      const highBidCoverRecord = typeRecords.data.find(record => record.high_bid_cover_ratio);
      
      // Display significant records
      if (highRateRecord) {
        console.log('  High Rate:');
        console.log(`    Date: ${highRateRecord.record_date}`);
        console.log(`    Term: ${highRateRecord.security_term || 'N/A'}`);
        console.log(`    Rate: ${highRateRecord.high_rate_pct}%`);
        console.log(`    First Auction Date: ${highRateRecord.first_auc_date_high_rate || 'N/A'}`);
      }
      
      if (lowRateRecord) {
        console.log('  Low Rate:');
        console.log(`    Date: ${lowRateRecord.record_date}`);
        console.log(`    Term: ${lowRateRecord.security_term || 'N/A'}`);
        console.log(`    Rate: ${lowRateRecord.low_rate_pct}%`);
        console.log(`    First Auction Date: ${lowRateRecord.first_auc_date_low_rate || 'N/A'}`);
      }
      
      if (highOfferRecord) {
        console.log('  High Offer:');
        console.log(`    Date: ${highOfferRecord.record_date}`);
        console.log(`    Term: ${highOfferRecord.security_term || 'N/A'}`);
        console.log(`    Amount: ${highOfferRecord.high_offer_amt}`);
        console.log(`    First Auction Date: ${highOfferRecord.first_auc_date_high_offer || 'N/A'}`);
      }
      
      if (highBidCoverRecord) {
        console.log('  High Bid-to-Cover:');
        console.log(`    Date: ${highBidCoverRecord.record_date}`);
        console.log(`    Term: ${highBidCoverRecord.security_term || 'N/A'}`);
        console.log(`    Ratio: ${highBidCoverRecord.high_bid_cover_ratio}`);
        console.log(`    First Auction Date: ${highBidCoverRecord.first_auc_date_high_bid_cover || 'N/A'}`);
      }
    }
    
    console.log('\nReport completed successfully.');
    
  } catch (error) {
    console.error('Error generating record auction report:', error);
  }
}

// Run the report if this script is executed directly
if (require.main === module) {
  generateRecordAuctionReport()
    .then(() => {
      console.log('\nExiting...');
    })
    .catch(error => {
      console.error('Failed to generate report:', error);
      process.exit(1);
    });
}

module.exports = {
  generateRecordAuctionReport
};
