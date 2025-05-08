/**
 * Debug script for BIS SDMX RESTful API client v2
 */
const fs = require('fs');
const { BisStatsClientV2 } = require('./src/services/bis-stats-client-v2');

async function debugBisApiV2() {
  const client = new BisStatsClientV2();
  
  try {
    console.log('Debugging BIS SDMX RESTful API v2...');
    
    // Test dataflows and save full response
    console.log('\nFetching available dataflows...');
    const dataflowsResponse = await client.getDataflows();
    
    console.log('Dataflows request success:', dataflowsResponse.success);
    console.log('Dataflows status code:', dataflowsResponse.status);
    
    if (dataflowsResponse.success) {
      // Save complete response to file for inspection
      fs.writeFileSync('./dataflows-response.xml', dataflowsResponse.data);
      console.log('Saved complete dataflows response to dataflows-response.xml');
      
      // Look for different dataflow tag patterns
      console.log('\nAnalyzing dataflows XML structure...');
      const patterns = [
        { name: 'Standard format', regex: /<str:Dataflow[^>]*id="([^"]*)"[^>]*>/g },
        { name: 'Alternative namespace', regex: /<structure:Dataflow[^>]*id="([^"]*)"[^>]*>/g },
        { name: 'No namespace', regex: /<Dataflow[^>]*id="([^"]*)"[^>]*>/g },
        { name: 'Any namespace', regex: /<[^:]*:Dataflow[^>]*id="([^"]*)"[^>]*>/g },
        { name: 'Any tag with id', regex: /<[^>]*id="([^"]*)"[^>]*>/g }
      ];
      
      for (const pattern of patterns) {
        const matches = [...dataflowsResponse.data.matchAll(pattern.regex)];
        console.log(`${pattern.name}: ${matches.length} matches`);
        
        if (matches.length > 0) {
          console.log('First few matches:');
          matches.slice(0, 3).forEach(match => {
            console.log(`- ID: ${match[1]}, Full match: ${match[0].substring(0, 100)}...`);
          });
        }
      }
      
      // Look for structure definitions
      console.log('\nChecking for structure references...');
      const structureRefPattern = /<[^>]*structureRef="([^"]*)"[^>]*>/g;
      const structureMatches = [...dataflowsResponse.data.matchAll(structureRefPattern)];
      
      console.log(`Found ${structureMatches.length} structure references`);
      if (structureMatches.length > 0) {
        console.log('Structure references:');
        new Set(structureMatches.map(match => match[1])).forEach(ref => {
          console.log(`- ${ref}`);
        });
      }
    }
    
    // Test structure queries
    console.log('\nTrying direct structure query...');
    const structureResponse = await client.getStructure('datastructure', 'BIS', 'all', 'latest');
    
    console.log('Structure request success:', structureResponse.success);
    console.log('Structure status code:', structureResponse.status);
    
    if (structureResponse.success) {
      fs.writeFileSync('./structure-response.xml', structureResponse.data);
      console.log('Saved complete structure response to structure-response.xml');
      
      // Look for data structure definitions
      console.log('\nChecking for data structure definitions...');
      const dsdPattern = /<[^:]*:DataStructure[^>]*id="([^"]*)"[^>]*>/g;
      const dsdMatches = [...structureResponse.data.matchAll(dsdPattern)];
      
      console.log(`Found ${dsdMatches.length} data structure definitions`);
      if (dsdMatches.length > 0) {
        console.log('Data structures:');
        dsdMatches.slice(0, 10).forEach(match => {
          console.log(`- ${match[1]}`);
        });
      }
    }
    
    // Check available datasets
    console.log('\nQuerying for available datasets...');
    const availableDatasets = [];
    
    // Test common BIS dataset IDs
    const testDatasetIds = ['CBS', 'LBS', 'DSRP', 'DEBT_SEC', 'ICSS', 'DSS', 'EERI', 'CPMI'];
    
    for (const id of testDatasetIds) {
      console.log(`Testing dataset ID: ${id}`);
      const dataResponse = await client.getBisData(id);
      console.log(`- Success: ${dataResponse.success}, Status: ${dataResponse.status}`);
      
      if (dataResponse.success) {
        availableDatasets.push(id);
        
        // Save first successful response
        if (availableDatasets.length === 1) {
          fs.writeFileSync('./data-response.xml', dataResponse.data);
          console.log(`Saved response for ${id} to data-response.xml`);
        }
      }
    }
    
    console.log('\nAvailable datasets:', availableDatasets);
    
  } catch (error) {
    console.error('Error in BIS Stats v2 debug:', error.message);
  }
}

debugBisApiV2();
