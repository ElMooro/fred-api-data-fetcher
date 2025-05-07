import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, ReferenceArea, Label
} from 'recharts';
import * as math from 'mathjs';
import _ from 'lodash';

// Constants
const APP_VERSION = '2.1.0';

// Types for better type safety
/**
 * @typedef {Object} FinancialCrisis
 * @property {string} name - Name of the crisis
 * @property {string} [startDate] - Start date of the crisis (YYYY-MM-DD)
 * @property {string} [endDate] - End date of the crisis (YYYY-MM-DD)
 * @property {string} [date] - Single date for point-in-time events (YYYY-MM-DD)
 * @property {string} description - Description of the crisis
 * @property {'low'|'medium'|'high'} severity - Severity level
 */

/**
 * @typedef {Object} Indicator
 * @property {string} name - Display name of the indicator
 * @property {string} unit - Unit of measurement
 * @property {string} description - Description of what the indicator measures
 */

/**
 * @typedef {Object} LiveDataConfig
 * @property {number} baseValue - Starting value for the indicator
 * @property {number} volatility - Amount of random variation
 * @property {'normal'|'lognormal'|'step'} volatilityPattern - Distribution pattern
 * @property {string} unit - Unit of measurement
 * @property {string} color - Hex color code for charts
 * @property {number} meanReversion - Strength of pull toward the mean (0-1)
 * @property {number} tickInterval - Minimum change increment
 * @property {boolean} displayOnSecondaryAxis - Whether to use right Y-axis
 * @property {Object.<string, number>} correlations - Correlation coefficients with other indicators
 */

/**
 * @typedef {Object} DataPoint
 * @property {string} date - ISO date string
 * @property {number} value - Data value
 */

/**
 * @typedef {Object} WatchlistItem
 * @property {string} id - Unique identifier
 * @property {string} name - Display name
 * @property {string} indicator - Indicator code
 * @property {string} startDate - Start date (YYYY-MM-DD)
 * @property {string} endDate - End date (YYYY-MM-DD)
 * @property {string} transformation - Applied transformation ID
 * @property {string} transformationName - Human-readable transformation
 * @property {string} dateAdded - ISO date string
 * @property {Array<DataPoint>} data - Chart data
 */

// Financial Crisis Events for visualizing on charts
/** @type {Array<FinancialCrisis>} */
const FINANCIAL_CRISES = [
  {
    name: "2008 Financial Crisis",
    startDate: "2008-01-01",
    endDate: "2009-06-30",
    description: "Global financial crisis triggered by the subprime mortgage market",
    severity: "high"
  },
  {
    name: "COVID-19 Crash",
    date: "2020-03-15",
    description: "Market crash due to the COVID-19 pandemic",
    severity: "high"
  },
  {
    name: "Dot-com Bubble",
    startDate: "2000-03-01",
    endDate: "2002-10-01",
    description: "Tech stock bubble burst of early 2000s",
    severity: "medium"
  },
];

// Live data simulation configuration
const LIVE_UPDATE_INTERVAL = 3000; // Update every 3 seconds
const LIVE_DATA_POINTS = 50; // Maximum data points to display
/** @type {Object.<string, LiveDataConfig>} */
const LIVE_DATA_CONFIG = {
  UNRATE: {
    baseValue: 3.8,
    volatility: 0.05,
    volatilityPattern: 'normal', // normal distribution
    unit: "%",
    color: "#3B82F6", // blue
    meanReversion: 0.1, // strength of pull toward the mean
    tickInterval: 0.1, // minimum tick size
    displayOnSecondaryAxis: false,
    correlations: {
      GDP: -0.45, // unemployment tends to be negatively correlated with GDP
      FEDFUNDS: 0.2 // slightly positive correlation with interest rates
    }
  },
  GDP: {
    baseValue: 21.5,
    volatility: 0.01,
    volatilityPattern: 'lognormal', // log-normal distribution for economic data
    unit: "Trillion USD",
    color: "#10B981", // green
    meanReversion: 0.05,
    tickInterval: 0.01,
    displayOnSecondaryAxis: true,
    correlations: {
      UNRATE: -0.45,
      FEDFUNDS: 0.1
    }
  },
  FEDFUNDS: {
    baseValue: 5.25,
    volatility: 0.02,
    volatilityPattern: 'step', // step function pattern like Fed decisions
    unit: "%",
    color: "#F59E0B", // amber
    meanReversion: 0.2,
    tickInterval: 0.25, // Fed typically moves in 25bp increments
    displayOnSecondaryAxis: false,
    correlations: {
      UNRATE: 0.2,
      GDP: 0.1
    }
  },
  INFLATION: {
    baseValue: 3.2,
    volatility: 0.04,
    volatilityPattern: 'normal',
    unit: "%",
    color: "#EF4444", // red
    meanReversion: 0.08,
    tickInterval: 0.1,
    displayOnSecondaryAxis: false,
    correlations: {
      UNRATE: -0.1,
      GDP: 0.15,
      FEDFUNDS: 0.6 // Fed funds rate is strongly correlated with inflation
    }
  }
};

// Indicator metadata for labels and descriptions
/** @type {Object.<string, Indicator>} */
const INDICATORS = {
  UNRATE: {
    name: "Unemployment Rate",
    unit: "%",
    description: "Percentage of the labor force that is unemployed"
  },
  GDP: {
    name: "Gross Domestic Product",
    unit: "Trillion USD",
    description: "Total value of goods and services produced"
  },
  FEDFUNDS: {
    name: "Federal Funds Rate",
    unit: "%",
    description: "Interest rate at which banks lend to each other overnight"
  },
  INFLATION: {
    name: "Inflation Rate",
    unit: "%",
    description: "Annual change in the Consumer Price Index (CPI)"
  }
};

// Transformation metadata
const TRANSFORMATIONS = [
  { id: "raw", name: "Raw Data" },
  { id: "mom", name: "Month-over-Month Change" },
  { id: "yoy", name: "Year-over-Year % Change" },
  { id: "mom_pct", name: "Month-over-Month % Change" }
];

/**
 * Data generator utilities
 */
const DataGeneratorService = {
  /**
   * Generates unemployment rate data with realistic patterns
   * 
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @returns {Array<DataPoint>} Array of data points
   */
  generateUnemploymentData: (startDate, endDate) => {
    const data = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Baseline unemployment rate
    let rate = 5.1;

    // Generate monthly data points
    let currentDate = new Date(start);
    while (currentDate <= end) {
      // Add seasonality (unemployment tends to be higher in winter months)
      const month = currentDate.getMonth();
      const seasonalEffect = month >= 10 || month <= 1 ? 0.2 : month >= 5 && month <= 8 ? -0.1 : 0;

      // Add some trend
      const yearsSinceStart = (currentDate - start) / (1000 * 60 * 60 * 24 * 365);
      const trend = Math.sin(yearsSinceStart * Math.PI) * 0.5;

      // Add crisis effects
      let crisisImpact = 0;

      // 2008 Financial Crisis effect
      if (currentDate >= new Date("2008-01-01") && currentDate <= new Date("2009-12-31")) {
        const monthsInto2008Crisis = (currentDate - new Date("2008-01-01")) / (1000 * 60 * 60 * 24 * 30);
        crisisImpact += Math.min(3.5, monthsInto2008Crisis * 0.3);
      }

      // COVID effect in 2020
      if (currentDate >= new Date("2020-03-01") && currentDate <= new Date("2020-09-30")) {
        const covidImpactFactor = currentDate <= new Date("2020-04-30") ? 5 :
                                  currentDate <= new Date("2020-06-30") ? 3 : 1;
        crisisImpact += covidImpactFactor;
      }

      // Random noise
      const noise = (Math.random() - 0.5) * 0.2;

      // Calculate final rate
      rate = rate + trend + seasonalEffect + crisisImpact + noise;

      // Ensure rate doesn't go below reasonable minimum
      rate = Math.max(3.4, rate);

      data.push({
        date: currentDate.toISOString().split('T')[0],
        value: parseFloat(rate.toFixed(1))
      });

      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return data;
  },

  /**
   * Generates GDP data with realistic patterns
   * 
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @returns {Array<DataPoint>} Array of data points
   */
  generateGDPData: (startDate, endDate) => {
    const data = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Starting GDP value (in trillions)
    let gdp = 14.5;

    // Generate quarterly data
    let currentDate = new Date(start);
    currentDate.setDate(1); // Start at beginning of month

    // Adjust to start at quarter
    const monthOffset = currentDate.getMonth() % 3;
    if (monthOffset !== 0) {
      currentDate.setMonth(currentDate.getMonth() + (3 - monthOffset));
    }

    while (currentDate <= end) {
      // Base growth rate (average 2-3% annually, so ~0.5-0.75% quarterly)
      let quarterlyGrowth = 0.006 + (Math.random() * 0.002);

      // Seasonal effects (Q4 often stronger due to holiday spending)
      const quarter = Math.floor(currentDate.getMonth() / 3) + 1;
      if (quarter === 4) quarterlyGrowth += 0.002;

      // Crisis effects
      if (currentDate >= new Date("2008-07-01") && currentDate <= new Date("2009-06-30")) {
        // 2008 financial crisis
        quarterlyGrowth -= 0.015 + (Math.random() * 0.01);
      }

      if (currentDate >= new Date("2020-01-01") && currentDate <= new Date("2020-06-30")) {
        // COVID-19 impact
        if (currentDate <= new Date("2020-03-31")) {
          quarterlyGrowth -= 0.05;
        } else {
          quarterlyGrowth -= 0.12;
        }
      }

      // Apply growth to GDP
      gdp = gdp * (1 + quarterlyGrowth);

      data.push({
        date: currentDate.toISOString().split('T')[0],
        value: parseFloat(gdp.toFixed(3))
      });

      // Move to next quarter
      currentDate.setMonth(currentDate.getMonth() + 3);
    }

    return data;
  },

  /**
   * Generates Federal Funds Rate data with realistic patterns
   * 
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @returns {Array<DataPoint>} Array of data points
   */
  generateFedFundsData: (startDate, endDate) => {
    const data = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Starting federal funds rate
    let rate = 3.5;

    // Generate monthly data
    let currentDate = new Date(start);
    while (currentDate <= end) {
      // Fed tends to move rates in 0.25% increments
      // Rates tend to be more stable over time with periodic adjustments

      // Crisis response - lower rates during crises
      if (currentDate >= new Date("2007-09-01") && currentDate <= new Date("2008-12-31")) {
        // Decreasing rates during 2008 crisis
        if (rate > 0.25) {
          // Modeling the dramatic rate cuts
          if (Math.random() < 0.4) {
            rate -= 0.25;
          }
        }
      } else if (currentDate >= new Date("2009-01-01") && currentDate <= new Date("2015-12-31")) {
        // Zero lower bound period
        rate = 0.25;
      } else if (currentDate >= new Date("2016-01-01") && currentDate <= new Date("2019-12-31")) {
        // Gradual hiking cycle
        if (Math.random() < 0.15) {
          rate += 0.25;
        }
      } else if (currentDate >= new Date("2020-03-01") && currentDate <= new Date("2021-12-31")) {
        // COVID response - emergency cuts
        if (currentDate <= new Date("2020-04-30")) {
          rate = 0.25;
        } else {
          rate = 0.25; // Maintained at zero lower bound
        }
      } else {
        // Normal times - occasional adjustments
        if (Math.random() < 0.1) {
          rate += (Math.random() > 0.5 ? 0.25 : -0.25);
        }
      }

      // Ensure rate doesn't go negative or unreasonably high
      rate = Math.max(0.25, Math.min(8.0, rate));

      data.push({
        date: currentDate.toISOString().split('T')[0],
        value: parseFloat(rate.toFixed(2))
      });

      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return data;
  },

  /**
   * Generates data for inflation with realistic patterns
   * 
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @returns {Array<DataPoint>} Array of data points
   */
  generateInflationData: (startDate, endDate) => {
    const data = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Starting inflation rate
    let rate = 2.1;

    // Generate monthly data
    let currentDate = new Date(start);
    while (currentDate <= end) {
      // Baseline drift (inflation tends to move slowly)
      let drift = (Math.random() - 0.5) * 0.1;
      
      // Add seasonality
      const month = currentDate.getMonth();
      // Higher inflation in summer months due to travel/gas, lower in winter
      const seasonalEffect = month >= 5 && month <= 8 ? 0.15 : 
                             month >= 10 || month <= 1 ? -0.1 : 0;

      // Crisis and economic cycle effects
      let cyclicalEffect = 0;
      
      // 2008 crisis - deflationary pressure
      if (currentDate >= new Date("2008-09-01") && currentDate <= new Date("2009-06-30")) {
        cyclicalEffect -= 0.2;
        // Dramatic drop in late 2008
        if (currentDate >= new Date("2008-10-01") && currentDate <= new Date("2008-12-31")) {
          cyclicalEffect -= 0.4;
        }
      }
      
      // Post-crisis low inflation
      if (currentDate >= new Date("2009-07-01") && currentDate <= new Date("2016-12-31")) {
        cyclicalEffect -= 0.1;
      }
      
      // Gradually normalizing 2017-2019
      if (currentDate >= new Date("2017-01-01") && currentDate <= new Date("2019-12-31")) {
        const monthsSince2017 = (currentDate - new Date("2017-01-01")) / (1000 * 60 * 60 * 24 * 30);
        cyclicalEffect += Math.min(0.1, monthsSince2017 * 0.003);
      }
      
      // COVID effect - initial deflation then inflation
      if (currentDate >= new Date("2020-03-01") && currentDate <= new Date("2020-05-31")) {
        cyclicalEffect -= 0.3; // Initial deflationary shock
      }
      
      if (currentDate >= new Date("2021-03-01") && currentDate <= new Date("2022-12-31")) {
        // Post-COVID inflation spike
        cyclicalEffect += 0.4;
      }

      // Ensure persistent trends by using a modified random walk
      rate = rate * 0.98 + 0.02 * 2.0 + drift + seasonalEffect + cyclicalEffect;
      
      // Ensure reasonable bounds
      rate = Math.max(0.0, Math.min(9.0, rate));

      data.push({
        date: currentDate.toISOString().split('T')[0],
        value: parseFloat(rate.toFixed(2))
      });

      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return data;
  }
};

/**
 * Data generator function based on indicator
 * 
 * @param {string} indicator - Indicator code
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Array<DataPoint>} Array of data points
 */
const generateData = (indicator, startDate, endDate) => {
  switch (indicator) {
    case 'UNRATE':
      return DataGeneratorService.generateUnemploymentData(startDate, endDate);
    case 'GDP':
      return DataGeneratorService.generateGDPData(startDate, endDate);
    case 'FEDFUNDS':
      return DataGeneratorService.generateFedFundsData(startDate, endDate);
    case 'INFLATION':
      return DataGeneratorService.generateInflationData(startDate, endDate);
    default:
      return DataGeneratorService.generateUnemploymentData(startDate, endDate);
  }
};

/**
 * Transformation utility service
 */
const TransformationService = {
  /**
   * Apply data transformations to a dataset
   * 
   * @param {Array<DataPoint>} data - Original data points
   * @param {string} transformationType - Type of transformation to apply
   * @returns {Array<DataPoint>} Transformed data
   */
  transformData: (data, transformationType) => {
    if (!data || data.length === 0 || !transformationType || transformationType === 'raw') {
      return [...data]; // Return a copy of the original data
    }
  
    // Sort data by date
    const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
  
    switch (transformationType) {
      case 'mom': // Month-over-Month absolute change
        return sortedData.map((item, index) => {
          if (index === 0) return { ...item, value: 0 };
  
          return {
            ...item,
            value: parseFloat((item.value - sortedData[index - 1].value).toFixed(2))
          };
        });
  
      case 'mom_pct': // Month-over-Month percentage change
        return sortedData.map((item, index) => {
          if (index === 0) return { ...item, value: 0 };
  
          const prevValue = sortedData[index - 1].value;
  
          if (prevValue === 0) {
            return { ...item, value: 0 }; // Avoid division by zero
          }
  
          return {
            ...item,
            value: parseFloat(((item.value - prevValue) / Math.abs(prevValue) * 100).toFixed(2))
          };
        });
  
      case 'yoy': // Year-over-Year percentage change
        return sortedData.map((item) => {
          const currentDate = new Date(item.date);
  
          // Find data from approximately one year ago
          const yearAgoTarget = new Date(currentDate);
          yearAgoTarget.setFullYear(yearAgoTarget.getFullYear() - 1);
  
          // Find the closest matching data point from a year ago
          const yearAgoData = sortedData.find(d => {
            const dataDate = new Date(d.date);
            return Math.abs(dataDate - yearAgoTarget) < 45 * 24 * 60 * 60 * 1000; // Within ~45 days
          });
  
          if (!yearAgoData) {
            return { ...item, value: null }; // No year-ago data available
          }
  
          if (yearAgoData.value === 0) {
            return { ...item, value: null }; // Avoid division by zero
          }
  
          return {
            ...item,
            value: parseFloat(((item.value - yearAgoData.value) / Math.abs(yearAgoData.value) * 100).toFixed(2))
          };
        }).filter(item => item.value !== null);
  
      default:
        return [...data];
    }
  }
};

/**
 * Live data simulation utilities
 */
const LiveDataService = {
  /**
   * Generate correlated noise for live data simulation
   * 
   * @param {LiveDataConfig} config - Configuration for the indicator
   * @param {Object.<string, {value: number, change: number}>} currentValues - Current values for all indicators
   * @returns {number} Noise value
   */
  generateCorrelatedNoise: (config, currentValues) => {
    // Base random component - either normal or lognormal
    let noise;
  
    if (config.volatilityPattern === 'normal') {
      // Box-Muller transform for normal distribution
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      noise = z0 * config.volatility;
    } else if (config.volatilityPattern === 'lognormal') {
      // Log-normal distribution (always positive)
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      noise = Math.exp(z0 * config.volatility) - 1;
    } else if (config.volatilityPattern === 'step') {
      // Step function (like Fed decisions) - mostly flat with occasional steps
      if (Math.random() < 0.08) { // 8% chance of a move
        noise = Math.round(Math.random() > 0.5 ? 1 : -1) * config.tickInterval;
      } else {
        noise = 0;
      }
    } else {
      // Default to uniform
      noise = (Math.random() - 0.5) * 2 * config.volatility;
    }
  
    // Add correlations from other indicators
    let correlatedComponent = 0;
  
    if (config.correlations && currentValues) {
      Object.entries(config.correlations).forEach(([indicator, correlation]) => {
        if (currentValues[indicator] && currentValues[indicator].change) {
          // Scale the correlation effect by the relative volatilities
          const otherConfig = LIVE_DATA_CONFIG[indicator];
          const relativeScale = config.volatility / (otherConfig?.volatility || 1);
          correlatedComponent += correlation * currentValues[indicator].change * relativeScale;
        }
      });
    }
  
    return noise + correlatedComponent * 0.5; // Scale down the correlated component
  },
  
  /**
   * Generate a new live data point
   * 
   * @param {string} indicator - Indicator code
   * @param {number|null} prevValue - Previous value
   * @param {Object.<string, {value: number, change: number}>} allCurrentValues - Current values for all indicators
   * @returns {{value: number, change: number}} New value and change
   */
  generateLiveDataPoint: (indicator, prevValue, allCurrentValues) => {
    const config = LIVE_DATA_CONFIG[indicator];
    
    // Start with base value if no previous value
    const baseValue = prevValue === null ? config.baseValue : prevValue;
    
    // Generate correlated noise
    const noise = LiveDataService.generateCorrelatedNoise(config, allCurrentValues);
    
    // Add mean reversion component
    const meanReversion = (config.baseValue - baseValue) * config.meanReversion;
    
    // Calculate raw change
    let rawChange = noise + meanReversion;
    
    // Quantize to tick size if specified
    if (config.tickInterval) {
      rawChange = Math.round(rawChange / config.tickInterval) * config.tickInterval;
    }
    
    // Calculate new value
    let newValue = baseValue + rawChange;
    
    // Ensure reasonable bounds based on indicator
    if (indicator === 'UNRATE') {
      newValue = Math.max(3.0, Math.min(10.0, newValue));
    } else if (indicator === 'FEDFUNDS') {
      newValue = Math.max(0.0, Math.min(8.0, newValue));
    } else if (indicator === 'GDP') {
      newValue = Math.max(15.0, Math.min(30.0, newValue));
    } else if (indicator === 'INFLATION') {
      newValue = Math.max(0.0, Math.min(15.0, newValue));
    }
    
    return {
      value: parseFloat(newValue.toFixed(2)),
      change: parseFloat((newValue - baseValue).toFixed(2))
    };
  }
};

/**
 * Calculate statistics for a dataset
 * 
 * @param {Array<DataPoint>} data - Chart data
 * @returns {Object} Statistical measures
 */
const calculateStatistics = (data) => {
  if (!data || data.length === 0) {
    return {
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      stdDev: 0,
      count: 0
    };
  }

  try {
    const values = data.map(d => d.value).filter(v => !isNaN(v));
    
    if (values.length === 0) {
      return {
        min: 0,
        max: 0,
        mean: 0,
        median: 0,
        stdDev: 0,
        count: 0
      };
    }
    
    return {
      min: math.min(values),
      max: math.max(values),
      mean: math.mean(values),
      median: math.median(values),
      stdDev: math.std(values),
      count: values.length
    };
  } catch (error) {
    console.error("Error calculating statistics:", error);
    return {
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      stdDev: 0,
      count: 0
    };
  }
};

// UI Components

/**
 * Simple component for displaying error messages
 * 
 * @param {Object} props - Component props
 * @param {string} props.message - Error message
 * @param {Function} props.onDismiss - Dismiss handler
 * @returns {React.ReactElement|null}
 */
const ErrorMessage = React.memo(({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div
      className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded flex justify-between items-center"
      role="alert"
      aria-live="assertive"
    >
      <p>{message}</p>
      <button
        className="text-red-700 font-bold hover:text-red-900 ml-2 focus:outline-none focus:ring-2 focus:ring-red-500"
        onClick={onDismiss}
        aria-label="Dismiss error"
        type="button"
      >
        ✕
      </button>
    </div>
  );
});

/**
 * Loading indicator component
 * 
 * @param {Object} props - Component props
 * @param {string} [props.message="Loading..."] - Loading message
 * @returns {React.ReactElement}
 */
const LoadingIndicator = React.memo(({ message = "Loading..." }) => (
  <div className="h-full flex items-center justify-center" aria-busy="true" role="status">
    <div className="flex flex-col items-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
      <p className="text-gray-500">{message}</p>
    </div>
  </div>
));

/**
 * Empty state component
 * 
 * @param {Object} props - Component props
 * @param {string} props.message - Empty state message
 * @param {Function} [props.action] - Action handler
 * @param {string} [props.actionLabel] - Action button label
 * @returns {React.ReactElement}
 */
const EmptyState = React.memo(({ message, action, actionLabel }) => (
  <div className="h-full flex items-center justify-center">
    <div className="bg-gray-50 p-8 rounded-lg text-center max-w-md">
      <p className="text-gray-500 mb-4">{message}</p>
      {action && actionLabel && (
        <button
          onClick={action}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500"
          type="button"
        >
          {actionLabel}
        </button>
      )}
    </div>
  </div>
));

/**
 * Custom tooltip for chart
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.active - Is tooltip active
 * @param {Array} props.payload - Chart payload
 * @param {string} props.label - X-axis label
 * @param {string} props.indicator - Current indicator
 * @param {string} props.transformation - Current transformation
 * @returns {React.ReactElement|null}
 */
const CustomTooltip = React.memo(({ active, payload, label, indicator, transformation }) => {
  if (active && payload && payload.length) {
    const indicatorInfo = INDICATORS[indicator] || {};
    const transformInfo = TRANSFORMATIONS.find(t => t.id === transformation) || {};
    const isPercentChange = transformation === 'mom_pct' || transformation === 'yoy';

    return (
      <div className="bg-white p-3 border border-gray-200 shadow-md rounded">
        <p className="text-gray-600 text-sm font-medium">{new Date(label).toLocaleDateString()}</p>
        <p className="text-blue-600 font-medium text-lg">
          {payload[0].value.toFixed(2)}{isPercentChange ? '%' : indicatorInfo.unit ? ` ${indicatorInfo.unit}` : ''}
        </p>
        <p className="text-gray-500 text-xs">{transformInfo.name || 'Value'}</p>
      </div>
    );
  }

  return null;
});

/**
 * Live data card component
 * 
 * @param {Object} props - Component props
 * @param {string} props.indicator - Indicator code
 * @param {number} props.value - Current value
 * @param {number} props.change - Change from previous value
 * @param {string} props.lastUpdated - ISO date string of last update
 * @returns {React.ReactElement}
 */
const LiveDataCard = React.memo(({ indicator, value, change, lastUpdated }) => {
  const indicatorInfo = INDICATORS[indicator];
  const isPositiveChange = change >= 0;
  
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-gray-700">{indicatorInfo.name}</h3>
        <span 
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            isPositiveChange ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {isPositiveChange ? '+' : ''}{change}{indicatorInfo.unit}
        </span>
      </div>
      <p className="text-2xl font-bold">{value}{indicatorInfo.unit}</p>
      <p className="text-xs text-gray-500 mt-2">
        Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Never'}
      </p>
    </div>
  );
});

/**
 * Live chart component
 * 
 * @param {Object} props - Component props
 * @param {Array} props.data - Chart data
 * @param {Array<string>} props.indicators - Enabled indicators
 * @returns {React.ReactElement}
 */
const LiveChart = React.memo(({ data, indicators }) => {
  if (!data || !data.length) {
    return <div className="h-full flex items-center justify-center text-gray-400">No data available</div>;
  }
  
  // Determine which indicators should use the right axis
  const rightAxisIndicators = indicators.filter(ind => 
    LIVE_DATA_CONFIG[ind] && LIVE_DATA_CONFIG[ind].displayOnSecondaryAxis
  );
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="timestamp" 
          tick={{ fontSize: 10 }}
          tickFormatter={(time) => new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        />
        <YAxis 
          yAxisId="left" 
          orientation="left" 
          tick={{ fontSize: 10 }} 
          domain={['auto', 'auto']}
          tickFormatter={(v) => v.toFixed(1)}
        />
        <YAxis 
          yAxisId="right" 
          orientation="right" 
          tick={{ fontSize: 10 }}
          domain={['auto', 'auto']}
          tickFormatter={(v) => v.toFixed(1)}
        />
        <Tooltip 
          formatter={(value, name) => {
            const indicatorInfo = INDICATORS[name] || {};
            return [
              `${parseFloat(value).toFixed(2)}${indicatorInfo.unit || ''}`, 
              (INDICATORS[name] ? INDICATORS[name].name : name)
            ];
          }}
          labelFormatter={(label) => new Date(label).toLocaleTimeString()}
        />
        <Legend />
        
        {indicators.map(indicator => {
          const config = LIVE_DATA_CONFIG[indicator];
          const useRightAxis = rightAxisIndicators.includes(indicator);
          
          return (
            <Line 
              key={indicator}
              yAxisId={useRightAxis ? 'right' : 'left'}
              type="monotone" 
              dataKey={indicator} 
              name={INDICATORS[indicator].name} 
              stroke={config.color}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              connectNulls={true}
            />
          );
        })}
      </LineChart>
    </ResponsiveContainer>
  );
});

/**
 * Tab navigation component
 * 
 * @param {Object} props - Component props
 * @param {string} props.selectedTab - Currently selected tab
 * @param {Function} props.onTabChange - Tab change handler
 * @param {number} props.watchlistCount - Number of items in watchlist
 * @returns {React.ReactElement}
 */
const TabNavigation = React.memo(({ selectedTab, onTabChange, watchlistCount }) => {
  return (
    <div className="mb-6">
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px" role="tablist">
          <button
            onClick={() => onTabChange('explore')}
            className={`mr-4 py-2 px-4 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              selectedTab === 'explore'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            role="tab"
            aria-selected={selectedTab === 'explore'}
            aria-controls="panel-explore"
            id="tab-explore"
            type="button"
          >
            Explore Data
          </button>
          <button
            onClick={() => onTabChange('watchlist')}
            className={`mr-4 py-2 px-4 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              selectedTab === 'watchlist'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            role="tab"
            aria-selected={selectedTab === 'watchlist'}
            aria-controls="panel-watchlist"
            id="tab-watchlist"
            type="button"
          >
            Watchlist ({watchlistCount})
          </button>
          <button
            onClick={() => onTabChange('live')}
            className={`py-2 px-4 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              selectedTab === 'live'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            role="tab"
            aria-selected={selectedTab === 'live'}
            aria-controls="panel-live"
            id="tab-live"
            type="button"
          >
            Live Data
          </button>
        </nav>
      </div>
    </div>
  );
});

/**
 * Statistics panel component
 * 
 * @param {Object} props - Component props
 * @param {Object} props.statistics - Statistical measures
 * @param {string} props.transformation - Current transformation
 * @returns {React.ReactElement}
 */
const StatisticsPanel = React.memo(({ statistics, transformation }) => {
  const transformInfo = TRANSFORMATIONS.find(t => t.id === transformation) || {};
  const isPercentage = transformation === 'mom_pct' || transformation === 'yoy';
  
  return (
    <div className="bg-gray-50 p-4 rounded">
      <h3 className="text-lg font-semibold mb-2">
        Statistics ({transformInfo.name || "Raw"} data)
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div>
          <p className="text-sm text-gray-500">Min</p>
          <p className="text-xl font-medium">
            {statistics.min.toFixed(2)}
            {isPercentage ? '%' : ''}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Max</p>
          <p className="text-xl font-medium">
            {statistics.max.toFixed(2)}
            {isPercentage ? '%' : ''}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Average</p>
          <p className="text-xl font-medium">
            {statistics.mean.toFixed(2)}
            {isPercentage ? '%' : ''}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Median</p>
          <p className="text-xl font-medium">
            {statistics.median.toFixed(2)}
            {isPercentage ? '%' : ''}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Std Dev</p>
          <p className="text-xl font-medium">
            {statistics.stdDev.toFixed(2)}
            {isPercentage ? '%' : ''}
          </p>
        </div>
      </div>
    </div>
  );
});

/**
 * WatchlistItem component
 * 
 * @param {Object} props - Component props
 * @param {WatchlistItem} props.item - Watchlist item data
 * @param {Function} props.onRemove - Remove handler
 * @returns {React.ReactElement}
 */
const WatchlistItemComponent = React.memo(({ item, onRemove }) => {
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-lg font-medium">{item.name}</h3>
          <p className="text-sm text-gray-500">
            {item.transformationName}
          </p>
          <p className="text-xs text-gray-400">
            Added: {new Date(item.dateAdded).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={() => onRemove(item.id)}
          className="text-red-500 hover:text-red-700 text-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
          aria-label={`Remove ${item.name} from watchlist`}
          type="button"
        >
          Remove
        </button>
      </div>
      <div className="h-48 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={item.data || []}
            margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
          >
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10 }}
              domain={['auto', 'auto']}
            />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3B82F6"
              dot={false}
              strokeWidth={1.5}
              name={item.name}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

/**
 * ExploreDataTab component
 * 
 * @param {Object} props - Component props
 * @param {Array<DataPoint>} props.chartData - Chart data
 * @param {boolean} props.isLoading - Loading state
 * @param {Function} props.updateChart - Update chart handler
 * @param {Function} props.addToWatchlist - Add to watchlist handler
 * @param {Object} props.state - Component state 
 * @param {Function} props.setState - State update function
 * @param {Object} props.statistics - Statistical measures
 * @returns {React.ReactElement}
 */
const ExploreDataTab = React.memo(({
  chartData,
  isLoading,
  updateChart,
  addToWatchlist,
  state,
  setState,
  statistics
}) => {
  const {
    selectedIndicator,
    selectedTimeFrame,
    selectedTransformation,
    startDate,
    endDate
  } = state;

  const indicatorDetails = INDICATORS[selectedIndicator] || {};
  const transformationDetails = TRANSFORMATIONS.find(t => t.id === selectedTransformation) || {};

  return (
    <div
      className="bg-white shadow rounded-lg p-6"
      role="tabpanel"
      id="panel-explore"
      aria-labelledby="tab-explore"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Data Source / Indicator */}
        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-1"
            htmlFor="indicator"
          >
            Indicator
          </label>
          <select
            id="indicator"
            value={selectedIndicator}
            onChange={(e) => setState(prev => ({ ...prev, selectedIndicator: e.target.value }))}
            className="w-full p-2 border rounded bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {Object.keys(INDICATORS).map(id => (
              <option key={id} value={id}>{INDICATORS[id].name}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {indicatorDetails.description}
          </p>
        </div>

        {/* Time Frame */}
        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-1"
            htmlFor="timeframe"
          >
            Time Frame
          </label>
          <select
            id="timeframe"
            value={selectedTimeFrame}
            onChange={(e) => setState(prev => ({ ...prev, selectedTimeFrame: e.target.value }))}
            className="w-full p-2 border rounded bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annual">Annual</option>
          </select>
        </div>

        {/* Transformation */}
        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-1"
            htmlFor="transformation"
          >
            Transformation
          </label>
          <select
            id="transformation"
            value={selectedTransformation}
            onChange={(e) => setState(prev => ({ ...prev, selectedTransformation: e.target.value }))}
            className="w-full p-2 border rounded bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {TRANSFORMATIONS.map(transform => (
              <option key={transform.id} value={transform.id}>{transform.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        {/* Date Range */}
        <div className="flex items-center gap-2">
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              htmlFor="start-date"
            >
              Start Date
            </label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setState(prev => ({ ...prev, startDate: e.target.value }))}
              className="p-2 border rounded bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              max={endDate}
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              htmlFor="end-date"
            >
              End Date
            </label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setState(prev => ({ ...prev, endDate: e.target.value }))}
              className="p-2 border rounded bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min={startDate}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-end gap-2">
          <button
            onClick={updateChart}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
            type="button"
          >
            {isLoading ? 'Loading...' : 'Update Chart'}
          </button>

          <button
            onClick={addToWatchlist}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition duration-150 focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={isLoading}
            type="button"
          >
            Add to Watchlist
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-96 mb-4">
        {isLoading ? (
          <LoadingIndicator message="Loading chart data..." />
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                angle={-30}
                textAnchor="end"
                minTickGap={30}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                domain={['auto', 'auto']}
                tickFormatter={(value) => {
                  const isPercentage = selectedTransformation === 'mom_pct' || selectedTransformation === 'yoy';
                  return `${value}${isPercentage ? '%' : ''}`;
                }}
              />
              <Tooltip content={<CustomTooltip indicator={selectedIndicator} transformation={selectedTransformation} />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                name={indicatorDetails.name || selectedIndicator}
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 6 }}
              />

              {/* Financial Crisis Markers */}
              {selectedTransformation === 'raw' && FINANCIAL_CRISES.map(crisis => {
                if (crisis.date) {
                  const crisisDate = new Date(crisis.date);
                  // Only show if within the current date range
                  if (crisisDate >= new Date(startDate) && crisisDate <= new Date(endDate)) {
                    return (
                      <ReferenceLine
                        key={crisis.name}
                        x={crisis.date}
                        stroke="red"
                        strokeDasharray="3 3"
                        label={{
                          value: crisis.name,
                          position: 'top',
                          fill: 'red',
                          fontSize: 10
                        }}
                      />
                    );
                  }
                } else if (crisis.startDate && crisis.endDate) {
                  const startDate2 = new Date(crisis.startDate);
                  const endDate2 = new Date(crisis.endDate);

                  // Check if crisis period overlaps with chart period
                  if (startDate2 <= new Date(endDate) && endDate2 >= new Date(startDate)) {
                    return (
                      <ReferenceArea
                        key={crisis.name}
                        x1={crisis.startDate}
                        x2={crisis.endDate}
                        fill="rgba(255, 0, 0, 0.1)"
                        stroke="red"
                        strokeOpacity={0.5}
                        label={{
                          value: crisis.name,
                          position: 'insideTopLeft',
                          fill: 'red',
                          fontSize: 10
                        }}
                      />
                    );
                  }
                }
                return null;
              })}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState
            message="No data available. Try adjusting your filters or date range."
            action={updateChart}
            actionLabel="Retry"
          />
        )}
      </div>

      {/* Statistics */}
      {!isLoading && chartData.length > 0 && (
        <StatisticsPanel statistics={statistics} transformation={selectedTransformation} />
      )}
    </div>
  );
});

/**
 * WatchlistTab component
 * 
 * @param {Object} props - Component props
 * @param {Array<WatchlistItem>} props.watchlist - Watchlist items
 * @param {Function} props.removeFromWatchlist - Remove handler
 * @param {Function} props.clearWatchlist - Clear watchlist handler
 * @param {Function} props.onTabChange - Tab change handler
 * @returns {React.ReactElement}
 */
const WatchlistTab = React.memo(({
  watchlist,
  removeFromWatchlist,
  clearWatchlist,
  onTabChange
}) => {
  return (
    <div
      className="bg-white shadow rounded-lg p-6"
      role="tabpanel"
      id="panel-watchlist"
      aria-labelledby="tab-watchlist"
    >
      <h2 className="text-xl font-semibold mb-4">Your Watchlist</h2>
      {watchlist.length === 0 ? (
        <EmptyState
          message="Your watchlist is empty."
          action={() => onTabChange('explore')}
          actionLabel="Go to Explore Tab to Add Indicators"
        />
      ) : (
        <>
          <div className="mb-4 flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Showing {watchlist.length} {watchlist.length === 1 ? 'item' : 'items'}
            </p>
            <button
              onClick={clearWatchlist}
              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition duration-150 focus:outline-none focus:ring-2 focus:ring-red-500"
              type="button"
            >
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {watchlist.map(item => (
              <WatchlistItemComponent 
                key={item.id} 
                item={item} 
                onRemove={removeFromWatchlist} 
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
});

/**
 * LiveDataTab component
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isLiveConnected - Connection state
 * @param {Function} props.toggleLiveConnection - Connection toggle handler
 * @param {Object} props.liveValues - Current live values
 * @param {Array} props.liveData - Live chart data
 * @param {Array<string>} props.selectedLiveIndicators - Enabled indicators
 * @param {Function} props.toggleLiveIndicator - Indicator toggle handler
 * @param {Object} props.performanceMetrics - Performance metrics
 * @returns {React.ReactElement}
 */
const LiveDataTab = React.memo(({
  isLiveConnected,
  toggleLiveConnection,
  liveValues,
  liveData,
  selectedLiveIndicators,
  toggleLiveIndicator,
  performanceMetrics
}) => {
  return (
    <div
      className="bg-white shadow rounded-lg p-6"
      role="tabpanel"
      id="panel-live"
      aria-labelledby="tab-live"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Live Data Feed</h2>
        <div className="flex items-center gap-4">
          <p className="text-sm font-medium">
            Status: 
            <span className={`ml-1 font-semibold ${isLiveConnected ? 'text-green-600' : 'text-yellow-600'}`}>
              {isLiveConnected ? 'Connected' : 'Disconnected'}
            </span>
          </p>
          <button
            onClick={toggleLiveConnection}
            className={`px-4 py-2 text-white rounded text-sm transition duration-150 focus:outline-none focus:ring-2 ${
              isLiveConnected 
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            }`}
            type="button"
          >
            {isLiveConnected ? 'Disconnect' : 'Connect to Live Data'}
          </button>
        </div>
      </div>
      
      {isLiveConnected ? (
        <>
          {/* Live Data Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Object.entries(liveValues).map(([indicator, data]) => (
              <LiveDataCard 
                key={indicator}
                indicator={indicator}
                value={data.value}
                change={data.change}
                lastUpdated={data.lastUpdated}
              />
            ))}
          </div>
          
          {/* Indicator Selection */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Select indicators to display:</p>
            <div className="flex flex-wrap gap-2">
              {Object.keys(LIVE_DATA_CONFIG).map(indicator => (
                <button
                  key={indicator}
                  onClick={() => toggleLiveIndicator(indicator)}
                  className={`px-3 py-1 text-sm rounded-full transition duration-150 ${
                    selectedLiveIndicators.includes(indicator)
                      ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                  type="button"
                >
                  {INDICATORS[indicator].name}
                </button>
              ))}
            </div>
          </div>
          
          {/* Live Chart */}
          <div className="h-96 mt-6">
            <h3 className="text-lg font-medium mb-4">Real-time Monitoring</h3>
            <LiveChart 
              data={liveData} 
              indicators={selectedLiveIndicators}
            />
          </div>
          
          {/* Performance Metrics */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded text-center">
              <p className="text-sm text-gray-500">Update Frequency</p>
              <p className="text-xl font-medium">{(LIVE_UPDATE_INTERVAL / 1000).toFixed(1)}s</p>
            </div>
            <div className="p-4 bg-gray-50 rounded text-center">
              <p className="text-sm text-gray-500">Data Points</p>
              <p className="text-xl font-medium">{liveData.length}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded text-center">
              <p className="text-sm text-gray-500">Avg. Update Time</p>
              <p className="text-xl font-medium">{performanceMetrics.averageUpdateTime.toFixed(2)}ms</p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded text-sm text-gray-600">
            <p className="font-medium">About Live Data Simulation</p>
            <p className="mt-2">
              This simulates real-time financial data updates with realistic volatility patterns
              and inter-indicator correlations. Data points are generated every {LIVE_UPDATE_INTERVAL/1000} seconds
              using advanced statistical models with features like:
            </p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Mean reversion - values tend to return to baseline over time</li>
              <li>Indicator-specific volatility and distribution patterns</li>
              <li>Realistic correlations between economic indicators</li>
              <li>Appropriate tick sizes for different indicators (e.g., 25bp for Fed Funds)</li>
            </ul>
          </div>
        </>
      ) : (
        <div className="text-center p-12 bg-gray-50 rounded-lg">
          <div className="mb-4 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-6">
            Connect to receive institutional-grade simulated real-time updates for key economic indicators.
            This dashboard uses advanced stochastic models to generate realistic data patterns with proper
            correlations and volatility characteristics.
          </p>
          <button
            onClick={toggleLiveConnection}
            className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="button"
          >
            Start Live Connection
          </button>
        </div>
      )}
    </div>
  );
});

/**
 * Main Dashboard component
 * @returns {React.ReactElement}
 */
const Dashboard = () => {
  // Basic state management
  const [selectedTab, setSelectedTab] = useState('explore');
  const [rawData, setRawData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [startDate, setStartDate] = useState('2000-01-01');
  const [endDate, setEndDate] = useState('2023-12-31');
  const [selectedIndicator, setSelectedIndicator] = useState('UNRATE');
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('monthly');
  const [selectedTransformation, setSelectedTransformation] = useState('raw');
  const [watchlist, setWatchlist] = useState([]);
  
  // Live data state
  const [liveData, setLiveData] = useState([]);
  const [liveValues, setLiveValues] = useState({});
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [liveUpdateInterval, setLiveUpdateInterval] = useState(null);
  const [selectedLiveIndicators, setSelectedLiveIndicators] = useState(['UNRATE', 'FEDFUNDS']);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    updateCount: 0,
    lastUpdateTime: 0,
    averageUpdateTime: 0
  });

  // Get indicator details
  const indicatorDetails = useMemo(() => {
    return INDICATORS[selectedIndicator] || {};
  }, [selectedIndicator]);

  // Get transformation details
  const transformationDetails = useMemo(() => {
    return TRANSFORMATIONS.find(t => t.id === selectedTransformation) || {};
  }, [selectedTransformation]);

  // Calculate statistics for the data
  const statistics = useMemo(() => {
    return calculateStatistics(chartData);
  }, [chartData]);

  // Generate data when indicator, transformation, or dates change
  useEffect(() => {
    if (rawData.length === 0) {
      return;
    }

    try {
      const transformed = TransformationService.transformData(rawData, selectedTransformation);
      setChartData(transformed);
    } catch (error) {
      console.error("Error applying transformation:", error);
      setError("Error applying transformation. Showing raw data instead.");
      setChartData([...rawData]);
    }
  }, [rawData, selectedTransformation]);

  // Handler for updating chart data
  const updateChart = useCallback(() => {
    setIsLoading(true);
    setError('');

    try {
      // Simulate API call with setTimeout
      setTimeout(() => {
        const newData = generateData(selectedIndicator, startDate, endDate);
        setRawData(newData);
        setLastUpdated(new Date());
        setIsLoading(false);
      }, 800);
    } catch (err) {
      setError(`Error fetching data: ${err.message}`);
      setIsLoading(false);
    }
  }, [selectedIndicator, startDate, endDate]);

  // Initial data load
  useEffect(() => {
    updateChart();
    
    // Clean up live data connection on component unmount
    return () => {
      if (liveUpdateInterval) {
        clearInterval(liveUpdateInterval);
      }
    };
  }, []);

  // Live data connection management
  const toggleLiveConnection = useCallback(() => {
    if (isLiveConnected) {
      // Disconnect
      if (liveUpdateInterval) {
        clearInterval(liveUpdateInterval);
        setLiveUpdateInterval(null);
      }
      setIsLiveConnected(false);
    } else {
      // Connect and initialize
      const initialData = [];
      const initialValues = {};
      
      // Create initial values
      Object.keys(LIVE_DATA_CONFIG).forEach(indicator => {
        initialValues[indicator] = {
          value: LIVE_DATA_CONFIG[indicator].baseValue,
          change: 0,
          lastUpdated: new Date().toISOString()
        };
      });
      
      // Create initial data points with all indicators at base values
      for (let i = 0; i < LIVE_DATA_POINTS; i++) {
        const timestamp = new Date(Date.now() - (LIVE_DATA_POINTS - i - 1) * LIVE_UPDATE_INTERVAL).toISOString();
        
        const dataPoint = { timestamp };
        Object.keys(LIVE_DATA_CONFIG).forEach(indicator => {
          dataPoint[indicator] = LIVE_DATA_CONFIG[indicator].baseValue;
        });
        
        initialData.push(dataPoint);
      }
      
      setLiveData(initialData);
      setLiveValues(initialValues);
      setPerformanceMetrics({
        updateCount: 0,
        lastUpdateTime: 0,
        averageUpdateTime: 0
      });
      
      // Start live updates
      const intervalId = setInterval(() => {
        const startTime = performance.now();
        const timestamp = new Date().toISOString();
        
        // Update values for each indicator
        const newValues = {...liveValues};
        const newDataPoint = { timestamp };
        
        Object.keys(LIVE_DATA_CONFIG).forEach(indicator => {
          const prev = newValues[indicator]?.value || LIVE_DATA_CONFIG[indicator].baseValue;
          const result = LiveDataService.generateLiveDataPoint(indicator, prev, newValues);
          
          newValues[indicator] = {
            value: result.value,
            change: result.change,
            lastUpdated: timestamp
          };
          
          newDataPoint[indicator] = result.value;
        });
        
        // Update state
        setLiveValues(prevValues => newValues);
        setLiveData(currentData => {
          const newData = [...currentData, newDataPoint];
          if (newData.length > LIVE_DATA_POINTS) {
            return newData.slice(newData.length - LIVE_DATA_POINTS);
          }
          return newData;
        });
        
        // Update performance metrics
        const endTime = performance.now();
        const updateTime = endTime - startTime;
        
        setPerformanceMetrics(prev => {
          const newCount = prev.updateCount + 1;
          const newAverage = ((prev.averageUpdateTime * prev.updateCount) + updateTime) / newCount;
          
          return {
            updateCount: newCount,
            lastUpdateTime: updateTime,
            averageUpdateTime: newAverage
          };
        });
      }, LIVE_UPDATE_INTERVAL);
      
      setLiveUpdateInterval(intervalId);
      setIsLiveConnected(true);
    }
  }, [isLiveConnected, liveValues, liveUpdateInterval]);

  // Toggle live indicator
  const toggleLiveIndicator = useCallback((indicator) => {
    setSelectedLiveIndicators(prev => 
      prev.includes(indicator) 
        ? prev.filter(i => i !== indicator) 
        : [...prev, indicator]
    );
  }, []);

  // Add to watchlist
  const addToWatchlist = useCallback(() => {
    const newItem = {
      id: `item-${Date.now()}`,
      name: `${indicatorDetails.name || selectedIndicator}`,
      indicator: selectedIndicator,
      startDate,
      endDate,
      transformation: selectedTransformation,
      transformationName: transformationDetails.name || 'Raw Data',
      dateAdded: new Date().toISOString(),
      data: [...chartData]
    };

    // Check for duplicates
    const isDuplicate = watchlist.some(item =>
      item.indicator === selectedIndicator &&
      item.transformation === selectedTransformation
    );

    if (isDuplicate) {
      setError("This indicator is already in your watchlist.");
      return;
    }

    setWatchlist(prev => [...prev, newItem]);
  }, [selectedIndicator, indicatorDetails, startDate, endDate, selectedTransformation, transformationDetails, chartData, watchlist]);

  // Remove from watchlist
  const removeFromWatchlist = useCallback((id) => {
    setWatchlist(prev => prev.filter(item => item.id !== id));
  }, []);

  // Clear watchlist with confirmation
  const clearWatchlist = useCallback(() => {
    if (window.confirm("Are you sure you want to clear all items from your watchlist?")) {
      setWatchlist([]);
    }
  }, []);

  // Consolidated state for ExploreDataTab
  const exploreState = {
    selectedIndicator,
    selectedTimeFrame,
    selectedTransformation,
    startDate,
    endDate
  };

  // Update explore state
  const setExploreState = useCallback((newState) => {
    setSelectedIndicator(newState.selectedIndicator || selectedIndicator);
    setSelectedTimeFrame(newState.selectedTimeFrame || selectedTimeFrame);
    setSelectedTransformation(newState.selectedTransformation || selectedTransformation);
    setStartDate(newState.startDate || startDate);
    setEndDate(newState.endDate || endDate);
  }, [selectedIndicator, selectedTimeFrame, selectedTransformation, startDate, endDate]);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Financial Data Dashboard</h1>
          <div className="text-xs text-gray-500">
            {lastUpdated && (
              <p>Last updated: {lastUpdated.toLocaleString()}</p>
            )}
            <p>v{APP_VERSION}</p>
          </div>
        </header>

        {/* Error message display */}
        <ErrorMessage message={error} onDismiss={() => setError('')} />

        {/* Tabs */}
        <TabNavigation 
          selectedTab={selectedTab} 
          onTabChange={setSelectedTab} 
          watchlistCount={watchlist.length} 
        />

        {/* Explore Data Tab */}
        {selectedTab === 'explore' && (
          <ExploreDataTab
            chartData={chartData}
            isLoading={isLoading}
            updateChart={updateChart}
            addToWatchlist={addToWatchlist}
            state={exploreState}
            setState={setExploreState}
            statistics={statistics}
          />
        )}

        {/* Watchlist Tab */}
        {selectedTab === 'watchlist' && (
          <WatchlistTab
            watchlist={watchlist}
            removeFromWatchlist={removeFromWatchlist}
            clearWatchlist={clearWatchlist}
            onTabChange={setSelectedTab}
          />
        )}

        {/* Live Data Tab */}
        {selectedTab === 'live' && (
          <LiveDataTab
            isLiveConnected={isLiveConnected}
            toggleLiveConnection={toggleLiveConnection}
            liveValues={liveValues}
            liveData={liveData}
            selectedLiveIndicators={selectedLiveIndicators}
            toggleLiveIndicator={toggleLiveIndicator}
            performanceMetrics={performanceMetrics}
          />
        )}

        {/* Footer */}
        <footer className="mt-8 text-center text-xs text-gray-500">
          <p>Financial Data Dashboard v{APP_VERSION}</p>
          <p className="mt-1">
            © {new Date().getFullYear()} Your Company - All Rights Reserved
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Dashboard;