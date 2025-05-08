import React, { useState, useEffect } from 'react';
import { DataPoint } from '../types';

interface NYFedDemoProps {
  maturity?: string;
}

const NYFedDemo: React.FC<NYFedDemoProps> = ({ maturity = '3M' }) => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Mock data for the demo
        setTimeout(() => {
          const mockData: DataPoint[] = [
            {
              date: '2023-05-01',
              value: 5.32,
              metadata: { type: 'SOFR', maturity }
            },
            {
              date: '2023-04-01',
              value: 5.28,
              metadata: { type: 'SOFR', maturity }
            },
            {
              date: '2023-03-01',
              value: 5.25,
              metadata: { type: 'SOFR', maturity }
            }
          ];
          setData(mockData);
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError('Failed to fetch NY Fed data');
        setLoading(false);
      }
    };

    fetchData();
  }, [maturity]);

  return (
    <div className="ny-fed-demo">
      <h3>NY Fed SOFR Rates ({maturity})</h3>
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && data.length > 0 && (
        <div className="data-panel">
          <p>Latest SOFR Rate: {data[0].value}%</p>
          <p>Date: {data[0].date}</p>
          <p>Number of data points: {data.length}</p>
        </div>
      )}
    </div>
  );
};

export default NYFedDemo;
