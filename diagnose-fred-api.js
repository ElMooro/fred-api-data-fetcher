#!/usr/bin/env node

/**
 * FRED API Diagnostics Tool
 * 
 * This script performs a comprehensive diagnosis of your FRED API
 * connection and configuration.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// FRED API key from earlier message
const apiKey = '2f057499936072679d8843d7fce99989';

// Check for dotenv file
console.log('🔍 Checking .env file...');
let envFileExists = false;
let envFileContents = '';

try {
  envFileContents = fs.readFileSync('.env', 'utf8');
  envFileExists = true;
  console.log('✅ .env file found');
} catch (err) {
  console.log('❌ .env file not found');
}

// Check if API key is in .env file
let apiKeyInEnvFile = false;
if (envFileExists) {
  if (envFileContents.includes('FRED_API_KEY')) {
    apiKeyInEnvFile = true;
    console.log('✅ FRED_API_KEY found in .env file');
    
    // Check if it's the correct key
    const envKeyMatch = envFileContents.match(/FRED_API_KEY=([^\r\n]+)/);
    if (envKeyMatch && envKeyMatch[1] === apiKey) {
      console.log('✅ FRED_API_KEY in .env file matches expected key');
    } else {
      console.log('❌ FRED_API_KEY in .env file DOES NOT match expected key');
      console.log(`   Expected: ${apiKey}`);
      if (envKeyMatch) console.log(`   Found: ${envKeyMatch[1]}`);
    }
  } else {
    console.log('❌ FRED_API_KEY not found in .env file');
  }
}

// Create or update .env file
console.log('\n📝 Updating .env file...');
try {
  const updatedEnvContent = envFileExists 
    ? envFileContents.replace(/FRED_API_KEY=([^\r\n]+)/, `FRED_API_KEY=${apiKey}`) 
    : `FRED_API_KEY=${apiKey}\nAPI_TIMEOUT=30000\nRETRY_ATTEMPTS=3\n`;
  
  fs.writeFileSync('.env', updatedEnvContent);
  console.log('✅ .env file updated successfully');
} catch (err) {
  console.error('❌ Failed to update .env file:', err.message);
}

// Check for fredApiClient.js
console.log('\n🔍 Looking for fredApiClient.js...');
const possiblePaths = [
  './src/services/fredApiClient.js',
  './src/utils/fredApiClient.js',
  './services/fredApiClient.js',
  './utils/fredApiClient.js',
  './fredApiClient.js'
];

let apiClientPath = null;
let apiClientContent = null;

for (const p of possiblePaths) {
  try {
    apiClientContent = fs.readFileSync(p, 'utf8');
    apiClientPath = p;
    console.log(`✅ Found fredApiClient.js at ${p}`);
    break;
  } catch (err) {
    // File not found at this location, continue
  }
}

if (!apiClientPath) {
  console.log('❌ fredApiClient.js not found in common locations');
}

// Test FRED API connectivity
console.log('\n🔌 Testing FRED API connectivity...');

function testFredApi() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.stlouisfed.org',
      path: `/fred/series?series_id=GNPCA&api_key=${apiKey}&file_type=json&limit=1`,
      method: 'GET',
      timeout: 10000
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`   Status code: ${res.statusCode}`);
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('✅ FRED API connection successful!');
          try {
            const parsedData = JSON.parse(data);
            console.log('   Series title:', parsedData.seriess[0].title);
            resolve(true);
          } catch (e) {
            console.error('❌ Error parsing response:', e.message);
            resolve(false);
          }
        } else {
          console.error('❌ FRED API connection failed!');
          
          if (res.statusCode === 400) {
            console.error('   Possible issue: Bad request parameters');
          } else if (res.statusCode === 403) {
            console.error('   Possible issue: Invalid API key or authentication problem');
          } else if (res.statusCode === 429) {
            console.error('   Possible issue: Rate limit exceeded');
          }
          
          try {
            const parsedData = JSON.parse(data);
            console.error('   Response:', JSON.stringify(parsedData).substring(0, 200));
          } catch (e) {
            console.error('   Raw response:', data.substring(0, 200));
          }
          
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ FRED API connection failed!');
      console.error('   Network error:', error.message);
      resolve(false);
    });
    
    req.end();
  });
}

// Check package.json for scripts
console.log('\n📦 Checking package.json for scripts...');
let packageJson = null;

try {
  packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log('✅ package.json found');
  
  if (packageJson.scripts) {
    console.log('   Available scripts:');
    Object.keys(packageJson.scripts).forEach(script => {
      console.log(`   - ${script}: ${packageJson.scripts[script]}`);
    });
  } else {
    console.log('❌ No scripts found in package.json');
  }
} catch (err) {
  console.error('❌ Failed to read package.json:', err.message);
}

// Create improved fredApiClient.js
console.log('\n🔧 Creating improved fredApiClient.js...');

const improvedApiClient = `const https = require('https');
const querystring = require('querystring');

class FredApiClient {
  constructor(apiKey = process.env.FRED_API_KEY) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.stlouisfed.org/fred/';
    this.timeout = parseInt(process.env.API_TIMEOUT || '30000', 10);
    this.retryAttempts = parseInt(process.env.RETRY_ATTEMPTS || '3', 10);
  }

  async request(endpoint, params = {}, retryCount = 0) {
    return new Promise((resolve, reject) => {
      const queryParams = querystring.stringify({
        api_key: this.apiKey,
        file_type: 'json',
        ...params
      });
      
      const url = \`\${this.baseUrl}\${endpoint}?\${queryParams}\`;
      
      const parsedUrl = new URL(url);
      
      const options = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        timeout: this.timeout
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsedData = JSON.parse(data);
              resolve(parsedData);
            } catch (err) {
              reject(new Error(\`Failed to parse response: \${err.message}\`));
            }
          } else {
            let errMsg = \`API request failed with status \${res.statusCode}\`;
            
            try {
              const parsedData = JSON.parse(data);
              errMsg += \`: \${JSON.stringify(parsedData)}\`;
            } catch (e) {
              errMsg += \`: \${data}\`;
            }
            
            const error = new Error(errMsg);
            error.statusCode = res.statusCode;
            error.responseData = data;
            
            // Retry logic for certain status codes
            if ([429, 500, 502, 503, 504].includes(res.statusCode) && retryCount < this.retryAttempts) {
              const nextRetry = retryCount + 1;
              const delay = this._getRetryDelay(nextRetry);
              
              console.warn(\`Retrying API request (attempt \${nextRetry}/\${this.retryAttempts}) after \${delay}ms...\`);
              
              setTimeout(() => {
                this.request(endpoint, params, nextRetry)
                  .then(resolve)
                  .catch(reject);
              }, delay);
            } else {
              reject(error);
            }
          }
        });
      });
      
      req.on('error', (error) => {
        // Retry on network errors
        if (retryCount < this.retryAttempts) {
          const nextRetry = retryCount + 1;
          const delay = this._getRetryDelay(nextRetry);
          
          console.warn(\`Network error: \${error.message}. Retrying (\${nextRetry}/\${this.retryAttempts}) after \${delay}ms...\`);
          
          setTimeout(() => {
            this.request(endpoint, params, nextRetry)
              .then(resolve)
              .catch(reject);
          }, delay);
        } else {
          reject(new Error(\`Network error after \${this.retryAttempts} attempts: \${error.message}\`));
        }
      });
      
      req.on('timeout', () => {
        req.destroy();
        
        // Retry on timeouts
        if (retryCount < this.retryAttempts) {
          const nextRetry = retryCount + 1;
          const delay = this._getRetryDelay(nextRetry);
          
          console.warn(\`Request timed out. Retrying (\${nextRetry}/\${this.retryAttempts}) after \${delay}ms...\`);
          
          setTimeout(() => {
            this.request(endpoint, params, nextRetry)
              .then(resolve)
              .catch(reject);
          }, delay);
        } else {
          reject(new Error(\`Request timed out after \${this.retryAttempts} attempts\`));
        }
      });
      
      req.end();
    });
  }

  _getRetryDelay(retryCount) {
    // Exponential backoff with jitter
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const exponentialDelay = Math.min(maxDelay, baseDelay * Math.pow(2, retryCount - 1));
    const jitter = Math.random() * 0.5 + 0.75; // Random value between 0.75 and 1.25
    return Math.floor(exponentialDelay * jitter);
  }

  async getSeriesData(seriesId, options = {}) {
    try {
      return await this.request('series/observations', {
        series_id: seriesId,
        ...options
      });
    } catch (error) {
      console.error(\`Error fetching series data for \${seriesId}:\`, error.message);
      throw error;
    }
  }
  
  async validateApiKey() {
    try {
      await this.request('series', {
        series_id: 'GNPCA',
        limit: 1
      });
      return true;
    } catch (error) {
      if (error.statusCode === 403) {
        console.error('API key validation failed: Invalid API key');
        return false;
      }
      console.error('API key validation error:', error.message);
      return false;
    }
  }
}

module.exports = FredApiClient;`;

if (apiClientPath) {
  try {
    fs.writeFileSync(apiClientPath, improvedApiClient);
    console.log(`✅ Updated fredApiClient.js at ${apiClientPath}`);
  } catch (err) {
    console.error(`❌ Failed to update fredApiClient.js: ${err.message}`);
    
    // Try to create it in a default location if update failed
    try {
      fs.mkdirSync('./src/services', { recursive: true });
      fs.writeFileSync('./src/services/fredApiClient.js', improvedApiClient);
      console.log('✅ Created new fredApiClient.js at ./src/services/fredApiClient.js');
    } catch (e) {
      console.error(`❌ Failed to create new fredApiClient.js: ${e.message}`);
    }
  }
} else {
  // Create it in a default location
  try {
    fs.mkdirSync('./src/services', { recursive: true });
    fs.writeFileSync('./src/services/fredApiClient.js', improvedApiClient);
    console.log('✅ Created new fredApiClient.js at ./src/services/fredApiClient.js');
  } catch (err) {
    console.error(`❌ Failed to create fredApiClient.js: ${err.message}`);
  }
}

// Run the connectivity test
(async function() {
  const apiSuccess = await testFredApi();
  
  console.log('\n📋 Creating health check script...');
  
  const healthCheckScript = `#!/usr/bin/env node
const FredApiClient = require('./src/services/fredApiClient');

async function checkApiHealth() {
  console.log('Running FRED API health check...');
  
  const client = new FredApiClient();
  
  try {
    // Validate API key
    console.log('Validating API key...');
    const isValidKey = await client.validateApiKey();
    
    if (!isValidKey) {
      console.error('❌ API key validation failed');
      process.exit(1);
    }
    
    console.log('✅ API key is valid');
    
    // Test data retrieval
    console.log('Testing data retrieval...');
    const data = await client.getSeriesData('GNPCA', { limit: 5 });
    
    console.log(\`✅ Successfully retrieved \${data.observations.length} observations for series GNPCA\`);
    console.log('Sample data:', data.observations[0]);
    
    console.log('\\n🎉 FRED API health check passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ FRED API health check failed:', error.message);
    process.exit(1);
  }
}

checkApiHealth();`;

  try {
    fs.writeFileSync('./check-fred-api-health.js', healthCheckScript);
    fs.chmodSync('./check-fred-api-health.js', 0o755);
    console.log('✅ Created check-fred-api-health.js script');
  } catch (err) {
    console.error('❌ Failed to create health check script:', err.message);
  }
  
  // Final recommendations
  console.log('\n📋 FINAL DIAGNOSIS AND RECOMMENDATIONS');
  
  if (apiSuccess) {
    console.log('✅ Your FRED API key is valid and the API is accessible');
  } else {
    console.log('❌ Issues detected with FRED API connectivity');
  }
  
  console.log('\nRecommended next steps:');
  console.log('1. Your .env file has been updated with the correct FRED API key');
  console.log('2. An improved fredApiClient.js has been created/updated');
  console.log('3. A health check script has been created (check-fred-api-health.js)');
  console.log('\nTo verify everything is working:');
  console.log('   node check-fred-api-health.js');
  
  if (packageJson && packageJson.scripts) {
    const startScript = packageJson.scripts.start || packageJson.scripts.dev;
    if (startScript) {
      console.log('\nTo restart your application:');
      console.log('   npm start');
      
      // If there's a restart script
      if (packageJson.scripts['api:restart']) {
        console.log('Or to restart just the API:');
        console.log('   npm run api:restart');
      }
    }
  }
  
  console.log('\n🔍 If you continue to have issues:');
  console.log('1. Check your network connectivity to api.stlouisfed.org');
  console.log('2. Verify you haven\'t exceeded API rate limits');
  console.log('3. Look for any firewall or proxy issues in your environment');
  console.log('\nGood luck!');
})();
