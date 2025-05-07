const fs = require('fs');
// // const path = require('path'); // Commented out until used // Commented out until used

// Try to find Dashboard.jsx in different potential locations
const possiblePaths = [
  'src/Dashboard.jsx',
  'src/components/Dashboard.jsx',
  'src/pages/Dashboard.jsx',
  'Dashboard.jsx'
];

let dashboardPath = null;
for (const potentialPath of possiblePaths) {
  if (fs.existsSync(potentialPath)) {
    dashboardPath = potentialPath;
    break;
  }
}

if (!dashboardPath) {
  console.error('Could not find Dashboard.jsx. Please update the imports manually.');
  process.exit(1);
}

console.log(`Found Dashboard at ${dashboardPath}`);

// Read the file
let content = fs.readFileSync(dashboardPath, 'utf8');

// Replace imports
content = content.replace(
  /import[\s\n]+DataService[\s\n]+from[\s\n]+'[^']*';/,
  "import EnhancedDataService from '../services/enhanced-data-service';"
);

// Replace DataService references
content = content.replace(/DataService\./g, 'EnhancedDataService.');

// Update WebSocket connection
content = content.replace(
  /WebSocketService\.connect\(\);/g,
  'EnhancedDataService.subscribeToLiveUpdates([\'UNRATE\', \'GDP\', \'FEDFUNDS\']);'
);

content = content.replace(
  /WebSocketService\.disconnect\(\);/g,
  'EnhancedDataService.unsubscribeFromLiveUpdates([\'UNRATE\', \'GDP\', \'FEDFUNDS\']);'
);

// Save the updated file
fs.writeFileSync(`${dashboardPath}.new`, content);

console.log(`Dashboard component updated. Please check ${dashboardPath}.new and replace ${dashboardPath} if the changes look good.`);
