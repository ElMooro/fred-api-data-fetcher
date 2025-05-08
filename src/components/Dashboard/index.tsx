import React, { useState, useEffect } from 'react';
import { DataPoint } from '../../types';
import { DataService } from '../../services/DataService';
import SOFRPanel from './SOFRPanel';
import BEAPanel from './BEAPanel';
import ECBPanel from './ECBPanel';
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
      <h1>Global Economic Data Dashboard</h1>
      
      <div className="dashboard-section">
        <h2 className="section-title">United States</h2>
        
        {/* BEA Panel (US GDP) */}
        <BEAPanel years={5} />
        
        {/* SOFR Panel (US Rates) */}
        <SOFRPanel days={30} />
      </div>
      
      <div className="dashboard-section">
        <h2 className="section-title">Europe</h2>
        
        {/* ECB Panel (European Data) */}
        <ECBPanel years={5} />
      </div>
      
      {isLoading && <div className="loading">Loading additional data...</div>}
      
      {error && <div className="error-message">{error}</div>}
      
      {!isLoading && !error && (
        <div className="dashboard-section">
          <h2 className="section-title">Additional Indicators</h2>
          
          <div className="data-container">
            <h3>FRED Economic Data</h3>
            <div className="data-summary">
              <p>Number of indicators available: {data.length}</p>
              {data.length > 0 && (
                <>
                  <p>Latest value: {data[data.length - 1].value}</p>
                  <p>Date: {data[data.length - 1].date}</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
