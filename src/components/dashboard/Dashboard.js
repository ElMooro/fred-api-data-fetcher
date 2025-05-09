import React from 'react';
import { useGetItems } from '../../hooks/useItems';
import ItemCard from '../items/ItemCard';
import DashboardWidget from './DashboardWidget';

const Dashboard = () => {
  const { data, isLoading, error } = useGetItems({ limit: 3 });
  
  return (
    <div className="dashboard">
      <h1 className="dashboard-title">Dashboard</h1>
      
      <div className="dashboard-widgets">
        <DashboardWidget
          title="API Status"
          icon="🌐"
          color="var(--color-success)"
        >
          <div className="api-status">
            <div className="status-indicator active"></div>
            <p>Backend API is connected and running</p>
            <div className="api-url">{process.env.REACT_APP_API_URL || 'http://localhost:5001/api/v1'}</div>
          </div>
        </DashboardWidget>
        
        <DashboardWidget
          title="Quick Stats"
          icon="📊"
          color="var(--color-primary)"
        >
          <div className="quick-stats">
            <div className="stat-item">
              <div className="stat-value">{isLoading ? '...' : error ? '?' : data?.pagination?.totalItems || 0}</div>
              <div className="stat-label">Total Items</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">3</div>
              <div className="stat-label">Categories</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">$599</div>
              <div className="stat-label">Avg. Price</div>
            </div>
          </div>
        </DashboardWidget>
      </div>
      
      <div className="recent-items-section">
        <div className="section-header">
          <h2>Recent Items</h2>
          <a href="/items" className="view-all">View All</a>
        </div>
        
        {isLoading ? (
          <div className="loading">Loading recent items...</div>
        ) : error ? (
          <div className="error">Error loading items: {error.message}</div>
        ) : (
          <div className="recent-items">
            {data?.data?.length > 0 ? (
              data.data.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onEdit={() => window.location.href = `/items/${item.id}/edit`}
                  onDelete={() => alert('Delete functionality is disabled on the dashboard')}
                />
              ))
            ) : (
              <div className="no-items">
                <p>No items found. Add some items to see them here.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
