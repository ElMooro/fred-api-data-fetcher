const fs = require('fs');
const path = require('path');

// Path to the financial.ts file
const filePath = path.join('src', 'constants', 'financial.ts');

// Read the file
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  // Find the ERROR_TYPES declaration and add the missing error types
  const updatedData = data.replace(
    /export const ERROR_TYPES: Record<ErrorType, ErrorType> = {[^}]*}/s,
    `export const ERROR_TYPES: Record<ErrorType, ErrorType> = {
  INVALID_DATE_RANGE: 'INVALID_DATE_RANGE',
  INVALID_DATE_FORMAT: 'INVALID_DATE_FORMAT',
  NO_DATA_RETURNED: 'NO_DATA_RETURNED',
  DUPLICATE_WATCHLIST: 'DUPLICATE_WATCHLIST',
  TRANSFORMATION_ERROR: 'TRANSFORMATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',
  GENERAL_ERROR: 'GENERAL_ERROR',
  DATA_SOURCE_ERROR: 'DATA_SOURCE_ERROR',
  FETCH_ERROR: 'FETCH_ERROR',
  PARSE_ERROR: 'PARSE_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
}`
  );

  // Write the updated content back to the file
  fs.writeFile(filePath, updatedData, 'utf8', (err) => {
    if (err) {
      console.error('Error writing file:', err);
      return;
    }
    console.log('SUCCESS: Updated ERROR_TYPES in financial.ts');
  });
});
