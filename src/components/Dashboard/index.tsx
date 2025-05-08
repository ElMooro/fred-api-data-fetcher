import React, { useState, useEffect } from 'react';
import { DataPoint } from '../../types';
import { DataService } from '../../services/DataService';
import SOFRPanel from './SOFRPanel';
import BEAPanel from './BEAPanel';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Function to update chart data
  const updateChart = async () => {
    try {
      setIsLoading(true);
      const dataService = new DataService();
      const seriesData = await dataService.fetchData('GDP', 'Quarterly', '2020-01-01', '2023-01-01');
      setData(seriesData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch data. Please try again later.');
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    updateChart();
  }, []);
  
  return (
    <div className="dashboard-container">
      <h1>Economic Data Dashboard</h1>
      
      {/* Add the BEA Panel */}
      <BEAPanel years={5} />
      
      {/* Add the SOFR Panel */}
      <SOFRPanel days={30} />
      
      {isLoading && <div className="loading">Loading data...</div>}
      
      {error && <div className="error-message">{error}</div>}
      
      {!isLoading && !error && (
        <div className="data-container">
          <h2>Additional Economic Indicators</h2>
          
          <div className="data-summary">
            <h3>Data Summary</h3>
            <p>Number of data points: {data.length}</p>
            {data.length > 0 && (
              <>
                <p>Latest value: {data[data.length - 1].value}</p>
                <p>Date: {data[data.length - 1].date}</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
