const fs = require('fs');
const { execSync } = require('child_process');

try {
  // Find the config file
  console.log("Looking for CONFIG file...");
  const configFile = execSync('find . -name "*.ts" -exec grep -l "export const CONFIG" {} \\; | head -n 1', {
    encoding: 'utf8'
  }).trim();
  console.log(`Found config at: ${configFile}`);

  // Read the config file
  console.log("Reading CONFIG file...");
  const content = fs.readFileSync(configFile, 'utf8');

  // Extract CONFIG object
  console.log("Extracting CONFIG object...");
  const match = content.match(/export const CONFIG\s*=\s*({[\s\S]*?});/);
  if (!match) {
    console.error("Could not find CONFIG object in file");
    process.exit(1);
  }

  // Parse CONFIG
  console.log("Parsing CONFIG...");
  const configStr = match[1].replace(/(\w+):/g, '"$1":');
  const CONFIG = eval(`(${configStr})`);

  // Check if we have necessary API keys and endpoints
  console.log("\nBasic Configuration Check");
  console.log("------------------------");
  
  // Check API_KEYS
  console.log("\nAPI Keys:");
  const apiKeys = CONFIG.API_KEYS || {};
  console.log("- FRED:", apiKeys.FRED ? "✓" : "✗");
  console.log("- BEA:", apiKeys.BEA ? "✓" : "✗");
  console.log("- BLS:", apiKeys.BLS ? "✓" : "✗");
  console.log("- CENSUS:", apiKeys.CENSUS ? "✓" : "✗");
  
  // Check API_ENDPOINTS
  console.log("\nAPI Endpoints:");
  const apiEndpoints = CONFIG.API_ENDPOINTS || {};
  console.log("- FRED:", apiEndpoints.FRED ? "✓" : "✗");
  console.log("- BEA:", apiEndpoints.BEA ? "✓" : "✗");
  console.log("- BLS:", apiEndpoints.BLS ? "✓" : "✗");
  console.log("- CENSUS:", apiEndpoints.CENSUS ? "✓" : "✗");
  console.log("- ECB:", apiEndpoints.ECB ? "✓" : "✗");
  console.log("- BIS:", apiEndpoints.BIS ? "✓" : "✗");
  console.log("- TREASURY_RATES:", apiEndpoints.TREASURY_RATES ? "✓" : "✗");
  console.log("- TREASURY_AUCTIONS:", apiEndpoints.TREASURY_AUCTIONS ? "✓" : "✗");
  console.log("- TREASURY_RECORD_AUCTIONS:", apiEndpoints.TREASURY_RECORD_AUCTIONS ? "✓" : "✗");
  console.log("- TREASURY_DIRECT_SECURITIES:", apiEndpoints.TREASURY_DIRECT_SECURITIES ? "✓" : "✗");
  console.log("- TREASURY_BUYBACKS:", apiEndpoints.TREASURY_BUYBACKS ? "✓" : "✗");
  
  // Check DEFAULT_SETTINGS
  console.log("\nDefault Settings:");
  console.log("- DATE_RANGE:", CONFIG.DEFAULT_SETTINGS?.DATE_RANGE ? "✓" : "✗");
  
  // Check SIGNAL_METRICS
  console.log("\nSignal Metrics:");
  console.log("- TECHNICAL:", CONFIG.SIGNAL_METRICS?.TECHNICAL ? "✓" : "✗");
  console.log("- ECONOMIC:", CONFIG.SIGNAL_METRICS?.ECONOMIC ? "✓" : "✗");
  
  // Check FINANCIAL_CRISES
  console.log("\nFinancial Crises:");
  console.log("- Defined:", CONFIG.FINANCIAL_CRISES ? "✓" : "✗");
  
  console.log("\nConfiguration check complete!");
  
} catch (error) {
  console.error("Error:", error.message);
}
