/**
 * Format a number based on transformation type
 * @param value - The value to format
 * @param transformationType - The transformation type
 * @param precision - Decimal precision (default: 2)
 * @returns Formatted number as string
 */
export const formatValue = (value: number, transformationType?: string, precision = 2): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  
  const isPercentage = transformationType?.includes('pct') || transformationType === 'yoy';
  return `${value.toFixed(precision)}${isPercentage ? '%' : ''}`;
};
