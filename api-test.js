const axios = require("axios");
const fs = require("fs");
const { execSync } = require("child_process");

// Find config file
console.log("Looking for CONFIG file...");
const configFile = execSync("find . -name \"*.ts\" -exec grep -l \"export const CONFIG\" {} \\; | head -n 1", {
  encoding: "utf8"
}).trim();
console.log(`Found config at: ${configFile}`);

// Read config file
console.log("Reading CONFIG file...");
const content = fs.readFileSync(configFile, "utf8");

// Extract CONFIG object
console.log("Extracting CONFIG object...");
const match = content.match(/export const CONFIG\s*=\s*({[\s\S]*?});/);
if (!match) {
  console.error("Could not find CONFIG object in file");
  process.exit(1);
}

// Parse CONFIG 
console.log("Parsing CONFIG...");
const configStr = match[1].replace(/(\w+):/g, "\"$1\":");
const CONFIG = eval(`(${configStr})`);

// Print API keys
console.log("\nAPI Keys:");
console.log("FRED:", CONFIG.API_KEYS?.FRED ? "✓ Present" : "✗ Missing");
console.log("BEA:", CONFIG.API_KEYS?.BEA ? "✓ Present" : "✗ Missing");
console.log("BLS:", CONFIG.API_KEYS?.BLS ? "✓ Present" : "✗ Missing");
console.log("CENSUS:", CONFIG.API_KEYS?.CENSUS ? "✓ Present" : "✗ Missing");

// Print API endpoints
console.log("\nAPI Endpoints:");
console.log("FRED:", CONFIG.API_ENDPOINTS?.FRED ? "✓ Present" : "✗ Missing");
console.log("BEA:", CONFIG.API_ENDPOINTS?.BEA ? "✓ Present" : "✗ Missing");
console.log("BLS:", CONFIG.API_ENDPOINTS?.BLS ? "✓ Present" : "✗ Missing");
console.log("CENSUS:", CONFIG.API_ENDPOINTS?.CENSUS ? "✓ Present" : "✗ Missing");
console.log("ECB:", CONFIG.API_ENDPOINTS?.ECB ? "✓ Present" : "✗ Missing");
console.log("BIS:", CONFIG.API_ENDPOINTS?.BIS ? "✓ Present" : "✗ Missing");
console.log("TREASURY_RATES:", CONFIG.API_ENDPOINTS?.TREASURY_RATES ? "✓ Present" : "✗ Missing");
console.log("TREASURY_AUCTIONS:", CONFIG.API_ENDPOINTS?.TREASURY_AUCTIONS ? "✓ Present" : "✗ Missing");
console.log("TREASURY_RECORD_AUCTIONS:", CONFIG.API_ENDPOINTS?.TREASURY_RECORD_AUCTIONS ? "✓ Present" : "✗ Missing");
console.log("TREASURY_DIRECT_SECURITIES:", CONFIG.API_ENDPOINTS?.TREASURY_DIRECT_SECURITIES ? "✓ Present" : "✗ Missing");
console.log("TREASURY_BUYBACKS:", CONFIG.API_ENDPOINTS?.TREASURY_BUYBACKS ? "✓ Present" : "✗ Missing");

// Test FRED API
console.log("\nTesting FRED API...");
axios.get(CONFIG.API_ENDPOINTS.FRED, {
  params: {
    series_id: "GDP",
    api_key: CONFIG.API_KEYS.FRED,
    file_type: "json",
    observation_start: "2020-01-01",
    observation_end: "2022-01-01"
  }
})
.then(response => {
  console.log("✅ FRED API test successful!");
  console.log(`   Retrieved ${response.data.observations?.length || 0} observations`);
})
.catch(error => {
  console.error("❌ FRED API test failed:", error.message);
  if (error.response) {
    console.error("  Status:", error.response.status);
    console.error("  Data:", JSON.stringify(error.response.data, null, 2));
  }
});
