#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Read the file
const filePath = path.join(process.cwd(), 'src/components/Dashboard.js');
let content;

try {
  content = fs.readFileSync(filePath, 'utf8');
} catch (err) {
  console.error('Could not read Dashboard.js:', err);
  process.exit(1);
}

// Find and fix the problematic section around line 87
// The error is with extra semicolons and commas in what looks like a useEffect or debounced function
const errorPattern = /\s*\};,\s*\/\/\s*eslint-disable-line react-hooks\/exhaustive-deps\s*\n\s*\};,\s*\/\/\s*eslint-disable-line react-hooks\/exhaustive-deps\s*\n\s*\};,\s*CONFIG\.UI\.DEBOUNCE_DELAY\)/;

// Replace with correct syntax
const fixedContent = content.replace(errorPattern, 
  `  }; // eslint-disable-line react-hooks/exhaustive-deps
  }, CONFIG.UI.DEBOUNCE_DELAY)`);

// Write the fixed content back to the file
try {
  fs.writeFileSync(filePath, fixedContent);
  console.log('Successfully fixed Dashboard.js');
} catch (err) {
  console.error('Could not write fixed content to Dashboard.js:', err);
  process.exit(1);
}
