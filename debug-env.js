console.log("FRED_API_KEY:", process.env.FRED_API_KEY);
console.log("FRED_API_KEY length:", process.env.FRED_API_KEY ? process.env.FRED_API_KEY.length : 0);
console.log("FRED_API_KEY format check:", process.env.FRED_API_KEY ? /^[a-z0-9]{32}$/.test(process.env.FRED_API_KEY) : false);
