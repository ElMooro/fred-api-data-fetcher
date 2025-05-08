import axios from 'axios';
import { AppError } from '../utils/error';
import { ErrorType, DataPoint } from '../types';

export class NYFedService {
  private static readonly BASE_URL = 'https://markets.newyorkfed.org/api';

  /**
   * Fetch SOFR data from NY Fed API
   * @param days Number of days of data to retrieve
   * @returns Array of DataPoints
   */
  static async fetchSOFRData(days: number = 30): Promise<DataPoint[]> {
    try {
      const response = await axios.get(`${this.BASE_URL}/rates/secured/sofr/last/${days}.json`);
      
      if (response.data && response.data.refRates) {
        return response.data.refRates.map((item: any) => ({
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
      }
      
      return [];
    } catch (error) {
      console.error("Error fetching SOFR data:", error);
      throw AppError.fromApiError(error);
    }
  }

  /**
   * Fetch Treasury yield data
   * @param days Number of days of data to retrieve
   * @returns Treasury yield data
   */
  static async fetchTreasuryYields(days: number = 30): Promise<any> {
    try {
      const response = await axios.get(`${this.BASE_URL}/rates/all/latest/${days}.json`);
      return response.data;
    } catch (error) {
      console.error("Error fetching Treasury yields:", error);
      throw AppError.fromApiError(error);
    }
  }
}

export default NYFedService;
