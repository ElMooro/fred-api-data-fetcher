/**
 * Minimal Treasury Record-Setting Auction Client
 * 
 * A bare-bones client for accessing the Record-Setting Treasury Securities Auction Data API.
 * This implementation makes a direct request with no query parameters.
 * 
 * @version 1.0.0
 */

/**
 * Execute a request to the Record-Setting Auction API with no query parameters
 */
async function testRecordAuctionAPI() {
  console.log('Testing Record-Setting Auction API with various approaches...');
  
  // Try different variations of the API URL to identify what works
  const baseUrl = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service';
  const endpoints = [
    // Try v2 endpoint with no parameters
    `${baseUrl}/v2/accounting/od/record_setting_auction`,
    
    // Try v1 endpoint with no parameters
    `${baseUrl}/v1/accounting/od/record_setting_auction`,
    
    // Try with an alternate endpoint name
    `${baseUrl}/v2/accounting/od/record-setting-auction`,
    
    // Try with only format parameter
    `${baseUrl}/v2/accounting/od/record_setting_auction?format=json`,
    
    // Try with different path structure
    `${baseUrl}/v2/accounting/od/auctions/record_setting`
  ];
  
  // Attempt to access each potential endpoint
  const results = {};
  
  for (const url of endpoints) {
    console.log(`\nAttempting request to: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`Error (${response.status}): ${errorText.slice(0, 200)}...`);
        results[url] = { success: false, status: response.status, error: errorText };
      } else {
        const data = await response.json();
        console.log('Success! Received data.');
        console.log(`Records returned: ${data.data?.length || 0}`);
        
        if (data.data && data.data.length > 0) {
          console.log('First record fields:', Object.keys(data.data[0]).join(', '));
        }
        
        results[url] = { success: true, status: response.status, data };
        
        // Once we find a working endpoint, try a few variations of query parameters
        if (data.data && data.data.length > 0) {
          await testQueryParameters(url);
        }
      }
    } catch (error) {
      console.log(`Request failed: ${error.message}`);
      results[url] = { success: false, error: error.message };
    }
  }
  
  // Check Fiscal Data API documentation endpoint
  try {
    console.log('\nChecking Fiscal Data API dataset catalog...');
    const catalogUrl = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/data/catalog';
    
    const response = await fetch(catalogUrl);
    if (response.ok) {
      const catalog = await response.json();
      console.log(`Found ${catalog.data?.length || 0} datasets in the catalog.`);
      
      // Search for record setting auction in the dataset titles
      const matchingDatasets = catalog.data?.filter(dataset => 
        dataset.dataset_title?.toLowerCase().includes('record') ||
        dataset.dataset_title?.toLowerCase().includes('auction')
      );
      
      if (matchingDatasets && matchingDatasets.length > 0) {
        console.log('\nPotentially relevant datasets:');
        matchingDatasets.forEach(dataset => {
          console.log(`- ${dataset.dataset_title}: ${dataset.dataset_path}`);
        });
      }
    }
  } catch (catalogError) {
    console.log('Could not fetch API catalog:', catalogError.message);
  }
  
  return results;
}

/**
 * Test various query parameter combinations to find what works
 */
async function testQueryParameters(baseUrl) {
  console.log('\nTesting query parameters on working endpoint...');
  
  const paramSets = [
    // Try with only page size
    '?page[size]=5',
    
    // Try with sort but not on auction_date
    '?sort=security_type',
    
    // Try different way to format page params
    '?page_size=5&page_number=1',
    
    // Try explicit fields that don't include auction_date
    '?fields=security_type,record_type',
    
    // Try the simplest page size param
    '?pagesize=5'
  ];
  
  for (const params of paramSets) {
    const url = `${baseUrl}${params}`;
    console.log(`\nTrying: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`Error (${response.status}): ${errorText.slice(0, 200)}...`);
      } else {
        const data = await response.json();
        console.log('Success! Parameter combination works.');
        console.log(`Records returned: ${data.data?.length || 0}`);
      }
    } catch (error) {
      console.log(`Request failed: ${error.message}`);
    }
  }
}

// Export test function
module.exports = {
  testRecordAuctionAPI
};
