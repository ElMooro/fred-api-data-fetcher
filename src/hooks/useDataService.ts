import { useCallback } from "react";
import ApiService from "../services/ApiService";
import SignalGeneratorUtils, { DataPoint, generateSignals, identifyCrisisPoints } from "../utils/SignalGenerator";

// Custom hook for data operations
export const useDataService = () => {
  // Fetch indicator details from various APIs
  const getIndicatorDetails = useCallback(async (
    indicator: string, 
    startDate: string, 
    endDate: string, 
    selectedAPIs: string[] = ["FRED", "BEA", "BLS", "CENSUS", "ECB", "BIS", "TREASURY"],
    selectedMetrics: string[] = ["RSI", "MACD", "SMA", "BB"]
  ) => {
    try {
      const results: Record<string, DataPoint[]> = {};
      
      // Map indicators to series IDs for different APIs
      const apiMappings: Record<string, Record<string, any>> = {
        GDP: {
          FRED: "GDP",
          BEA: { datasetName: "NIPA", TableName: "T10101", Frequency: "Q" },
          BLS: ["CUUR0000SA0"],
          ECB: { flowRef: "EXR", key: "D.USD.EUR.SP00.A" }
        },
        UNRATE: {
          FRED: "UNRATE",
          BLS: ["LNS14000000"]
        },
        INFLATION: {
          FRED: "CPIAUCSL",
          BLS: ["CUUR0000SA0"]
        },
        INTEREST: {
          FRED: "FEDFUNDS",
          TREASURY: { filter: "security_type:eq:Treasury Bills" }
        }
      };
      
      // Fetch data from FRED API
      if (selectedAPIs.includes("FRED") && apiMappings[indicator]?.FRED) {
        const fredData = await ApiService.fred.fetchSeries(
          apiMappings[indicator].FRED,
          startDate,
          endDate
        );
        
        results.fred = fredData.map((item: any) => ({
          date: item.date,
          value: parseFloat(item.value) || 0
        }));
        
        // Apply signal generation and crisis identification
        if (results.fred.length > 0) {
          results.fred = generateSignals(results.fred, selectedMetrics);
          results.fred = identifyCrisisPoints(results.fred);
        }
      }
      
      // Fetch data from BEA API
      if (selectedAPIs.includes("BEA") && apiMappings[indicator]?.BEA) {
        const beaData = await ApiService.bea.fetchData(
          apiMappings[indicator].BEA.datasetName,
          {
            TableName: apiMappings[indicator].BEA.TableName,
            Frequency: apiMappings[indicator].BEA.Frequency,
            Year: startDate.split("-")[0]
          }
        );
        
        // Process BEA data
        if (beaData && beaData.Data) {
          results.bea = beaData.Data.map((item: any) => ({
            date: item.TimePeriod,
            value: parseFloat(item.DataValue) || 0
          }));
          
          // Apply signal generation and crisis identification
          if (results.bea.length > 0) {
            results.bea = generateSignals(results.bea, selectedMetrics);
            results.bea = identifyCrisisPoints(results.bea);
          }
        }
      }
      
      // Fetch data from BLS API
      if (selectedAPIs.includes("BLS") && apiMappings[indicator]?.BLS) {
        const startYear = startDate.split("-")[0];
        const endYear = endDate.split("-")[0];
        
        const blsData = await ApiService.bls.fetchTimeSeries(
          apiMappings[indicator].BLS,
          startYear,
          endYear
        );
        
        if (blsData.length > 0 && blsData[0].data) {
          results.bls = blsData[0].data.map((item: any) => ({
            date: `${item.year}-${item.period.substring(1).padStart(2, "0")}-01`,
            value: parseFloat(item.value) || 0
          }));
          
          // Apply signal generation and crisis identification
          if (results.bls.length > 0) {
            results.bls = generateSignals(results.bls, selectedMetrics);
            results.bls = identifyCrisisPoints(results.bls);
          }
        }
      }
      
      // Fetch data from Census API
      if (selectedAPIs.includes("CENSUS") && apiMappings[indicator]?.CENSUS) {
        try {
          const censusParams = apiMappings[indicator].CENSUS;
          // Since Census API requires different parameters depending on the dataset,
          // adding a generic handler here to be expanded based on specific needs
          
          if (censusParams) {
            const censusData = await ApiService.census.fetchData(
              censusParams.dataset || "acs/acs1",
              startDate.split("-")[0],
              censusParams.variables || ["NAME"]
            );
            
            if (censusData && censusData.length > 1) {
              // Process Census data - usually has header row followed by data rows
              const headers = censusData[0];
              
              results.census = censusData.slice(1).map((row: any) => {
                // Create an object mapping headers to values
                return {
                  date: row[headers.indexOf("NAME")] || startDate, // Use dataset name or startDate if no date field
                  value: parseFloat(row[headers.indexOf(censusParams.valueField || headers[1])]) || 0
                };
              });
              
              // Apply signal generation and crisis identification
              if (results.census.length > 0) {
                results.census = generateSignals(results.census, selectedMetrics);
                results.census = identifyCrisisPoints(results.census);
              }
            }
          }
        } catch (err) {
          console.error("Error fetching Census data:", err);
        }
      }
      
      // Fetch data from ECB API
      if (selectedAPIs.includes("ECB") && apiMappings[indicator]?.ECB) {
        const ecbData = await ApiService.ecb.fetchData(
          apiMappings[indicator].ECB.flowRef,
          apiMappings[indicator].ECB.key,
          { startPeriod: startDate, endPeriod: endDate }
        );
        
        if (ecbData && ecbData.dataSets && ecbData.dataSets[0].series) {
          // Process ECB data format
          const series = ecbData.dataSets[0].series["0:0:0:0:0"];
          const timeFormat = ecbData.structure.dimensions.observation[0];
          
          if (series && series.observations && timeFormat) {
            results.ecb = Object.entries(series.observations).map(([key, value]: [string, any]) => {
              const timeIndex = parseInt(key);
              return {
                date: timeFormat.values[timeIndex].id,
                value: value[0]
              };
            });
            
            // Apply signal generation and crisis identification
            if (results.ecb.length > 0) {
              results.ecb = generateSignals(results.ecb, selectedMetrics);
              results.ecb = identifyCrisisPoints(results.ecb);
            }
          }
        }
      }
      
      // Fetch data from Treasury API
      if (selectedAPIs.includes("TREASURY") && apiMappings[indicator]?.TREASURY) {
        const treasuryData = await ApiService.treasury.fetchInterestRates({
          filter: apiMappings[indicator].TREASURY.filter,
          sort: "-record_date",
          "page[size]": 100
        });
        
        if (treasuryData) {
          results.treasury = treasuryData.map((item: any) => ({
            date: item.record_date,
            value: parseFloat(item.avg_interest_rate_amt) || 0,
            securityType: item.security_type_desc
          }));
          
          // Apply signal generation and crisis identification
          if (results.treasury.length > 0) {
            results.treasury = generateSignals(results.treasury, selectedMetrics);
            results.treasury = identifyCrisisPoints(results.treasury);
          }
        }
      }
      
      return results;
    } catch (error) {
      console.error("Error in getIndicatorDetails:", error);
      throw error;
    }
  }, []);
  
  return { getIndicatorDetails };
};
