const fs = require('fs');
const path = require('path');

// Function to recursively get all files in a directory
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Process files
const files = getAllFiles('src');
let fixedFiles = 0;

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if this file contains both YAxis and Bar components
  if (content.includes('<YAxis') && content.includes('<Bar')) {
    // Find YAxis IDs
    const yAxisIdMatches = content.match(/<YAxis[^>]*yAxisId=["']([^"']*)["'][^>]*>/g);
    let yAxisIds = [];
    
    if (yAxisIdMatches) {
      yAxisIdMatches.forEach(match => {
        const idMatch = match.match(/yAxisId=["']([^"']*)["']/);
        if (idMatch && idMatch[1]) {
          yAxisIds.push(idMatch[1]);
        }
      });
    }
    
    // If we found YAxis IDs, check Bar components
    if (yAxisIds.length > 0) {
      const defaultId = yAxisIds[0];
      console.log(`Found YAxis IDs in ${filePath}: ${yAxisIds.join(', ')}`);
      
      // Regular expressions to find Bar components
      const barRegex = /<Bar\s+([^>]*)>/g;
      const endBarRegex = /<Bar\s+([^>]*?)\/>/g;
      
      // Function to process a Bar match
      const processBarMatch = (match, attributes) => {
        // Check if it already has a yAxisId
        if (attributes.includes('yAxisId=')) {
          return match; // Already has yAxisId, keep as is
        }
        
        // Insert yAxisId attribute
        if (match.endsWith('/>')) {
          return match.replace('/>', ` yAxisId="${defaultId}" />`);
        } else {
          return match.replace('>', ` yAxisId="${defaultId}">`);
        }
      };
      
      // Process <Bar ...> format
      let modified = content.replace(barRegex, (match, attributes) => {
        return processBarMatch(match, attributes);
      });
      
      // Process <Bar .../> format
      modified = modified.replace(endBarRegex, (match, attributes) => {
        return processBarMatch(match, attributes);
      });
      
      // If content was modified, write it back
      if (modified !== content) {
        fs.writeFileSync(filePath, modified, 'utf8');
        console.log(`✅ Fixed Bar components in ${filePath}`);
        fixedFiles++;
      }
    }
  }
});

console.log(`\nCompleted: Fixed ${fixedFiles} files with Bar/YAxis component issues.`);
