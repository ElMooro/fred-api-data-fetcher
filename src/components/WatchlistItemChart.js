import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { DataService } from '../services/DataService';
import { AppError, ERROR_TYPES, ERROR_MESSAGES } from '../constants';
import { Logger } from '../utils/Logger';
import LoadingIndicator from './LoadingIndicator';
import { TRANSFORMATIONS } from '../constants/dataConstants';

const WatchlistItemChart = React.memo(({ item }) => {
  const [itemData, setItemData] = useState([]);
  const [isItemLoading, setIsItemLoading] = useState(true);
  const [itemError, setItemError] = useState('');

  useEffect(() => {
    let isMounted = true;
    setIsItemLoading(true);
    setItemError('');
    
    const loadData = async () => {
      try {
        // Generate data once when item props change
        const data = await DataService.fetchData(
          item.indicator,
          item.frequency,
          item.startDate,
          item.endDate
        );
        
        if (!isMounted) return;
        
        if (!data || data.length === 0) {
          throw new AppError(ERROR_TYPES.NO_DATA_RETURNED);
        }
        
        // Apply transformation if needed
        const transformedData = item.transformation !== 'raw' 
          ? DataService.transformData(data, item.transformation)
          : data;
          
        setItemData(transformedData);
        setIsItemLoading(false);
      } catch (error) {
        if (!isMounted) return;
        
        Logger.error(`Error loading watchlist item ${item.id}:`, error);
        setItemError(error instanceof AppError ? error.message : ERROR_MESSAGES.GENERAL_ERROR);
        setIsItemLoading(false);
        setItemData([]); // Clear data on error
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [item.indicator, item.frequency, item.startDate, item.endDate, item.transformation, item.id]);

  if (isItemLoading) {
    return <LoadingIndicator message="Loading chart data..." />;
  }

  if (itemError) {
    return (
      <div className="h-48 flex items-center justify-center">
        <p className="text-red-500 text-xs">{itemError}</p>
      </div>
    );
  }

  if (!itemData.length) {
    return (
      <div className="h-48 flex items-center justify-center">
        <p className="text-gray-400 text-xs">No data available</p>
      </div>
    );
  }

  const transformInfo = TRANSFORMATIONS.find(t => t.id === item.transformation) || {};
  const isPercentage = transformInfo.resultUnit === 'percent';

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={itemData}
          margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
        >
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 10 }} 
            interval="preserveStartEnd" 
            tickFormatter={(tick) => new Date(tick).getFullYear()} 
          />
          <YAxis 
            tick={{ fontSize: 10 }} 
            domain={['auto', 'auto']} 
            tickFormatter={(value) => isPercentage ? `${value}%` : value}
          />
          <Tooltip 
            contentStyle={{ fontSize: '10px' }}
            formatter={(value) => [
              `${parseFloat(value).toFixed(2)}${isPercentage ? '%' : ''}`,
              `${item.transformationName || 'Value'}`
            ]}
            labelFormatter={(label) => new Date(label).toLocaleDateString()}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#3B82F6" 
            dot={false} 
            strokeWidth={1.5}
            name={item.name}
            isAnimationActive={false} // Disable animation for performance
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

WatchlistItemChart.displayName = 'WatchlistItemChart';

export default WatchlistItemChart;
