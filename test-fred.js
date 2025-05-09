const axios = require("axios");
const fs = require("fs");
const { execSync } = require("child_process");

// Find config file
const configFile = execSync("find . -name \"*.ts\" -exec grep -l \"export const CONFIG\" {} \\; | head -n 1", {
  encoding: "utf8"
}).trim();

// Extract CONFIG
const content = fs.readFileSync(configFile, "utf8");
const match = content.match(/export const CONFIG\\s*=\\s*({[\\s\\S]*?});/);
const configStr = match[1].replace(/(\\w+):/g, "\"$1\":");
const CONFIG = eval(`(${configStr})`);

console.log("Testing FRED API...");
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
});
