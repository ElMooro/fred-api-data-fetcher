/**
 * Debug script for BIS SDMX RESTful API client
 */
const { BisStatsClient } = require('./src/services/bis-stats-client');

async function debugBisApi() {
  const client = new BisStatsClient();
  
  try {
    // Test dataflows endpoint
    console.log('Fetching available dataflows...');
    const dataflowsResponse = await client.getAllDataflows();
    
    console.log('Dataflows request success:', dataflowsResponse.success);
    console.log('Dataflows status code:', dataflowsResponse.status);
    console.log('Raw dataflows response (first 500 chars):', 
      dataflowsResponse.data ? dataflowsResponse.data.substring(0, 500) : 'No data');
    
    // Test specific dataflow
    console.log('\nTrying specific dataflow (CBS)...');
    const specificDataflow = await client.getDataflow('CBS');
    console.log('Specific dataflow request success:', specificDataflow.success);
    console.log('Specific dataflow status code:', specificDataflow.status);
    console.log('Raw specific dataflow response (first 500 chars):', 
      specificDataflow.data ? specificDataflow.data.substring(0, 500) : 'No data');
    
    // Test a data endpoint
    console.log('\nTrying data endpoint (CBS/A)...');
    const dataResult = await client.getData('CBS', 'A', {});
    console.log('Data endpoint request success:', dataResult.success);
    console.log('Data endpoint status code:', dataResult.status);
    console.log('Raw data response (first 500 chars):', 
      dataResult.data ? dataResult.data.substring(0, 500) : 'No data');
    
    // Test codelist endpoint (which seemed to work)
    console.log('\nTrying codelist endpoint (CL_FREQ)...');
    const codelistResult = await client.getCodelist('CL_FREQ');
    console.log('Codelist request success:', codelistResult.success);
    console.log('Codelist status code:', codelistResult.status);
    console.log('Raw codelist response (first 500 chars):', 
      codelistResult.data ? codelistResult.data.substring(0, 500) : 'No data');
    
    // Test XML parsing
    if (dataflowsResponse.data) {
      console.log('\nChecking dataflow regex pattern...');
      const dataflowRegex = /<str:Dataflow[^>]*id="([^"]*)"[^>]*agencyID="([^"]*)"[^>]*version="([^"]*)"[^>]*>/g;
      const matches = [...dataflowsResponse.data.matchAll(dataflowRegex)];
      console.log('Regex matches found:', matches.length);
      
      // Try alternative patterns
      console.log('\nTrying alternative regex patterns...');
      const altPatterns = [
        /<Dataflow[^>]*id="([^"]*)"[^>]*agencyID="([^"]*)"[^>]*version="([^"]*)"[^>]*>/g,
        /<structure:Dataflow[^>]*id="([^"]*)"[^>]*agencyID="([^"]*)"[^>]*version="([^"]*)"[^>]*>/g,
        /<(\\w+:)?Dataflow[^>]*id="([^"]*)"[^>]*>/g
      ];
      
      for (let i = 0; i < altPatterns.length; i++) {
        const altMatches = [...dataflowsResponse.data.matchAll(altPatterns[i])];
        console.log(`Alternative pattern ${i+1} matches:`, altMatches.length);
        if (altMatches.length > 0) {
          console.log('First match:', altMatches[0]);
        }
      }
    }
    
  } catch (error) {
    console.error('Error in debug:', error);
  }
}

debugBisApi();
