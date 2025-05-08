require('dotenv').config();
const fs = require('fs');

// Read current .env file
const envFile = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '';
const lines = envFile.split('\n');
const newLines = [];

// Find and fix the API key line
let foundApiKey = false;
for (const line of lines) {
  if (line.startsWith('FRED_API_KEY=')) {
    foundApiKey = true;
    // Get the existing key, trim any whitespace
    let apiKey = line.substring('FRED_API_KEY='.length).trim();
    // Remove any quotes
    if ((apiKey.startsWith('"') && apiKey.endsWith('"')) || 
        (apiKey.startsWith("'") && apiKey.endsWith("'"))) {
      apiKey = apiKey.substring(1, apiKey.length - 1);
    }
    console.log('Current API key value:', apiKey);
    console.log('API key length:', apiKey.length);
    console.log('API key format check:', /^[a-z0-9]{32}$/.test(apiKey));
    
    // Keep the existing key but ensure proper format (no quotes)
    newLines.push();
  } else {
    newLines.push(line);
  }
}

// If API key wasn't found, prompt to add it
if (!foundApiKey) {
  console.log('FRED_API_KEY not found in .env file');
}

// Write back fixed .env file
fs.writeFileSync('.env', newLines.join('\n'));
console.log('.env file updated');

// Modify check-fred-api-health.js to log more details
const healthScriptPath = 'check-fred-api-health.js';
if (fs.existsSync(healthScriptPath)) {
  let healthScript = fs.readFileSync(healthScriptPath, 'utf8');
  
  // Add more logging to debug
  if (!healthScript.includes('console.log("Using API key:")) {
    healthScript = healthScript.replace(
      'Validating API key...',
      'Validating API key...\nconsole.log("Using API key:", apiKey.substring(0, 4) + "..." + apiKey.substring(apiKey.length - 4));'
    );
    fs.writeFileSync(healthScriptPath, healthScript);
    console.log('Updated health check script with additional logging');
  }
}
