/**
 * BIS Data Analyzer
 * 
 * This example demonstrates how to use the BisStatsClient to analyze
 * and visualize data from the Bank for International Settlements.
 */

const { BisStatsClient } = require('../src/services/bis-stats-client');

/**
 * Main function to analyze BIS statistical data
 */
async function analyzeBisData() {
  console.log('BIS Statistical Data Analysis');
  console.log('============================\n');
  
  const client = new BisStatsClient({
    enableCaching: true
  });
  
  try {
    // 1. Get available datasets
    console.log('Fetching available BIS datasets...');
    const dataflows = await client.getAllDataflows();
    
    if (!dataflows.data || !dataflows.data.dataflows) {
      console.log('No datasets found.');
      return;
    }
    
    const datasets = dataflows.data.dataflows.map(flow => ({
      id: flow.id,
      name: flow.name,
      agency: flow.agencyID
    }));
    
    console.log(`\nFound ${datasets.length} datasets.\n`);
    console.log('Available datasets:');
    datasets.slice(0, 15).forEach((dataset, index) => {
      console.log(`${index + 1}. ${dataset.id}: ${dataset.name}`);
    });
    
    if (datasets.length > 15) {
      console.log(`... and ${datasets.length - 15} more`);
    }
    
    // 2. Analyze a specific dataset (e.g., LBS - Locational Banking Statistics)
    const targetDataset = datasets.find(d => d.id === 'LBS') || datasets[0];
    
    console.log(`\n\nAnalyzing dataset: ${targetDataset.id} (${targetDataset.name})`);
    console.log('--------------------------------------------------');
    
    // 3. Get dataset structure
    console.log('\nFetching dataset structure...');
    const structure = await client.getDatasetStructure(targetDataset.id);
    
    // Extract dimensions and attributes
    const dimensions = [];
    const attributes = [];
    
    if (structure?.data?.dataStructures?.[0]?.dataStructureComponents) {
      const components = structure.data.dataStructures[0].dataStructureComponents;
      
      if (components.dimensionList?.dimensions) {
        dimensions.push(...components.dimensionList.dimensions.map(dim => ({
          id: dim.id,
          name: dim.name,
          position: dim.position,
          codelistId: dim.localRepresentation?.enumeration?.id
        })));
      }
      
      if (components.attributeList?.attributes) {
        attributes.push(...components.attributeList.attributes.map(attr => ({
          id: attr.id,
          name: attr.name,
          attachmentLevel: attr.attributeRelationship?.attachmentGroup || 'unknown'
        })));
      }
    }
    
    console.log(`\nDimensions (${dimensions.length}):`);
    dimensions.forEach((dim, index) => {
      console.log(`${index + 1}. ${dim.id}: ${dim.name} (position: ${dim.position}, codelist: ${dim.codelistId || 'N/A'})`);
    });
    
    console.log(`\nAttributes (${attributes.length}):`);
    attributes.slice(0, 5).forEach((attr, index) => {
      console.log(`${index + 1}. ${attr.id}: ${attr.name} (${attr.attachmentLevel})`);
    });
    
    if (attributes.length > 5) {
      console.log(`... and ${attributes.length - 5} more`);
    }
    
    // 4. Get codes for a key dimension
    const keyDimension = dimensions.find(d => d.position === 1) || dimensions[0];
    if (keyDimension && keyDimension.codelistId) {
      console.log(`\nGetting codes for dimension: ${keyDimension.id} (${keyDimension.name})`);
      
      try {
        // Extract codelist ID from reference
        const codelistId = keyDimension.codelistId.split(':').pop();
        const codelist = await client.getCodelist('BIS', codelistId);
        
        if (codelist?.data?.codelists?.[0]?.codes) {
          const codes = codelist.data.codelists[0].codes;
          
          console.log(`\nCodes for ${keyDimension.id} (${codes.length} total):`);
          codes.slice(0, 10).forEach((code, index) => {
            console.log(`${index + 1}. ${code.id}: ${code.name}`);
          });
          
          if (codes.length > 10) {
            console.log(`... and ${codes.length - 10} more`);
          }
          
          // 5. Fetch sample data for a few codes
          if (codes.length > 0) {
            const sampleCode = codes[0].id;
            console.log(`\n\nFetching sample data for ${keyDimension.id}=${sampleCode}...`);
            
            // Prepare key with wildcards for other dimensions
            const key = dimensions.map((dim, i) => 
              dim.id === keyDimension.id ? sampleCode : '.'
            ).join(':');
            
            try {
              const sampleData = await client.getData(`BIS:${targetDataset.id}`, key, {
                detail: 'full',
                lastNObservations: 10
              });
              
              // Process data
              const formattedData = client.extractTimeSeriesData(sampleData);
              
              console.log(`\nRetrieved ${formattedData.series.length} time series`);
              
              if (formattedData.series.length > 0) {
                // Display first time series
                const firstSeries = formattedData.series[0];
                
                console.log('\nSeries dimensions:');
                Object.entries(firstSeries.dimensions).forEach(([dimId, value]) => {
                  console.log(`- ${dimId}: ${value.name} (${value.id})`);
                });
                
                if (firstSeries.observations.length > 0) {
                  console.log('\nObservations:');
                  firstSeries.observations.slice(0, 10).forEach(obs => {
                    console.log(`- ${obs.period}: ${obs.value}`);
                  });
                  
                  // Basic time series analysis
                  const values = firstSeries.observations.map(obs => obs.value);
                  const stats = calculateStatistics(values);
                  
                  console.log('\nBasic statistics:');
                  console.log(`- Count: ${stats.count}`);
                  console.log(`- Min: ${stats.min}`);
                  console.log(`- Max: ${stats.max}`);
                  console.log(`- Mean: ${stats.mean}`);
                  console.log(`- Standard Deviation: ${stats.stdDev}`);
                  
                  // Calculate growth rates if applicable
                  if (firstSeries.observations.length > 1) {
                    const periodicity = determinePeriodicity(firstSeries.observations);
                    const changes = calculateChanges(firstSeries.observations);
                    
                    console.log(`\nPeriodicity: ${periodicity}`);
                    console.log('\nPeriod-to-period changes:');
                    changes.slice(0, 5).forEach(change => {
                      console.log(`- ${change.fromPeriod} to ${change.toPeriod}: ${change.absoluteChange.toFixed(2)} (${change.percentChange.toFixed(2)}%)`);
                    });
                  }
                } else {
                  console.log('No observations found in this series');
                }
              }
            } catch (dataError) {
              console.log(`Error fetching sample data: ${dataError.message}`);
            }
          }
        } else {
          console.log('No codes found for this dimension');
        }
      } catch (codelistError) {
        console.log(`Error retrieving codelist: ${codelistError.message}`);
      }
    }
    
    console.log('\nAnalysis completed.');
    
  } catch (error) {
    console.error('Error analyzing BIS data:', error);
  }
}

/**
 * Calculate basic statistics for a set of values
 */
function calculateStatistics(values) {
  if (!values || values.length === 0) {
    return { count: 0, min: null, max: null, mean: null, stdDev: null };
  }
  
  const count = values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const sum = values.reduce((total, val) => total + val, 0);
  const mean = sum / count;
  
  // Calculate standard deviation
  const sumSquaredDiff = values.reduce((total, val) => {
    const diff = val - mean;
    return total + (diff * diff);
  }, 0);
  const stdDev = Math.sqrt(sumSquaredDiff / count);
  
  return { count, min, max, mean, stdDev };
}

/**
 * Determine the periodicity of a time series
 */
function determinePeriodicity(observations) {
  // This is a simplified approach
  // In reality, more sophisticated analysis would be needed
  if (observations.length < 2) return 'Unknown';
  
  const periods = observations.map(obs => obs.period);
  
  // Check if periods are in date format
  if (periods[0].match(/\d{4}-\d{2}/)) {
    return 'Monthly';
  } else if (periods[0].match(/\d{4}-Q\d/)) {
    return 'Quarterly';
  } else if (periods[0].match(/\d{4}/)) {
    return 'Annual';
  }
  
  return 'Unknown';
}

/**
 * Calculate period-to-period changes
 */
function calculateChanges(observations) {
  if (observations.length < 2) return [];
  
  const changes = [];
  
  for (let i = 1; i < observations.length; i++) {
    const fromValue = observations[i-1].value;
    const toValue = observations[i].value;
    const absoluteChange = toValue - fromValue;
    const percentChange = fromValue !== 0 ? (absoluteChange / Math.abs(fromValue)) * 100 : 0;
    
    changes.push({
      fromPeriod: observations[i-1].period,
      toPeriod: observations[i].period,
      fromValue,
      toValue,
      absoluteChange,
      percentChange
    });
  }
  
  return changes;
}

// Run the analysis if this script is executed directly
if (require.main === module) {
  analyzeBisData()
    .then(() => {
      console.log('\nExiting...');
    })
    .catch(error => {
      console.error('Failed to analyze BIS data:', error);
      process.exit(1);
    });
}

module.exports = {
  analyzeBisData
};
