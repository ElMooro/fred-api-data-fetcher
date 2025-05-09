import CONFIG from "../config";

// Calculate technical indicators
const calculateRSI = (data, periods = 14) => {
  if (data.length < periods + 1) return Array(data.length).fill(null);
  
  const rsiValues = Array(periods).fill(null);
  let gains = 0;
  let losses = 0;
  
  // Calculate initial average gain/loss
  for (let i = 1; i <= periods; i++) {
    const change = data[i].value - data[i-1].value;
    if (change >= 0) {
      gains += change;
    } else {
      losses -= change; // make positive
    }
  }
  
  let avgGain = gains / periods;
  let avgLoss = losses / periods;
  
  // Calculate RSI for remaining data points
  for (let i = periods; i < data.length; i++) {
    const change = data[i].value - data[i-1].value;
    
    // Update average gain/loss using smoothing method
    avgGain = ((avgGain * (periods - 1)) + (change > 0 ? change : 0)) / periods;
    avgLoss = ((avgLoss * (periods - 1)) + (change < 0 ? -change : 0)) / periods;
    
    // Calculate RS and RSI
    const rs = avgGain / (avgLoss === 0 ? 0.001 : avgLoss); // Avoid division by zero
    const rsi = 100 - (100 / (1 + rs));
    
    rsiValues.push(rsi);
  }
  
  return rsiValues;
};

const calculateMACD = (data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
  if (data.length < slowPeriod) return { macd: Array(data.length).fill(null), signal: Array(data.length).fill(null), histogram: Array(data.length).fill(null) };
  
  // Calculate EMAs
  const fastEMA = calculateEMA(data.map(d => d.value), fastPeriod);
  const slowEMA = calculateEMA(data.map(d => d.value), slowPeriod);
  
  // Calculate MACD line
  const macdLine = [];
  for (let i = 0; i < data.length; i++) {
    if (i < slowPeriod - 1) {
      macdLine.push(null);
    } else {
      macdLine.push(fastEMA[i] - slowEMA[i]);
    }
  }
  
  // Calculate signal line (EMA of MACD line)
  const signalLine = calculateEMA(macdLine, signalPeriod);
  
  // Calculate histogram
  const histogram = macdLine.map((macd, i) => {
    if (macd === null || signalLine[i] === null) return null;
    return macd - signalLine[i];
  });
  
  return { macd: macdLine, signal: signalLine, histogram };
};

const calculateSMA = (data, period) => {
  const result = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += data[j].value;
      }
      result.push(sum / period);
    }
  }
  
  return result;
};

const calculateEMA = (values, period) => {
  const k = 2 / (period + 1);
  const emaValues = [];
  
  // Initialize EMA with SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    if (values[i] === null) return Array(values.length).fill(null);
    sum += values[i];
  }
  
  let ema = sum / period;
  
  // Fill initial nulls
  for (let i = 0; i < period - 1; i++) {
    emaValues.push(null);
  }
  
  // Calculate EMA for remaining data points
  emaValues.push(ema);
  
  for (let i = period; i < values.length; i++) {
    if (values[i] === null) {
      emaValues.push(null);
    } else {
      ema = (values[i] - ema) * k + ema;
      emaValues.push(ema);
    }
  }
  
  return emaValues;
};

const calculateBollingerBands = (data, period = 20, stdDev = 2) => {
  const sma = calculateSMA(data, period);
  const bands = [];
  
  for (let i = 0; i < data.length; i++) {
    if (sma[i] === null) {
      bands.push({ upper: null, middle: null, lower: null, bPercent: null });
    } else {
      // Calculate standard deviation
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += Math.pow(data[j].value - sma[i], 2);
      }
      const std = Math.sqrt(sum / period);
      
      const upper = sma[i] + stdDev * std;
      const lower = sma[i] - stdDev * std;
      
      // Calculate B% (where is price in relation to the bands)
      const bPercent = (data[i].value - lower) / (upper - lower);
      
      bands.push({
        upper,
        middle: sma[i],
        lower,
        bPercent
      });
    }
  }
  
  return bands;
};

// Generate signal based on metrics and weights
export const generateSignals = (data, selectedMetrics) => {
  if (!data || data.length === 0) return [];

  // Make sure data is sorted by date
  const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Calculate technical indicators
  const rsi = calculateRSI(sortedData);
  const macd = calculateMACD(sortedData);
  const sma50 = calculateSMA(sortedData, 50);
  const sma200 = calculateSMA(sortedData, 200);
  const bollingerBands = calculateBollingerBands(sortedData);
  
  // Generate signals for each data point
  return sortedData.map((point, index) => {
    const signals = [];
    let buySignals = 0;
    let sellSignals = 0;
    let totalMetrics = 0;
    
    // Only process data points where we have indicator values
    if (index >= 50) {  // Ensure we have enough data for SMA50
      // Add selected metric signals
      selectedMetrics.forEach(metric => {
        // Technical indicators
        if (metric === "RSI" && rsi[index] !== null) {
          totalMetrics++;
          if (rsi[index] <= CONFIG.SIGNAL_METRICS.TECHNICAL.find(m => m.id === "RSI").threshold.buy) {
            buySignals++;
            signals.push({ metric: "RSI", signal: "buy", value: rsi[index] });
          } else if (rsi[index] >= CONFIG.SIGNAL_METRICS.TECHNICAL.find(m => m.id === "RSI").threshold.sell) {
            sellSignals++;
            signals.push({ metric: "RSI", signal: "sell", value: rsi[index] });
          }
        }
        
        if (metric === "MACD" && macd.histogram[index] !== null) {
          totalMetrics++;
          if (macd.histogram[index] > 0 && macd.histogram[index - 1] <= 0) {
            buySignals++;
            signals.push({ metric: "MACD", signal: "buy", value: macd.histogram[index] });
          } else if (macd.histogram[index] < 0 && macd.histogram[index - 1] >= 0) {
            sellSignals++;
            signals.push({ metric: "MACD", signal: "sell", value: macd.histogram[index] });
          }
        }
        
        if (metric === "SMA" && sma50[index] !== null && sma200[index] !== null) {
          totalMetrics++;
          if (sma50[index] > sma200[index] && sma50[index - 1] <= sma200[index - 1]) {
            buySignals++;
            signals.push({ metric: "SMA", signal: "buy", value: `${sma50[index].toFixed(2)}/${sma200[index].toFixed(2)}` });
          } else if (sma50[index] < sma200[index] && sma50[index - 1] >= sma200[index - 1]) {
            sellSignals++;
            signals.push({ metric: "SMA", signal: "sell", value: `${sma50[index].toFixed(2)}/${sma200[index].toFixed(2)}` });
          }
        }
        
        if (metric === "BB" && bollingerBands[index].bPercent !== null) {
          totalMetrics++;
          if (bollingerBands[index].bPercent <= 0.2) {
            buySignals++;
            signals.push({ metric: "Bollinger Bands", signal: "buy", value: bollingerBands[index].bPercent.toFixed(2) });
          } else if (bollingerBands[index].bPercent >= 0.8) {
            sellSignals++;
            signals.push({ metric: "Bollinger Bands", signal: "sell", value: bollingerBands[index].bPercent.toFixed(2) });
          }
        }
      });
    }
    
    // Calculate weighted signals
    let signalValue = 0;
    if (totalMetrics > 0) {
      signalValue = ((buySignals - sellSignals) / totalMetrics) * 100;
    }
    
    let signalType = "neutral";
    if (signalValue >= 50) signalType = "strong buy";
    else if (signalValue > 0) signalType = "buy";
    else if (signalValue <= -50) signalType = "strong sell";
    else if (signalValue < 0) signalType = "sell";
    
    return {
      ...point,
      signalValue,
      signalType,
      detailedSignals: signals
    };
  });
};

// Identify if a date falls within a financial crisis period
export const identifyCrisisPoints = (data) => {
  return data.map(point => {
    const pointDate = new Date(point.date);
    
    // Check if this date is within a known crisis period
    const crisis = CONFIG.FINANCIAL_CRISES.find(crisis => {
      const crisisDate = new Date(crisis.date);
      // Consider it a crisis if within 30 days after the start date
      return Math.abs(pointDate - crisisDate) <= 30 * 24 * 60 * 60 * 1000;
    });
    
    return {
      ...point,
      crisis: crisis ? crisis : null
    };
  });
};

export default {
  generateSignals,
  identifyCrisisPoints
};
