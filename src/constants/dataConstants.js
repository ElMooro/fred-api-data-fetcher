// Financial Crisis Events
export const FINANCIAL_CRISES = [
  { 
    name: "Black Monday", 
    date: "1987-10-19", 
    description: "Stock market crash where Dow Jones fell by 22.6%",
    severity: "high" 
  },
  { 
    name: "Dot-com Bubble", 
    startDate: "2000-03-10", 
    endDate: "2002-10-09", 
    description: "Tech stock bubble burst",
    severity: "high" 
  },
  { 
    name: "Global Financial Crisis", 
    startDate: "2007-12-01", 
    endDate: "2009-06-01", 
    description: "Subprime mortgage crisis",
    severity: "extreme" 
  },
  { 
    name: "Flash Crash", 
    date: "2010-05-06", 
    description: "Brief stock market crash with trillion-dollar losses",
    severity: "medium" 
  },
  { 
    name: "European Debt Crisis", 
    startDate: "2010-04-01", 
    endDate: "2012-07-26", 
    description: "Sovereign debt crisis in Europe",
    severity: "high" 
  },
  { 
    name: "COVID-19 Crash", 
    date: "2020-03-16", 
    description: "Pandemic-induced market crash",
    severity: "high" 
  }
];

// Data sources structured with proper TypeScript-style documentation
export const DATA_SOURCES = {
  FRED: [
    { 
      id: "GDP", 
      name: "Gross Domestic Product", 
      frequency: "quarterly",
      unit: "Billions of USD",
      description: "Total value of goods and services produced",
      baseValue: 15000,
      volatility: 0.01,
      trend: 0.005
    },
    { 
      id: "UNRATE", 
      name: "Unemployment Rate", 
      frequency: "monthly",
      unit: "Percent",
      description: "Percentage of labor force unemployed",
      baseValue: 5,
      volatility: 0.03,
      trend: 0
    },
    { 
      id: "FEDFUNDS", 
      name: "Federal Funds Rate", 
      frequency: "monthly",
      unit: "Percent",
      description: "Interest rate at which banks lend to each other overnight",
      baseValue: 2.5,
      volatility: 0.02,
      trend: 0
    }
  ],
  ECB: [
    { 
      id: "EXR.D.USD.EUR.SP00.A", 
      name: "USD/EUR Exchange Rate", 
      frequency: "daily",
      unit: "USD per EUR",
      description: "Exchange rate between USD and EUR",
      baseValue: 1.1,
      volatility: 0.005,
      trend: 0
    },
    { 
      id: "MFI.M.U2.Y.V.M30.X.I.U2.2300.Z01.A", 
      name: "Eurozone M3 Money Supply", 
      frequency: "monthly",
      unit: "Percent Change",
      description: "Broad money supply growth in Eurozone",
      baseValue: 4.5,
      volatility: 0.02,
      trend: 0.001
    }
  ],
  NYFED: [
    { 
      id: "SOFR", 
      name: "Secured Overnight Financing Rate", 
      frequency: "daily",
      unit: "Percent",
      description: "Benchmark interest rate for dollar-denominated derivatives and loans",
      baseValue: 2.2,
      volatility: 0.01,
      trend: 0
    }
  ],
  OFR: [
    { 
      id: "FSI", 
      name: "Financial Stress Index", 
      frequency: "daily",
      unit: "Index",
      description: "Measure of systemic financial stress",
      baseValue: 0,
      volatility: 0.08,
      trend: 0
    }
  ]
};

// Transformations
export const TRANSFORMATIONS = [
  { 
    id: "raw", 
    name: "Raw Data (No Transformation)", 
    description: "Original data without any mathematical transformation",
    requiresHistory: false 
  },
  { 
    id: "mom", 
    name: "Month-over-Month Change", 
    description: "Absolute change from previous month",
    requiresHistory: true,
    historyPeriod: "month"
  },
  { 
    id: "mom_pct", 
    name: "Month-over-Month % Change", 
    description: "Percentage change from previous month",
    requiresHistory: true,
    historyPeriod: "month",
    resultUnit: "percent"
  },
  { 
    id: "qoq", 
    name: "Quarter-over-Quarter Change", 
    description: "Absolute change from previous quarter",
    requiresHistory: true,
    historyPeriod: "quarter"
  },
  { 
    id: "qoq_pct", 
    name: "Quarter-over-Quarter % Change", 
    description: "Percentage change from previous quarter",
    requiresHistory: true,
    historyPeriod: "quarter",
    resultUnit: "percent"
  },
  { 
    id: "yoy", 
    name: "Year-over-Year % Change", 
    description: "Percentage change from same period previous year",
    requiresHistory: true,
    historyPeriod: "year",
    resultUnit: "percent"
  }
];

// Time frames
export const TIME_FRAMES = [
  { id: "daily", name: "Daily", days: 1 },
  { id: "weekly", name: "Weekly", days: 7 },
  { id: "monthly", name: "Monthly", days: 30 },
  { id: "quarterly", name: "Quarterly", days: 90 },
  { id: "semiannual", name: "Half-Yearly", days: 180 },
  { id: "annual", name: "Yearly", days: 365 }
];
