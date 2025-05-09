import React from 'react';

const DashboardWidget = ({ title, icon, color, children }) => {
  return (
    <div className="dashboard-widget" style={{ '--widget-color': color }}>
      <div className="widget-header">
        <div className="widget-icon" style={{ backgroundColor: color }}>
          {icon}
        </div>
        <h3 className="widget-title">{title}</h3>
      </div>
      <div className="widget-content">
        {children}
      </div>
    </div>
  );
};

export default DashboardWidget;
