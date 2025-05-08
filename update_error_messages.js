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

  // Find the ERROR_MESSAGES declaration and replace it with the new version
  const updatedData = data.replace(
    /export const ERROR_MESSAGES: Record<ErrorType, string> = {[^}]*};/s,
    `export const ERROR_MESSAGES: Record<ErrorType, string> = {
  INVALID_DATE_RANGE: "Invalid date range. Please ensure start date is before end date.",
  INVALID_DATE_FORMAT: "Invalid date format. Please use YYYY-MM-DD format.",
  NO_DATA_RETURNED: "No data available for the selected parameters.",
  DUPLICATE_WATCHLIST: "This item already exists in your watchlist.",
  TRANSFORMATION_ERROR: "An error occurred while transforming data.",
  NETWORK_ERROR: "A network error occurred. Please check your connection and try again.",
  API_ERROR: "An error occurred while fetching data from the API.",
  GENERAL_ERROR: "An unexpected error occurred. Please try again later.",
  DATA_SOURCE_ERROR: "An error occurred with the data source.",
  // Added missing properties:
  FETCH_ERROR: "Failed to fetch data. Please check your network or try again later.",
  PARSE_ERROR: "Failed to parse data. The received data might be corrupted or in an unexpected format.",
  UNKNOWN_ERROR: "An unknown error occurred. Please contact support if the issue persists."
};`
  );

  // Write the updated content back to the file
  fs.writeFile(filePath, updatedData, 'utf8', (err) => {
    if (err) {
      console.error('Error writing file:', err);
      return;
    }
    console.log('SUCCESS: Updated ERROR_MESSAGES in financial.ts');
  });
});
