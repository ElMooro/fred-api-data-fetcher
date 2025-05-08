import React from 'react';
import { WatchlistItem } from '../../types';

interface WatchlistItemChartProps {
  item: WatchlistItem;
}

export const WatchlistItemChart: React.FC<WatchlistItemChartProps> = ({item}) => {
  return (
    <div className="watchlist-chart">
      <h3>{item.name}</h3>
      <p>Source: {item.source}</p>
      <p>Series ID: {item.series_id}</p>
      <div className="placeholder-chart" style={{
        height: '200px',
        backgroundColor: '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px dashed #ccc'
      }}>
        Chart Placeholder for {item.name}
      </div>
    </div>
  );
};

export default WatchlistItemChart;
