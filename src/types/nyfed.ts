export interface NYFedRateData {
  effectiveDate: string;
  rate: number;
  volumeWeightedMean?: number;
  percentile1?: number;
  percentile25?: number;
  percentile75?: number;
  percentile99?: number;
  volume?: number;
}

export interface NYFedRatesResponse {
  refRates: {
    [key: string]: {
      lastUpdated: string;
      rates: NYFedRateData[];
    }
  }
}

export interface NYFedTreasuryYield {
  effectiveDate: string;
  t1Month?: number;
  t3Month?: number;
  t6Month?: number;
  t1Year?: number;
  t2Year?: number;
  t3Year?: number;
  t5Year?: number;
  t7Year?: number;
  t10Year?: number;
  t20Year?: number;
  t30Year?: number;
}

export interface NYFedTreasuryResponse {
  Treasury: {
    lastUpdated: string;
    yields: NYFedTreasuryYield[];
  }
}
