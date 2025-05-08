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

// The error is in lines 86-87 where there appears to be a debounced useEffect with syntax issues
// Line 86:      });  }; // eslint-disable-line react-hooks/exhaustive-deps
// Line 87:  }, CONFIG.UI.DEBOUNCE_DELAY), [selectedIndicator, getIndicatorDetails, startDate, endDate]);

// Find and fix the problematic section
// The pattern to look for is the incorrect closing of the debounced function
const errorPattern = /\}\);[\s]*\};[\s]*\/\/[\s]*eslint-disable-line react-hooks\/exhaustive-deps[\s]*\n[\s]*\},[\s]*CONFIG\.UI\.DEBOUNCE_DELAY\),[\s]*\[([^\]]+)\]\);/;

// Replace with correct syntax for a debounced function in useEffect
const fixedContent = content.replace(errorPattern, 
  (match, dependencies) => {
    return `});
      // eslint-disable-line react-hooks/exhaustive-deps
    }, CONFIG.UI.DEBOUNCE_DELAY), [${dependencies}]);`;
  });

// Write the fixed content back to the file
try {
  fs.writeFileSync(filePath, fixedContent);
  console.log('Successfully fixed Dashboard.js');
} catch (err) {
  console.error('Could not write fixed content to Dashboard.js:', err);
  process.exit(1);
}
