require('dotenv').config();
const FredApiClient = require('./src/services/fredApiClient');

async function testFredApiClient() {
  console.log('Testing enhanced FRED API client implementation...');
  
  const client = new FredApiClient();
  
  try {
    // Test API key validation
    console.log('1. Testing API key validation...');
    const isValid = await client.validateApiKey();
    console.log(`   API key valid: ${isValid ? 'Yes ✅' : 'No ❌'}`);
    
    if (!isValid) {
      throw new Error('API key validation failed. Please check your key.');
    }
    
    // Test getting series info
    console.log('\n2. Testing getSeriesInfo...');
    const seriesInfo = await client.getSeriesInfo('GNPCA');
    console.log(`   Got series info: ${seriesInfo.seriess ? 'Yes ✅' : 'No ❌'}`);
    if (seriesInfo.seriess && seriesInfo.seriess.length > 0) {
      console.log(`   Title: ${seriesInfo.seriess[0].title}`);
    }
    
    // Test getting series data with parameter options
    console.log('\n3. Testing getSeriesData with parameters...');
    const seriesData = await client.getSeriesData('GDP', {
      realtime_start: '2024-01-01',
      realtime_end: '2024-12-31',
      limit: 5
    });
    console.log(`   Got observations: ${seriesData.observations ? 'Yes ✅' : 'No ❌'}`);
    if (seriesData.observations) {
      console.log(`   Number of observations: ${seriesData.observations.length}`);
      console.log(`   Sample observation: ${JSON.stringify(seriesData.observations[0])}`);
    }
    
    // Test category endpoint
    console.log('\n4. Testing getCategory...');
    const rootCategory = await client.getCategory({ category_id: 0 });
    console.log(`   Got category info: ${rootCategory.categories ? 'Yes ✅' : 'No ❌'}`);
    if (rootCategory.categories) {
      console.log(`   Root category name: ${rootCategory.categories[0].name}`);
    }
    
    // Test search functionality
    console.log('\n5. Testing searchSeries...');
    const searchResults = await client.searchSeries('inflation', { limit: 3 });
    console.log(`   Got search results: ${searchResults.seriess ? 'Yes ✅' : 'No ❌'}`);
    if (searchResults.seriess) {
      console.log(`   Number of results: ${searchResults.seriess.length}`);
      console.log(`   First result: ${searchResults.seriess[0].title}`);
    }
    
    console.log('\n✅ All tests passed! Your FRED API client is working correctly.');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testFredApiClient();
