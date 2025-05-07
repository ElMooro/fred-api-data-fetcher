// Dashboard.js - Live Data Tab Section
// Ensure React, PropTypes, and Recharts (and specific components) are imported at the top of your actual Dashboard.js file.
// Example:
// import React, { useState, useEffect, useCallback, useRef } from 'react';
// import PropTypes from 'prop-types';
// import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';

// --- Constants and Configuration ---

/**
 * @constant {number} LIVE_UPDATE_INTERVAL_MS
 * Interval for live data updates in milliseconds.
 */
const LIVE_UPDATE_INTERVAL_MS = 3000; // 3 seconds

/**
 * @constant {number} MAX_LIVE_DATA_POINTS
 * Maximum number of data points to display in the live chart.
 */
const MAX_LIVE_DATA_POINTS = 30;

/**
 * @typedef {Object} IndicatorConfig
 * @property {string} name - Display name of the indicator.
 * @property {number} baseValue - The starting value for the simulation.
 * @property {number} volatility - Factor determining the randomness of value changes.
 * @property {string} unit - The unit of measurement for the indicator.
 * @property {string} color - Hex color code for the indicator's chart line.
 * @property {{min: number, max: number}} bounds - Min and max values for the simulation.
 */

/**
 * @constant {{[key: string]: IndicatorConfig}} LIVE_INDICATOR_CONFIGS
 * Configuration for each live economic indicator.
 * Place this at the top-level scope of your Dashboard.js file.
 */
const LIVE_INDICATOR_CONFIGS = {
  UNRATE: {
    name: "Unemployment Rate",
    baseValue: 3.8,
    volatility: 0.05, // Percentage volatility (e.g., 0.05 = 5% of base)
    unit: "%",
    color: "#3B82F6", // blue-500
    bounds: { min: 3.0, max: 10.0 },
  },
  GDP: {
    name: "Gross Domestic Product",
    baseValue: 21.5,
    volatility: 0.03,
    unit: " Trillion USD", // Note: leading space for display
    color: "#10B981", // green-500
    bounds: { min: 15.0, max: 30.0 },
  },
  FEDFUNDS: {
    name: "Federal Funds Rate",
    baseValue: 5.25,
    volatility: 0.03,
    unit: "%",
    color: "#F59E0B", // amber-500
    bounds: { min: 0.0, max: 8.0 },
  },
};

// --- Utility Functions ---

/**
 * Generates a new simulated data point for a given indicator.
 * Place this at the top-level scope of your Dashboard.js file.
 * @param {string} indicatorKey - The key of the indicator (e.g., 'UNRATE').
 * @param {number | null} previousValue - The previous value of the indicator.
 * @returns {{value: number, change: number}} The new value and the change from the previous value.
 */
const generateLiveDataPoint = (indicatorKey, previousValue = null) => {
  const config = LIVE_INDICATOR_CONFIGS[indicatorKey];
  if (!config) {
    console.error(`[Live Data] Configuration for indicator ${indicatorKey} not found.`);
    return { value: 0, change: 0 }; // Fallback
  }

  const base = previousValue === null ? config.baseValue : previousValue;
  // Volatility can be interpreted as a percentage of the current value or a fixed range.
  // This example uses volatility relative to the current base.
  const randomFactor = (Math.random() - 0.5) * 2; // -1 to 1
  const changeMagnitude = config.volatility * (base !== 0 ? base : config.baseValue); // Use baseValue if current base is 0
  let change = randomFactor * changeMagnitude;
  
  // For very small values, ensure change is not excessively small or zero leading to stagnation
  if (Math.abs(change) < 0.001 && base !== 0) {
    change = (Math.random() - 0.5) * 0.02; // Minimal absolute change for non-zero bases
  } else if (base === 0 && Math.abs(change) < 0.01) {
     change = (Math.random() - 0.5) * 0.02; // Ensure some movement if base is 0
  }


  let newValue = base + change;

  // Apply bounds
  newValue = Math.max(config.bounds.min, Math.min(config.bounds.max, newValue));

  return {
    value: parseFloat(newValue.toFixed(2)),
    change: parseFloat((newValue - base).toFixed(2)),
  };
};

// --- React Components ---

/**
 * @component LiveDataCard
 * Displays a single live data indicator metric.
 * Define this component in your Dashboard.js file, typically before the main Dashboard component.
 */
const LiveDataCard = React.memo(
  ({ indicatorKey, value, change, lastUpdated }) => {
    const indicatorConfig = LIVE_INDICATOR_CONFIGS[indicatorKey];

    if (!indicatorConfig) {
      return (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-red-500 font-medium">Error: Unknown Indicator (${indicatorKey})</p>
        </div>
      );
    }

    const isPositiveChange = change >= 0;
    const changeDisplay = change.toFixed(2);

    return (
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-gray-700 truncate" title={indicatorConfig.name}>{indicatorConfig.name}</h3>
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${ // Changed font-medium to font-semibold
              isPositiveChange && change !== 0
                ? "bg-green-100 text-green-800"
                : (!isPositiveChange && change !==0 ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800")
            }`}
          >
            {change !== 0 ? (isPositiveChange ? `+${changeDisplay}` : changeDisplay) : changeDisplay}
          </span>
        </div>
        <p className="text-2xl font-bold text-gray-900">
          {value.toFixed(2)}
          <span className="text-sm font-normal text-gray-600">{indicatorConfig.unit}</span>
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Last updated:{" "}
          {lastUpdated
            ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            : "Never"}
        </p>
      </div>
    );
  }
);

LiveDataCard.propTypes = {
  indicatorKey: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  change: PropTypes.number.isRequired,
  lastUpdated: PropTypes.string, // Can be null initially
};
LiveDataCard.displayName = 'LiveDataCard';

/**
 * @component LiveChart
 * Displays a line chart for selected live data indicators.
 * Define this component in your Dashboard.js file.
 */
const LiveChart = React.memo(({ chartData, selectedIndicatorKeys }) => {
  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 text-sm">
        Chart data will appear here once connected and indicators are selected.
      </div>
    );
  }
  const activeIndicators = selectedIndicatorKeys.filter(key => LIVE_INDICATOR_CONFIGS[key]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}> {/* Adjusted margins */}
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /> {/* Lighter grid */}
        <XAxis
          dataKey="timestamp"
          tick={{ fontSize: 10, fill: '#6b7280' }}
          tickFormatter={(time) =>
            new Date(time).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          }
          axisLine={{ stroke: '#d1d5db' }}
          tickLine={{ stroke: '#d1d5db' }}
        />
        <YAxis
          yAxisId="left"
          orientation="left"
          tick={{ fontSize: 10, fill: '#6b7280' }}
          tickFormatter={(value) => value.toFixed(1)}
          axisLine={{ stroke: '#d1d5db' }}
          tickLine={{ stroke: '#d1d5db' }}
          domain={['auto', 'auto']} // Ensure y-axis adapts
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 10, fill: '#6b7280' }}
          tickFormatter={(value) => value.toFixed(1)}
          axisLine={{ stroke: '#d1d5db' }}
          tickLine={{ stroke: '#d1d5db' }}
          domain={['auto', 'auto']} // Ensure y-axis adapts
        />
        <Tooltip
          contentStyle={{ backgroundColor: 'white', borderRadius: '0.375rem', borderColor: '#e5e7eb' }}
          itemStyle={{ fontSize: '0.875rem' }}
          formatter={(value, dataKey /* internal name */, itemPayload) => {
            // dataKey here is the actual key like "UNRATE"
            const config = LIVE_INDICATOR_CONFIGS[dataKey];
            return [
              `${parseFloat(value).toFixed(2)}${config?.unit || ''}`,
              config?.name || dataKey, // Display the descriptive name
            ];
          }}
          labelFormatter={(label) => `Time: ${new Date(label).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'})}`}
        />
        <Legend 
            iconSize={10} 
            wrapperStyle={{fontSize: "12px", paddingTop: "10px"}}
            formatter={(value, entry) => { // value is config.name passed from Line's name prop
                 return <span style={{ color: entry.color }}>{value}</span>;
            }}
        />

        {activeIndicators.map((indicatorKey) => {
          const config = LIVE_INDICATOR_CONFIGS[indicatorKey];
          // No need to check for config again due to filter above, but good practice
          if (!config) return null; 

          return (
            <Line
              key={indicatorKey}
              yAxisId={indicatorKey === "GDP" ? "right" : "left"} // Assign GDP to the right axis
              type="monotone"
              dataKey={indicatorKey}    // e.g., "UNRATE"
              name={config.name}        // e.g., "Unemployment Rate" - used by Tooltip/Legend's `formatter`
              stroke={config.color}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false} // Set to true for smoother transitions if performance allows
            />
          );
        })}
      </LineChart>
    </ResponsiveContainer>
  );
});

LiveChart.propTypes = {
  chartData: PropTypes.arrayOf(
    PropTypes.shape({
      timestamp: PropTypes.string.isRequired,
      // Other keys are dynamic based on indicators, e.g., UNRATE: PropTypes.number
    })
  ).isRequired,
  selectedIndicatorKeys: PropTypes.arrayOf(PropTypes.string).isRequired,
};
LiveChart.displayName = 'LiveChart';


// --- Main Dashboard Component Logic (to be integrated into your existing Dashboard.js) ---

// This function represents the content and logic for your "Live Data" tab.
// You'll integrate these hooks and JSX into your main Dashboard component structure.
function YourDashboardComponent_LiveTabData() {
  // State hooks for live data - These should go inside your main Dashboard component
  const [liveChartData, setLiveChartData] = React.useState([]);
  const [currentLiveValues, setCurrentLiveValues] = React.useState(() => {
    const initialValues = {};
    Object.keys(LIVE_INDICATOR_CONFIGS).forEach((key) => {
      initialValues[key] = {
        value: LIVE_INDICATOR_CONFIGS[key].baseValue,
        change: 0,
        lastUpdated: null, // Will be set on first connection
      };
    });
    return initialValues;
  });
  const [isLiveConnected, setIsLiveConnected] = React.useState(false);
  const liveUpdateIntervalRef = React.useRef(null);
  const [selectedLiveIndicatorKeys, setSelectedLiveIndicatorKeys] = React.useState([
    "UNRATE", // Default selected indicators for the chart
    "FEDFUNDS",
  ]);

  // Effect for initializing and clearing the interval
  React.useEffect(() => {
    // Cleanup function: clear interval when component unmounts or before re-connecting
    return () => {
      if (liveUpdateIntervalRef.current) {
        clearInterval(liveUpdateIntervalRef.current);
        liveUpdateIntervalRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures this runs once on mount and cleanup on unmount

  const handleToggleLiveConnection = React.useCallback(() => {
    if (isLiveConnected) {
      // Action: Disconnect
      if (liveUpdateIntervalRef.current) {
        clearInterval(liveUpdateIntervalRef.current);
        liveUpdateIntervalRef.current = null;
      }
      setIsLiveConnected(false);
      // Optionally, reset data or show a "Disconnected, historical data shown" message
      // setLiveChartData([]); // Clears chart
      // Or revert to base values for cards:
      // setCurrentLiveValues(prev => {
      //   const resetValues = {...prev};
      //   Object.keys(LIVE_INDICATOR_CONFIGS).forEach(key => {
      //     resetValues[key] = {
      //       ...resetValues[key],
      //       value: LIVE_INDICATOR_CONFIGS[key].baseValue,
      //       change: 0,
      //       // lastUpdated: null // or keep last known update time
      //     };
      //   });
      //   return resetValues;
      // });

    } else {
      // Action: Connect and Initialize
      const now = Date.now();
      const initialChartPoints = [];
      const baseTimestamp = now - (MAX_LIVE_DATA_POINTS * LIVE_UPDATE_INTERVAL_MS);

      for (let i = 0; i < MAX_LIVE_DATA_POINTS; i++) {
        const timestamp = new Date(
          baseTimestamp + i * LIVE_UPDATE_INTERVAL_MS
        ).toISOString();
        const dataPoint = { timestamp };
        Object.keys(LIVE_INDICATOR_CONFIGS).forEach((key) => {
          dataPoint[key] = LIVE_INDICATOR_CONFIGS[key].baseValue; // Start chart with base values
        });
        initialChartPoints.push(dataPoint);
      }
      setLiveChartData(initialChartPoints);
      
      // Set initial display values for cards with current timestamp
      const initialCardValues = {};
      const connectionTime = new Date().toISOString();
       Object.keys(LIVE_INDICATOR_CONFIGS).forEach(key => {
           initialCardValues[key] = {
               value: LIVE_INDICATOR_CONFIGS[key].baseValue,
               change: 0, // No change at the moment of connection
               lastUpdated: connectionTime
           };
       });
      setCurrentLiveValues(initialCardValues);
      
      setIsLiveConnected(true); // Set connected before starting interval

      // Start live updates
      liveUpdateIntervalRef.current = setInterval(() => {
        const currentTimestamp = new Date().toISOString();
        const newChartPoint = { timestamp: currentTimestamp };
        
        setCurrentLiveValues((prevCardValues) => {
          const newCardValues = { ...prevCardValues };
          Object.keys(LIVE_INDICATOR_CONFIGS).forEach((indicatorKey) => {
            const config = LIVE_INDICATOR_CONFIGS[indicatorKey];
            // Use the latest value from state for the previous value in simulation
            const previousIndicatorValue = prevCardValues[indicatorKey]?.value ?? config.baseValue;
            const { value: newValue, change } = generateLiveDataPoint(indicatorKey, previousIndicatorValue);
            
            newCardValues[indicatorKey] = {
              value: newValue,
              change: change,
              lastUpdated: currentTimestamp,
            };
            newChartPoint[indicatorKey] = newValue; // Add to the data point for the chart
          });
          return newCardValues;
        });

        setLiveChartData((prevChartData) => {
          const updatedChartData = [...prevChartData, newChartPoint];
          // Keep only the last MAX_LIVE_DATA_POINTS
          return updatedChartData.slice(-MAX_LIVE_DATA_POINTS); 
        });

      }, LIVE_UPDATE_INTERVAL_MS);
    }
  }, [isLiveConnected]); // Dependencies: re-create if isLiveConnected changes

  const handleIndicatorSelectionChange = (indicatorKey) => {
    setSelectedLiveIndicatorKeys((prevSelectedKeys) =>
      prevSelectedKeys.includes(indicatorKey)
        ? prevSelectedKeys.filter((key) => key !== indicatorKey)
        : [...prevSelectedKeys, indicatorKey]
    );
  };
  
  // The JSX below is what you would place inside your "Live Data" tab's rendering logic.
  // Example: {selectedTab === 'live' && ( /* JSX below */ )}

  return (
    <div
      className="bg-gray-50 shadow-sm rounded-lg p-4 sm:p-6" // Slightly reduced padding on small screens
      role="tabpanel"
      id="panel-live"
      aria-labelledby="tab-live"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-semibold text-gray-800">Live Data Feed</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <p className="text-sm font-medium text-gray-700 whitespace-nowrap"> 
            Status:
            <span
              className={`ml-1.5 py-0.5 px-2 rounded-full text-xs font-semibold ${
                isLiveConnected
                  ? "bg-green-100 text-green-700 ring-1 ring-green-200"
                  : "bg-yellow-100 text-yellow-700 ring-1 ring-yellow-200"
              }`}
            >
              {isLiveConnected ? "Connected" : "Disconnected"}
            </span>
          </p>
          <button
            type="button"
            onClick={handleToggleLiveConnection}
            className={`w-full sm:w-auto px-4 py-2 text-white rounded-md text-sm font-medium transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isLiveConnected
                ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
            }`}
            aria-live="polite" // Announces changes in connection status
          >
            {isLiveConnected ? "Disconnect" : "Connect to Live Data"}
          </button>
        </div>
      </div>

      {isLiveConnected ? (
        <>
          {/* Live Data Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {Object.entries(currentLiveValues)
             // Ensure we only try to render configured indicators for cards
             .filter(([key]) => LIVE_INDICATOR_CONFIGS[key]) 
             .map(([key, data]) => (
              <LiveDataCard
                key={key}
                indicatorKey={key}
                value={data.value}
                change={data.change}
                lastUpdated={data.lastUpdated}
              />
            ))}
          </div>

          {/* Indicator Selection for Chart */}
          <div className="mb-6 p-4 bg-white rounded-md border border-gray-200 shadow-sm">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Select indicators to display on chart:
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.keys(LIVE_INDICATOR_CONFIGS).map((key) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => handleIndicatorSelectionChange(key)}
                  className={`px-3 py-1.5 text-xs sm:text-sm rounded-full transition-all duration-150 font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                    selectedLiveIndicatorKeys.includes(key)
                      ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400"
                  }`}
                  aria-pressed={selectedLiveIndicatorKeys.includes(key)}
                >
                  {LIVE_INDICATOR_CONFIGS[key].name}
                </button>
              ))}
            </div>
          </div>

          {/* Live Chart */}
          <div className="h-96 min-h-[24rem] mt-6 bg-white p-4 rounded-md border border-gray-200 shadow-sm">
            <h3 className="text-lg font-medium text-gray-800 mb-2"> {/* Reduced margin */}
              Real-time Monitoring
            </h3>
            {selectedLiveIndicatorKeys.length > 0 ? (
                <LiveChart
                chartData={liveChartData}
                selectedIndicatorKeys={selectedLiveIndicatorKeys}
                />
            ) : (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                    Please select at least one indicator to display the chart.
                </div>
            )}
          </div>

          <div className="mt-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
            <p className="font-semibold">About Live Data Simulation</p>
            <p className="mt-1 text-blue-700">
              This dashboard simulates real-time financial data updates.
              Data points are generated every ${LIVE_UPDATE_INTERVAL_MS / 1000} seconds. This is for
              demonstration purposes only and does not represent actual market data.
            </p>
          </div>
        </>
      ) : (
        <div className="text-center p-10 sm:p-12 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="mb-4 text-blue-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                // A more generic "data stream" or "connection" icon
                d="M9.75 17.603c.292.388.644.713 1.027.965A7.5 7.5 0 0012 21a7.476 7.476 0 002.223-1.432c.383-.252.735-.577 1.027-.965m0 0c.384-.51.702-1.066.938-1.663a9.005 9.005 0 000-4.88c-.236-.597-.554-1.153-.938-1.663m-3.222 0c-.292-.388-.644-.713-1.027-.965A7.5 7.5 0 0012 3a7.476 7.476 0 00-2.223 1.432c-.383.252-.735.577-1.027.965m0 0c-.384.51-.702 1.066-.938 1.663a9.005 9.005 0 000 4.88c.236.597.554 1.153.938 1.663M12 6.375A2.625 2.625 0 1112 11.625 2.625 2.625 0 0112 6.375z" 
              />
            </svg>
          </div>
          <p className="text-gray-600 mb-6 text-sm sm:text-base max-w-md mx-auto">
            Connect to receive simulated real-time updates for key
            economic indicators. Data will demonstrate fluctuations in the selected metrics.
          </p>
          <button
            type="button"
            onClick={handleToggleLiveConnection}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
          >
            Start Live Connection
          </button>
        </div>
      )}
    </div>
  );
}

// To use this in your Dashboard.js:
// 1. Place LIVE_INDICATOR_CONFIGS and generateLiveDataPoint at the top-level module scope.
// 2. Define LiveDataCard and LiveChart components (also at module scope or imported).
// 3. Integrate the state hooks (useState, useRef), callback hooks (useCallback), 
//    and effect hooks (useEffect) from YourDashboardComponent_LiveTabData 
//    into your actual Dashboard component that renders the "Live Data" tab.
// 4. Replace the JSX content of your "Live Data" tab with the JSX returned by 
//    YourDashboardComponent_LiveTabData.
// 5. Ensure all necessary imports (React, PropTypes, Recharts components) are present.

