const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(process.cwd(), 'package.json');
let packageJson;

try {
  packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
} catch (err) {
  console.error('Could not read package.json:', err);
  process.exit(1);
}

// Add/update scripts
packageJson.scripts = {
  ...packageJson.scripts,
  "lint": "eslint src/**/*.{js,jsx,ts,tsx}",
  "lint:fix": "eslint --fix src/**/*.{js,jsx,ts,tsx}",
  "format": "prettier --write src/**/*.{js,jsx,ts,tsx,css,md,json}",
  "test": "react-scripts test",
  "test:ci": "react-scripts test --watchAll=false",
  "api:check": "node check-api-health.js"
};

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log('✅ Updated package.json scripts successfully');
