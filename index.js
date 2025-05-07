const https = require("https");

// FRED API key
const FRED_API_KEY = "2f057499936072679d8843d7fce99989";

// Common FRED series IDs and their descriptions
const SERIES_DESCRIPTIONS = {
  // U.S. Treasury Securities - Yields & Rates
  "DGS1MO": "1-Month Treasury Constant Maturity Rate",
  "DGS3MO": "3-Month Treasury Constant Maturity Rate",
  "DGS6MO": "6-Month Treasury Constant Maturity Rate",
  "DGS1": "1-Year Treasury Constant Maturity Rate",
  "DGS2": "2-Year Treasury Constant Maturity Rate",
  "DGS3": "3-Year Treasury Constant Maturity Rate",
  "DGS5": "5-Year Treasury Constant Maturity Rate",
  "DGS7": "7-Year Treasury Constant Maturity Rate",
  "DGS10": "10-Year Treasury Constant Maturity Rate",
  "DGS20": "20-Year Treasury Constant Maturity Rate",
  "DGS30": "30-Year Treasury Constant Maturity Rate",
  "DFII5": "5-Year Treasury Inflation-Indexed Security, Constant Maturity",
  "DFII7": "7-Year Treasury Inflation-Indexed Security, Constant Maturity",
  "DFII10": "10-Year Treasury Inflation-Indexed Security, Constant Maturity",
  "DFII20": "20-Year Treasury Inflation-Indexed Security, Constant Maturity",
  "DFII30": "30-Year Treasury Inflation-Indexed Security, Constant Maturity",
  
  // Treasury Yield Spreads (Yield Curve)
  "T10Y2Y": "10-Year Treasury Minus 2-Year Treasury",
  "T10Y3M": "10-Year Treasury Minus 3-Month Treasury",
  "T5YIFR": "5-Year, 5-Year Forward Inflation Expectation Rate",
  
  // Repo & Reverse Repo
  "RRPONTSYD": "Overnight Reverse Repurchase Agreements: Treasury Securities Sold by the Federal Reserve",
  "RPTSYD": "Overnight Repurchase Agreements: Treasury Securities Purchased by the Federal Reserve",
  "RPONTSYD": "Overnight Repurchase Agreements: Treasury Securities Purchased by the Federal Reserve",
  "WLRRAL": "Liquidity and Credit Facilities: Loans: Primary Dealer Credit Facility",
  "WORAL": "Overnight Reverse Repurchase Agreements",
  
  // Federal Reserve Balance Sheet
  "WALCL": "Assets: Total Assets (Less Eliminations from Consolidation)",
  "WSHOSHO": "Assets: Securities Held Outright: U.S. Treasury Securities",
  "WSHOMCB": "Assets: Securities Held Outright: Mortgage-Backed Securities",
  "WLRRAL": "Assets: Liquidity and Credit Facilities: Loans",
  "H41RESPPALDKNWW": "Assets: Liquidity and Credit Facilities: Loans: Bank Term Funding Program, Net",
  "WTREGEN": "Liabilities: Deposits with F.R. Banks: U.S. Treasury, General Account",
  "WRESBAL": "Reserve Balances with Federal Reserve Banks",
  "TOTRESNS": "Total Reserves of Depository Institutions",
  "WFEDERALRESERVE": "Assets: Total Assets: Total Assets",
  "RESBALNS": "Reserve Balances with Federal Reserve Banks, Not Seasonally Adjusted",
  
  // Monetary Base
  "BASE": "St. Louis Adjusted Monetary Base",
  "BOGMBASE": "Monetary Base",
  "BOGMBBM": "Monetary Base; Total",
  "M1SL": "M1 Money Stock",
  "M2SL": "M2 Money Stock",
  "MABMM301USM189S": "Monetary Base for United States",
  
  // Currency Swaps & International
  "SWPT": "Central Bank Liquidity Swaps",
  "IEABC": "Assets: Central Bank Liquidity Swaps",
  "DISCONTINUED_SWPT_ALL": "Term Auction Credit",
  "ECBASSETSW": "European Central Bank Assets",
  "JPNASSETS": "Bank of Japan Assets",
  
  // Dollar Index & Exchange Rates
  "DTWEXBGS": "Nominal Broad U.S. Dollar Index",
  "TWEXBGSMTH": "Nominal Broad U.S. Dollar Index (Monthly)",
  "DTWEXAFEGS": "Nominal Advanced Foreign Economies U.S. Dollar Index",
  "DTWEXEMEGS": "Nominal Emerging Market Economies U.S. Dollar Index",
  "RTWEXBGS": "Real Broad Dollar Index",
  "DEXUSEU": "U.S. / Euro Foreign Exchange Rate",
  "DEXJPUS": "Japanese Yen / U.S. Foreign Exchange Rate",
  "DEXCHUS": "China / U.S. Foreign Exchange Rate",
  "DEXUSUK": "U.S. / U.K. Foreign Exchange Rate",
  
  // Industrial Production
  "INDPRO": "Industrial Production Index",
  "IPMAN": "Industrial Production: Manufacturing",
  "IPB50001N": "Industrial Production: Total Index",
  "IPMANSICS": "Industrial Production: Manufacturing (SIC)",
  "IPUTIL": "Industrial Production: Electric and Gas Utilities",
  "IPCONGD": "Industrial Production: Consumer Goods",
  "IPFINAL": "Industrial Production: Final Products",
  "IPDMAT": "Industrial Production: Durable Materials",
  "IPNMAT": "Industrial Production: Nondurable Materials",
  "CAPUTLG211S": "Capacity Utilization: Manufacturing",
  
  // Employment & Unemployment
  "UNRATE": "Unemployment Rate",
  "PAYEMS": "All Employees, Total Nonfarm",
  "MANEMP": "All Employees, Manufacturing",
  "ICSA": "Initial Claims",
  "UEMPMEAN": "Average (Mean) Duration of Unemployment",
  "U1RATE": "Unemployment Rate: Job Losers",
  "U2RATE": "Unemployment Rate: Job Losers and Persons Completing Temporary Jobs",
  "U3RATE": "Unemployment Rate (Official Rate)",
  "U4RATE": "Unemployment Rate: Discouraged Workers",
  "U5RATE": "Unemployment Rate: Marginally Attached Workers",
  "U6RATE": "Unemployment Rate: Underemployment Rate",
  "CIVPART": "Labor Force Participation Rate",
  "EMRATIO": "Employment-Population Ratio",
  "UNEMPLOY": "Unemployment Level",
  "PAYEMS": "All Employees: Total Nonfarm Payrolls",
  "USPRIV": "All Employees: Total Private Industries",
  "AWHMAN": "Average Weekly Hours of Production and Nonsupervisory Employees: Manufacturing",
  "LNS14000006": "Unemployment Rate - 25-54 Years",
  "LNU04032231": "Unemployment Rate - Retail Trade",
  "LNU04032232": "Unemployment Rate - Manufacturing Industry",
  
  // Profits & Corporate Metrics
  "CP": "Corporate Profits After Tax",
  "CPATAX": "Corporate Profits After Tax (without IVA and CCAdj)",
  "A446RC1Q027SBEA": "Corporate Profits with Inventory Valuation Adjustment",
  "BOGZ1FU096902005Q": "Nonfinancial Corporate Business; Profits Before Tax (without IVA and CCAdj)",
  "BOGZ1FU096902005A": "Nonfinancial Corporate Business; Profits Before Tax; Annual",
  "NFCPATAX": "Nonfinancial Corporate Business: Profits After Tax",
  "A464RC1Q027SBEA": "Corporate Profits After Tax with IVA and CCAdj",
  "HCATAX": "Domestic Financial Corporations Profits After Tax",
  "BA": "Corporate Bond Yield",
  
  // Inflation & Core Economic Indicators
  "CPIAUCSL": "Consumer Price Index for All Urban Consumers: All Items",
  "CPILFESL": "Consumer Price Index for All Urban Consumers: All Items Less Food and Energy",
  "PCEPI": "Personal Consumption Expenditures: Chain-type Price Index",
  "PCEPILFE": "Personal Consumption Expenditures Excluding Food and Energy (Core PCE)",
  "GDP": "Gross Domestic Product",
  "GDPC1": "Real Gross Domestic Product",
  "GDPPOT": "Real Potential Gross Domestic Product",
  "PCE": "Personal Consumption Expenditures",
  "A939RX0Q048SBEA": "Real GDP Per Capita",
  
  // Interest Rates & Monetary Policy
  "FEDFUNDS": "Federal Funds Effective Rate",
  "DFF": "Federal Funds Effective Rate (Daily)",
  "DFEDTARU": "Federal Funds Target Rate (Upper Limit)",
  "DFEDTARL": "Federal Funds Target Rate (Lower Limit)",
  "IORB": "Interest Rate on Reserve Balances",
  "IOER": "Interest on Excess Reserves",
  
  // ICE BofA Bond Indices
  "BAMLC0A0CMEY": "ICE BofA US Corporate Index Effective Yield",
  "BAMLC0A4CBBBEY": "ICE BofA BBB US Corporate Index Effective Yield",
  "BAMLH0A0HYM2": "ICE BofA US High Yield Index Option-Adjusted Spread",
  "BAMLH0A0HYM2EY": "ICE BofA US High Yield Index Effective Yield",
  "BAMLC0A4CBBB": "ICE BofA BBB US Corporate Index Option-Adjusted Spread",
  "BAMLC0A3CA": "ICE BofA Single-A US Corporate Index Option-Adjusted Spread",
  "BAMLCC0A0CMTRIV": "ICE BofA US Corporate Index Total Return Index Value",
  
  // Stock Market
  "SP500": "S&P 500 Index",
  "DJIA": "Dow Jones Industrial Average",
  "VIXCLS": "CBOE Volatility Index (VIX)",
  "NASDAQ100": "NASDAQ 100 Index",
  "WILL5000INDFC": "Wilshire 5000 Total Market Index",
  
  // Housing
  "CSUSHPISA": "S&P/Case-Shiller U.S. National Home Price Index",
  "HOUST": "Housing Starts",
  "PERMIT": "New Private Housing Units Authorized by Building Permits",
  "MORTGAGE30US": "30-Year Fixed Rate Mortgage Average"
};

// Categories for organization
const SERIES_CATEGORIES = {
  "Treasury Securities": ["DGS1MO", "DGS3MO", "DGS6MO", "DGS1", "DGS2", "DGS3", "DGS5", "DGS7", "DGS10", "DGS20", "DGS30", "DFII5", "DFII7", "DFII10", "DFII20", "DFII30"],
  "Treasury Yield Spreads": ["T10Y2Y", "T10Y3M", "T5YIFR"],
  "Repo & Reverse Repo": ["RRPONTSYD", "RPTSYD", "RPONTSYD", "WLRRAL", "WORAL"],
  "Federal Reserve Balance Sheet": ["WALCL", "WSHOSHO", "WSHOMCB", "WLRRAL", "H41RESPPALDKNWW", "WTREGEN", "WRESBAL", "TOTRESNS", "WFEDERALRESERVE", "RESBALNS"],
  "Monetary Base": ["BASE", "BOGMBASE", "BOGMBBM", "M1SL", "M2SL", "MABMM301USM189S"],
  "Currency Swaps & International": ["SWPT", "IEABC", "DISCONTINUED_SWPT_ALL", "ECBASSETSW", "JPNASSETS"],
  "Dollar Index & Exchange Rates": ["DTWEXBGS", "TWEXBGSMTH", "DTWEXAFEGS", "DTWEXEMEGS", "RTWEXBGS", "DEXUSEU", "DEXJPUS", "DEXCHUS", "DEXUSUK"],
  "Industrial Production": ["INDPRO", "IPMAN", "IPB50001N", "IPMANSICS", "IPUTIL", "IPCONGD", "IPFINAL", "IPDMAT", "IPNMAT", "CAPUTLG211S"],
  "Employment & Unemployment": ["UNRATE", "PAYEMS", "MANEMP", "ICSA", "UEMPMEAN", "U1RATE", "U2RATE", "U3RATE", "U4RATE", "U5RATE", "U6RATE", "CIVPART", "EMRATIO", "UNEMPLOY", "PAYEMS", "USPRIV", "AWHMAN", "LNS14000006", "LNU04032231", "LNU04032232"],
  "Profits & Corporate Metrics": ["CP", "CPATAX", "A446RC1Q027SBEA", "BOGZ1FU096902005Q", "BOGZ1FU096902005A", "NFCPATAX", "A464RC1Q027SBEA", "HCATAX", "BA"],
  "Inflation & Core Economic": ["CPIAUCSL", "CPILFESL", "PCEPI", "PCEPILFE", "GDP", "GDPC1", "GDPPOT", "PCE", "A939RX0Q048SBEA"],
  "Interest Rates & Monetary Policy": ["FEDFUNDS", "DFF", "DFEDTARU", "DFEDTARL", "IORB", "IOER"],
  "ICE BofA Bond Indices": ["BAMLC0A0CMEY", "BAMLC0A4CBBBEY", "BAMLH0A0HYM2", "BAMLH0A0HYM2EY", "BAMLC0A4CBBB", "BAMLC0A3CA", "BAMLCC0A0CMTRIV"],
  "Stock Market": ["SP500", "DJIA", "VIXCLS", "NASDAQ100", "WILL5000INDFC"],
  "Housing": ["CSUSHPISA", "HOUST", "PERMIT", "MORTGAGE30US"]
};

exports.handler = async (event) => {
  try {
    // Get query parameters
    const queryParams = event.queryStringParameters || {};
    
    // If no series_id is provided, return the list of available series by category
    if (!queryParams.series_id) {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({
          message: "Available FRED data series",
          categories: SERIES_CATEGORIES,
          series: SERIES_DESCRIPTIONS,
          usage: "To fetch data, add a series_id parameter to your request, e.g., ?series_id=UNRATE"
        })
      };
    }
    
    // Get requested series ID
    const seriesId = queryParams.series_id;
    
    // Optional parameters
    const observationStart = queryParams.observation_start || "1900-01-01";
    const observationEnd = queryParams.observation_end || "9999-12-31";
    const units = queryParams.units || "lin"; // lin, chg, ch1, pch, pc1, pca, cch, cca, log
    const frequency = queryParams.frequency || ""; // d, w, bw, m, q, sa, a (empty = default frequency)
    const aggregationMethod = queryParams.aggregation_method || "avg"; // avg, sum, eop
    
    // Build FRED API URL with parameters
    const fredUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&observation_start=${observationStart}&observation_end=${observationEnd}&units=${units}${frequency ? "&frequency=" + frequency : ""}${aggregationMethod ? "&aggregation_method=" + aggregationMethod : ""}`;
    
    // Fetch data from FRED
    const fredData = await httpGet(fredUrl);
    const parsedData = JSON.parse(fredData);
    
    // Get series information
    const seriesUrl = `https://api.stlouisfed.org/fred/series?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json`;
    const seriesInfo = await httpGet(seriesUrl);
    const parsedSeriesInfo = JSON.parse(seriesInfo);
    
    // Return success response
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        message: "Data retrieved successfully",
        series_id: seriesId,
        series_name: SERIES_DESCRIPTIONS[seriesId] || parsedSeriesInfo.seriess[0]?.title || "Unknown Series",
        params: {
          observation_start: observationStart,
          observation_end: observationEnd,
          units: units,
          frequency: frequency || "default",
          aggregation_method: aggregationMethod
        },
        data: parsedData
      })
    };
    
  } catch (error) {
    console.error("Error:", error);
    
    // Return error response
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        message: "Error retrieving data",
        error: error.message
      })
    };
  }
};

// Helper function to make HTTP requests
function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";
      
      // A chunk of data has been received
      res.on("data", (chunk) => {
        data += chunk;
      });
      
      // The whole response has been received
      res.on("end", () => {
        resolve(data);
      });
      
    }).on("error", (err) => {
      reject(err);
    });
  });
}
