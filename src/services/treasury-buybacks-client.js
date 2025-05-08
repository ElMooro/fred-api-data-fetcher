/**
 * Treasury Securities Buybacks Client
 * 
 * Extension for the TreasuryAuctionsClient that adds support for Treasury Securities Buybacks data.
 * This implementation connects to the Treasury's Buybacks API endpoints to retrieve data about
 * buyback operations and security details.
 * 
 * API Documentation: https://fiscaldata.treasury.gov/datasets/treasury-securities-buybacks/
 * 
 * @version 1.0.1
 */

// If you're using CommonJS
const { TreasuryAuctionsClient } = require('./treasury-api-client');

// If you're using ES modules, comment the line above and uncomment this:
// import { TreasuryAuctionsClient } from './treasury-api-client';

/**
 * Treasury Securities Buybacks Client
 * 
 * Extends the core TreasuryAuctionsClient with specific methods for
 * accessing Treasury buyback operations and security details.
 */
class TreasuryBuybacksClient extends TreasuryAuctionsClient {
  /**
   * Creates a new Treasury Buybacks client
   * 
   * @param {Object} options - Configuration options (passed to parent class)
   */
  constructor(options = {}) {
    super(options);
    
    // Base endpoint for buybacks operations
    this.buybacksEndpoint = 'v1/accounting/od';
  }

  /**
   * Gets Treasury buyback operations data
   * 
   * Retrieves data about Treasury securities buyback operations, including
   * announcements and results. Treasury buys back off-the-run nominal coupon 
   * securities and Treasury Inflation-Protected Securities (TIPS).
   * 
   * @param {Object} params - Query parameters
   * @param {string|string[]} [params.fields] - Specific fields to return
   * @param {string} [params.filter] - Filter criteria 
   * @param {string} [params.sort] - Sort criteria (e.g., "-operation_date" for most recent first)
   * @param {number} [params.page_size=100] - Number of results per page
   * @param {number} [params.page_number=1] - Page number to retrieve
   * @returns {Promise<Object>} Buyback operations data
   */
  async getBuybackOperations(params = {}) {
    return this.fetchData(`${this.buybacksEndpoint}/buybacks_operations`, params);
  }
  
  /**
   * Gets Treasury buyback security details
   * 
   * Retrieves details of Treasury securities for each buyback operation,
   * including CUSIP, security type, maturity date, and other related information.
   * 
   * @param {Object} params - Query parameters
   * @param {string|string[]} [params.fields] - Specific fields to return
   * @param {string} [params.filter] - Filter criteria 
   * @param {string} [params.sort] - Sort criteria
   * @param {number} [params.page_size=100] - Number of results per page
   * @param {number} [params.page_number=1] - Page number to retrieve
   * @returns {Promise<Object>} Security details data
   */
  async getBuybackSecurityDetails(params = {}) {
    return this.fetchData(`${this.buybacksEndpoint}/buybacks_security_details`, params);
  }
  
  /**
   * Gets the field names available in the buyback operations dataset
   * 
   * @returns {Promise<string[]>} List of available field names
   */
  async getOperationsFieldNames() {
    const data = await this.getBuybackOperations({
      page_size: 1
    });
    
    // If data is available, extract field names from the first record
    if (data && data.data && data.data.length > 0) {
      return Object.keys(data.data[0]);
    }
    
    return [];
  }
  
  /**
   * Gets buyback operations and their associated security details
   * 
   * Retrieves both buyback operations and their corresponding security details
   * in a single method call, joining the data for easier analysis.
   * 
   * @param {Object} params - Query parameters for operations
   * @param {number} [params.limit=10] - Limit the number of operations to retrieve
   * @returns {Promise<Object>} Operations with security details
   */
  async getBuybackOperationsWithDetails(params = {}) {
    const { limit = 10, ...operationsParams } = params;
    
    // First, get the buyback operations
    const operations = await this.getBuybackOperations({
      ...operationsParams,
      sort: operationsParams.sort || '-operation_date',
      page_size: limit
    });
    
    // If no operations found, return empty array
    if (!operations.data || operations.data.length === 0) {
      return { operations: [], detailsByOperation: {} };
    }
    
    // Determine which field to use as the operation identifier
    // First check if we have operation_id field
    const firstOp = operations.data[0];
    let idField = 'operation_id';
    
    if (!firstOp.operation_id) {
      // If operation_id is missing, use operation_date as the identifier
      idField = 'operation_date';
      console.log('Note: operation_id field not found, using operation_date as identifier');
    }
    
    // Extract operation identifiers
    const operationIds = operations.data.map(op => op[idField]);
    
    // Construct filter for security details
    // Use the appropriate field for filtering
    const operationIdsFilter = `${idField}:in:(${operationIds.join(',')})`;
    
    console.log(`Getting security details with filter: ${operationIdsFilter}`);
    
    // Get security details for these operations
    const securityDetails = await this.getBuybackSecurityDetails({
      filter: operationIdsFilter,
      page_size: 1000 // Get a large number to ensure we get all securities for the operations
    });
    
    // Group security details by operation ID
    const detailsByOperation = {};
    
    if (securityDetails.data && securityDetails.data.length > 0) {
      securityDetails.data.forEach(detail => {
        const opId = detail[idField];
        
        if (!detailsByOperation[opId]) {
          detailsByOperation[opId] = [];
        }
        
        detailsByOperation[opId].push(detail);
      });
    }
    
    // Return both operations and organized details
    return {
      operations: operations.data,
      detailsByOperation,
      idField // Include the field used for identification
    };
  }
  
  /**
   * Analyzes Treasury buyback statistics
   * 
   * Calculates summary statistics about Treasury buyback operations,
   * including total amount purchased, average prices, and operation frequency.
   * 
   * @param {Object} params - Analysis parameters
   * @param {string} [params.startDate] - Start date for analysis (YYYY-MM-DD)
   * @param {string} [params.endDate] - End date for analysis (YYYY-MM-DD)
   * @param {number} [params.limit=100] - Maximum number of operations to analyze
   * @returns {Promise<Object>} Buyback statistics
   */
  async analyzeBuybackStatistics(params = {}) {
    const { startDate, endDate, limit = 100 } = params;
    
    // Build filter for date range if provided
    let filter = '';
    if (startDate && endDate) {
      filter = `operation_date:gte:${startDate},operation_date:lte:${endDate}`;
    } else if (startDate) {
      filter = `operation_date:gte:${startDate}`;
    } else if (endDate) {
      filter = `operation_date:lte:${endDate}`;
    }
    
    // Get buyback operations with filter
    const operationsParams = {
      sort: '-operation_date',
      page_size: limit
    };
    
    if (filter) {
      operationsParams.filter = filter;
    }
    
    // Get operations with details
    const { operations, detailsByOperation, idField } = await this.getBuybackOperationsWithDetails({
      ...operationsParams,
      limit
    });
    
    // If no data, return empty stats
    if (!operations || operations.length === 0) {
      return {
        totalOperations: 0,
        totalAmountPurchased: 0,
        operationsByMonth: {},
        securityTypeBreakdown: {},
        averagePrices: {}
      };
    }
    
    // Initialize statistics
    let totalAmountPurchased = 0;
    const operationsByMonth = {};
    const securityTypeBreakdown = {};
    const pricesBySecurityType = {};
    
    // Process operations and details
    operations.forEach(operation => {
      // Extract operation month for grouping
      const opDate = new Date(operation.operation_date);
      const monthKey = `${opDate.getFullYear()}-${String(opDate.getMonth() + 1).padStart(2, '0')}`;
      
      // Count operations by month
      if (!operationsByMonth[monthKey]) {
        operationsByMonth[monthKey] = 0;
      }
      operationsByMonth[monthKey]++;
      
      // Get security details for this operation
      const opId = operation[idField];
      const details = detailsByOperation[opId] || [];
      
      // Process details
      details.forEach(detail => {
        // Determine which field contains the amount
        let amountAccepted = 0;
        if (detail.par_amount_accepted) {
          amountAccepted = parseFloat(detail.par_amount_accepted) || 0;
        } else if (detail.amount) {
          amountAccepted = parseFloat(detail.amount) || 0;
        } else if (detail.total_amount) {
          amountAccepted = parseFloat(detail.total_amount) || 0;
        }
        
        totalAmountPurchased += amountAccepted;
        
        // Determine security type field
        let secType = detail.security_type_desc;
        if (!secType && detail.security_type) {
          secType = detail.security_type;
        } else if (!secType) {
          secType = 'Unknown';
        }
        
        // Count by security type
        if (!securityTypeBreakdown[secType]) {
          securityTypeBreakdown[secType] = {
            count: 0,
            totalAmount: 0
          };
        }
        securityTypeBreakdown[secType].count++;
        securityTypeBreakdown[secType].totalAmount += amountAccepted;
        
        // Track prices by security type
        if (detail.price) {
          if (!pricesBySecurityType[secType]) {
            pricesBySecurityType[secType] = [];
          }
          pricesBySecurityType[secType].push(parseFloat(detail.price));
        }
      });
    });
    
    // Calculate average prices
    const averagePrices = {};
    Object.keys(pricesBySecurityType).forEach(secType => {
      const prices = pricesBySecurityType[secType];
      if (prices.length > 0) {
        const sum = prices.reduce((acc, price) => acc + price, 0);
        averagePrices[secType] = sum / prices.length;
      }
    });
    
    // Convert total security amounts to percentages
    Object.keys(securityTypeBreakdown).forEach(secType => {
      securityTypeBreakdown[secType].percentage = 
        totalAmountPurchased > 0 ? 
        (securityTypeBreakdown[secType].totalAmount / totalAmountPurchased) * 100 : 0;
    });
    
    // Return comprehensive statistics
    return {
      totalOperations: operations.length,
      totalAmountPurchased,
      operationsByMonth,
      securityTypeBreakdown,
      averagePrices,
      idFieldUsed: idField
    };
  }
}

// Test method for the Buybacks client
async function testTreasuryBuybacksClient() {
  const client = new TreasuryBuybacksClient();
  
  try {
    console.log('Fetching recent Treasury buyback operations...');
    const operations = await client.getBuybackOperations({
      sort: '-operation_date',
      page_size: 5
    });
    
    // Get available field names to understand the API structure
    console.log('\nAvailable field names in operations:');
    if (operations.data && operations.data.length > 0) {
      const fieldNames = Object.keys(operations.data[0]);
      console.log(fieldNames.join(', '));
    }
    
    console.log(`\nFound ${operations.data?.length || 0} recent buyback operations:`);
    if (operations.data && operations.data.length > 0) {
      operations.data.forEach((op, index) => {
        // Identify which fields might contain operation identifiers
        let opId = op.operation_id || op.id || op.operation_date;
        console.log(`${index + 1}. Date: ${op.operation_date}, Identifier: ${opId}`);
        
        // Print a few more fields to understand the data structure
        const additionalInfo = [];
        if (op.status) additionalInfo.push(`Status: ${op.status}`);
        if (op.announcement_date) additionalInfo.push(`Announced: ${op.announcement_date}`);
        if (op.settlement_date) additionalInfo.push(`Settlement: ${op.settlement_date}`);
        
        if (additionalInfo.length > 0) {
          console.log(`   ${additionalInfo.join(', ')}`);
        }
      });
      
      // Get field names for security details to understand the structure
      console.log('\nFetching sample security details to examine field structure...');
      const securityDetailsSample = await client.getBuybackSecurityDetails({
        page_size: 1
      });
      
      if (securityDetailsSample.data && securityDetailsSample.data.length > 0) {
        console.log('\nAvailable field names in security details:');
        const detailsFields = Object.keys(securityDetailsSample.data[0]);
        console.log(detailsFields.join(', '));
      }
      
      // Try using operation_date instead of operation_id for linking
      // Since the most recent operation is first, get its date
      const mostRecentOp = operations.data[0];
      const opDate = mostRecentOp.operation_date;
      console.log(`\nFetching security details for operation date: ${opDate}...`);
      
      const securityDetails = await client.getBuybackSecurityDetails({
        filter: `operation_date:eq:${opDate}`
      });
      
      console.log(`\nFound ${securityDetails.data?.length || 0} securities for this operation date.`);
      if (securityDetails.data && securityDetails.data.length > 0) {
        // Display a sample security
        const sample = securityDetails.data[0];
        console.log('\nSample security details:');
        Object.entries(sample).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      }
      
      // Try the updated getBuybackOperationsWithDetails method
      console.log('\nTesting the improved getBuybackOperationsWithDetails method...');
      const combinedData = await client.getBuybackOperationsWithDetails({
        limit: 2
      });
      
      console.log(`\nFound ${combinedData.operations.length} operations using ${combinedData.idField} as identifier`);
      
      // Display the breakdown of records by operation
      if (combinedData.detailsByOperation) {
        console.log('\nDetails by operation:');
        Object.entries(combinedData.detailsByOperation).forEach(([opId, details]) => {
          console.log(`  ${opId}: ${details.length} securities`);
        });
      }
      
      // Test the statistics method
      console.log('\nAnalyzing buyback statistics...');
      const stats = await client.analyzeBuybackStatistics({
        limit: 10
      });
      
      console.log('\nBuyback Statistics:');
      console.log(`- Total Operations: ${stats.totalOperations}`);
      console.log(`- Total Amount Purchased: $${(stats.totalAmountPurchased / 1e9).toFixed(2)} billion`);
      console.log(`- ID Field Used: ${stats.idFieldUsed}`);
      
      if (Object.keys(stats.securityTypeBreakdown).length > 0) {
        console.log('\nSecurity Type Breakdown:');
        Object.entries(stats.securityTypeBreakdown).forEach(([type, data]) => {
          console.log(`- ${type}: ${data.percentage.toFixed(2)}% ($${(data.totalAmount / 1e9).toFixed(2)} billion)`);
        });
      }
    }
    
    return {
      operations: operations.data,
      fieldNames: operations.data && operations.data.length > 0 ? Object.keys(operations.data[0]) : [],
      stats: await client.analyzeBuybackStatistics({ limit: 10 })
    };
  } catch (error) {
    console.error('Error in Treasury Buybacks client test:', error.message);
    throw error;
  }
}

// For Node.js/CommonJS environments
module.exports = {
  TreasuryBuybacksClient,
  testTreasuryBuybacksClient
};

// For ES modules, comment the line above and uncomment this:
// export { TreasuryBuybacksClient, testTreasuryBuybacksClient };
