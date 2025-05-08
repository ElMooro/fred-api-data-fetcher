import { DataPoint, NYFedTreasuryYield } from '../types';

/**
 * Transform NY Fed API data into the application's DataPoint format
 */
export const transformSOFRData = (data: any): DataPoint[] => {
  if (!data || !data.refRates || !Array.isArray(data.refRates)) {
    return [];
  }

  return data.refRates.map((item: any) => ({
    date: item.effectiveDate,
    value: item.percentRate,
    rawValue: item.percentRate,
    volume: item.volumeInBillions,
    percentiles: {
      p1: item.percentPercentile1,
      p25: item.percentPercentile25,
      p75: item.percentPercentile75,
      p99: item.percentPercentile99
    }
  }));
};

/**
 * Transform Treasury yield data for a specific tenor
 * @param data Treasury yield data from NY Fed API
 * @param tenor Tenor (e.g., '3m', '10y')
 * @returns Array of DataPoints for the specified tenor
 */
export const transformTreasuryYieldData = (data: any, tenor: string): DataPoint[] => {
  if (!data || !data.Treasury || !data.Treasury.yields || !Array.isArray(data.Treasury.yields)) {
    return [];
  }
  
  const tenorMap: Record<string, keyof NYFedTreasuryYield> = {
    '1m': 't1Month',
    '3m': 't3Month',
    '6m': 't6Month',
    '1y': 't1Year',
    '2y': 't2Year',
    '3y': 't3Year',
    '5y': 't5Year',
    '7y': 't7Year',
    '10y': 't10Year', 
    '20y': 't20Year',
    '30y': 't30Year'
  };
  
  const tenorProperty = tenorMap[tenor];
  
  if (!tenorProperty) {
    throw new Error(`Invalid tenor: ${tenor}. Available tenors are: ${Object.keys(tenorMap).join(', ')}`);
  }
  
  return data.Treasury.yields
    .filter((item: NYFedTreasuryYield) => item[tenorProperty] !== undefined && item[tenorProperty] !== null)
    .map((item: NYFedTreasuryYield) => ({
      date: item.effectiveDate,
      value: item[tenorProperty] as number,
      rawValue: item[tenorProperty] as number
    }));
};

export default {
  transformSOFRData,
  transformTreasuryYieldData
};
