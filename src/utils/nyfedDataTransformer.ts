import { DataPoint, NYFedTreasuryYield } from '../types';

/**
 * Transform NY Fed API data into the application's DataPoint format
 */
export const transformNYFedData = (data: any[]): DataPoint[] => {
  return data.map(item => ({
    date: item.effectiveDate || item.date,
    value: parseFloat(item.rate || item.value),
    metadata: {
      type: item.type || 'Treasury',
      maturity: item.maturity || 'N/A'
    }
  }));
};

export default transformNYFedData;
