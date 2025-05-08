// Utility function to calculate period-to-period changes
const calculateChanges = (observations) => {
  if (!Array.isArray(observations) || observations.length < 2) {
    return observations;
  }
  
  return observations.map((obs, index) => {
    if (index === 0) {
      return {
        ...obs,
        change: null,
        percentChange: null,
      };
    }
    
    const currentValue = parseFloat(obs.value);
    const previousValue = parseFloat(observations[index - 1].value);
    
    if (isNaN(currentValue) || isNaN(previousValue)) {
      return {
        ...obs,
        change: null,
        percentChange: null,
      };
    }
    
    const change = currentValue - previousValue;
    const percentChange = previousValue !== 0 ? (change / Math.abs(previousValue)) * 100 : null;
    
    return {
      ...obs,
      change: change.toFixed(4),
      percentChange: percentChange !== null ? percentChange.toFixed(2) + '%' : null,
    };
  });
};

module.exports = calculateChanges;
