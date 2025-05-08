/**
 * Exploratory script to test different BIS API path patterns
 */
const fs = require('fs');

async function exploreBisPaths() {
  // Base URL
  const baseUrl = 'https://stats.bis.org/api/v2';
  
  // Test different path patterns
  const paths = [
    // Data paths
    '/data/BIS/all',
    '/data/all/latest',
    '/data/BIS',
    '/data',
    
    // Specific dataset paths with different formats
    '/data/BIS/BIS/WS_EER/latest/all',
    '/data/BIS/WS_EER/latest/all',
    '/data/WS_EER/latest/all',
    '/data/WS_EER/all',
    '/data/WS_EER',
    
    // Try without 'latest' and 'all'
    '/data/BIS/BIS/WS_EER',
    
    // Alternative dataset IDs
    '/data/BIS/BIS/EER/latest/all',
    '/data/BIS/BIS/SPP/latest/all',
    
    // Other endpoints
    '/structure',
    '/structure/all',
    '/structure/dataflow/BIS/all/latest',
    '/dataflow/BIS/all/latest',
    
    // Check if there's API documentation
    '/',
    '/help',
    '/docs',
    
    // Try older API version
    '../api/v1/dataflow/BIS/all/latest',
    '../api/v1/data/BIS:WS_EER/Q/all'
  ];
  
  console.log('Exploring BIS API path patterns...');
  
  // Try each path
  for (const path of paths) {
    const url = baseUrl + path;
    console.log(`\nTrying: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          'User-Agent': 'BisApiExplorer/1.0'
        },
        timeout: 10000
      });
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log(`Content-Type: ${response.headers.get('content-type')}`);
      
      // Get text response
      const text = await response.text();
      console.log(`Response (first 100 chars): ${text.substring(0, 100)}...`);
      
      // Save successful responses
      if (response.ok) {
        const filename = `bis-path-${path.replace(/[\/:.]/g, '_')}.txt`;
        fs.writeFileSync(filename, text);
        console.log(`Saved to ${filename}`);
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
  }
  
  // Try the BIS web services page to look for clues
  console.log('\nChecking BIS web services page...');
  try {
    const response = await fetch('https://stats.bis.org/statsweb/rest/README.html');
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    if (response.ok) {
      const text = await response.text();
      fs.writeFileSync('bis-readme.html', text);
      console.log('Saved BIS README to bis-readme.html');
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
  
  console.log('\nExploration completed.');
}

exploreBisPaths();
