/**
 * Type definitions for Financial Dashboard
 */

/**
 * @typedef {Object} IndicatorDetails
 * @property {string} id - Unique identifier for the indicator
 * @property {string} name - Human-readable name of the indicator
 * @property {string} frequency - Data frequency (daily, weekly, monthly, etc.)
 * @property {string} unit - Unit of measurement
 * @property {string} description - Description of what the indicator measures
 * @property {number} baseValue - Base value for data generation
 * @property {number} volatility - Volatility factor for data generation
 * @property {number} trend - Trend factor for data generation
 */

/**
 * @typedef {Object} TransformationInfo
 * @property {string} id - Unique identifier for the transformation
 * @property {string} name - Human-readable name of the transformation
 * @property {string} description - Description of what the transformation does
 * @property {boolean} requiresHistory - Whether the transformation requires historical data
 * @property {string} [historyPeriod] - Time period needed for historical data
 * @property {string} [resultUnit] - Unit of the transformed data
 */

/**
 * @typedef {Object} DataPoint
 * @property {string} date - Date in ISO format (YYYY-MM-DD)
 * @property {number} value - Indicator value
 * @property {number} [rawValue] - Original raw value before transformation
 */

/**
 * @typedef {Object} WatchlistItem
 * @property {string} id - Unique identifier for the watchlist item
 * @property {string} source - Data source (e.g., FRED, ECB)
 * @property {string} indicator - Indicator ID
 * @property {string} name - Indicator name
 * @property {string} transformation - Transformation ID
 * @property {string} transformationName - Transformation name
 * @property {string} startDate - Start date in ISO format
 * @property {string} endDate - End date in ISO format
 * @property {string} frequency - Data frequency
 * @property {string} dateAdded - Date when the item was added to watchlist
 * @property {Object} metadata - Additional metadata
 * @property {string} metadata.unit - Unit of measurement
 * @property {string} metadata.description - Indicator description
 */

/**
 * @typedef {Object} Statistics
 * @property {number} min - Minimum value
 * @property {number} max - Maximum value
 * @property {number} mean - Mean value
 * @property {number} median - Median value
 * @property {number} stdDev - Standard deviation
 * @property {number} count - Number of data points
 */

/**
 * @typedef {Object} WebSocketMessage
 * @property {string} type - Message type
 * @property {string} timestamp - ISO timestamp
 * @property {Object} [data] - Message data
 * @property {Array} [errors] - Any errors in the message
 */

/**
 * @typedef {Object} CrisisEvent
 * @property {string} name - Crisis name
 * @property {string} [date] - Single date for point events
 * @property {string} [startDate] - Start date for period events
 * @property {string} [endDate] - End date for period events
 * @property {string} description - Description of the crisis
 * @property {string} severity - Crisis severity (medium, high, extreme)
 */
