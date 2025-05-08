import React, { useState, useEffect } from 'react';
import { DataPoint } from '../types';
import { DataService } from '../services/DataService';

interface NYFedDemoProps {
  // Props can be added as needed
}

const NYFedDemo: React.FC<NYFedDemoProps> = () => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch NY Fed data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const dataService = new DataService();
      // This method should be created in DataService.ts
      const sofrData = await dataService.fetchSOFRData(30);
      setData(sofrData);
    } catch (err) {
      setError('Failed to fetch NY Fed data');
      console.error('Error fetching NY Fed data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="nyfed-demo">
      <h2>NY Fed Data Demo</h2>
      
      {isLoading && <div className="loading">Loading data...</div>}
      
      {error && <div className="error-message">{error}</div>}
      
      {!isLoading && !error && data.length > 0 && (
        <div className="data-summary">
          <h3>SOFR Data Summary</h3>
          <p>Latest SOFR Rate: {data[0].value}%</p>
          <p>Date: {data[0].date}</p>
          {data[0].volume && <p>Volume: ${data[0].volume.toLocaleString()} billion</p>}
          <p>Number of data points: {data.length}</p>
        </div>
      )}
    </div>
  );
};

export default NYFedDemo;
