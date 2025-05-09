#!/bin/bash

echo "Installing necessary dependencies..."
npm install express cors axios dotenv

echo "Creating proxy server for API connections..."
node -e "
const fs = require('fs');
if (!fs.existsSync('.env')) {
  console.log('Creating .env file with API keys...');
  fs.writeFileSync('.env', 'REACT_APP_FRED_API_KEY=a8df6aeca3b71980ad53ebccecb3cb3e\nREACT_APP_BEA_API_KEY=997E5691-4F0E-4774-8B4E-CAE836D4AC47\nREACT_APP_BLS_API_KEY=a759447531f04f1f861f29a381aab863\nREACT_APP_CENSUS_API_KEY=8423ffa543d0e95cdba580f2e381649b6772f515');
} else {
  console.log('.env file already exists, skipping creation');
}
"

echo "Starting proxy server in the background..."
node server.js &

echo "Proxy server started on port 5000"
echo "==================================="
echo "To view the API debugger:"
echo "1. Start your React app with: npm start"
echo "2. Click on the 'API Debugger' tab"
echo "3. Test each API connection"
echo ""
echo "The dashboard now includes fallback data if APIs fail, so you should see visualizations even if some APIs are unavailable."
echo ""
echo "To stop the proxy server: 'kill $!'"
