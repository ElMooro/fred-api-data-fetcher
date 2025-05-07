// Find the useEffect with the problematic dependency array
let lineNo = 0;
const fs = require('fs');
const filePath = '/workspaces/fred-api-data-fetcher/src/components/Dashboard.js';
const lines = fs.readFileSync(filePath, 'utf8').split('\n');
let fixedLines = [];

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  
  // Check if this is the problematic line
  if (line.includes('}, [rawData, selectedTransformation]);') || 
      line.includes('}, [rawData, selectedTransformation,]);')) {
    
    // Replace with the correct version without a trailing comma
    line = '  }, [rawData, selectedTransformation]);';
    console.log(`Fixed dependency array at line ${i+1}`);
  }
  
  fixedLines.push(line);
}

fs.writeFileSync(filePath, fixedLines.join('\n'));
console.log('Fixed Dashboard.js successfully');
