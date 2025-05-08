import React, { useState, useEffect } from 'react';
import { LiveData, ConnectionStatus, LiveDataPoint, Indicator } from '../../types';
import { DATA_SOURCES } from '../../constants/financial';
import { WebSocketService } from '../../services/WebSocketService';

interface LiveDataTabProps {
  // Props can be added as needed
}

const LiveDataTab: React.FC<LiveDataTabProps> = () => {
  const [liveData, setLiveData] = useState<LiveData>({});
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('Disconnected');

  useEffect(() => {
    // Connect to WebSocket when component mounts
    WebSocketService.initialize('wss://your-websocket-endpoint.com');

    // Subscribe to connection status updates
    const unsubscribeStatus = WebSocketService.onConnectionStatusChange(setConnectionStatus);
    
    // Subscribe to data messages
    const unsubscribeMessage = WebSocketService.onMessage((data: LiveData) => {
      if (data) {
        // Simplify the approach - avoid spreading data.data directly
        setLiveData(prev => {
          const newData = { ...prev };
          
          // Add lastUpdated timestamp
          newData.lastUpdated = new Date().toISOString();
          
          // Process data safely
          if (data.data && typeof data.data === 'object') {
            // Process data fields individually
            Object.entries(data.data).forEach(([key, value]) => {
              if (value && typeof value === 'object') {
                newData[key] = value;
              }
            });
          }
          
          return newData;
        });
      }
    });

    // Cleanup on unmount
    return () => {
      unsubscribeStatus();
      unsubscribeMessage();
      WebSocketService.closeConnection();
    };
  }, []);

  // Function to get the display name from DATA_SOURCES
  const getDisplayName = (key: string): string => {
    const sourceData = DATA_SOURCES[key];
    // Check if sourceData exists and has at least one element
    if (sourceData && Array.isArray(sourceData) && sourceData.length > 0) {
      // Now we know sourceData[0] is an Indicator object, not a string
      return sourceData[0].name || key; // Use the name property of the Indicator
    }
    return key; // Fallback to the key itself
  };

  // Function to safely get value from LiveDataPoint or string
  const getValue = (item: LiveDataPoint | string | undefined): string => {
    if (!item) return 'N/A';
    if (typeof item === 'string') return item;
    return item.value || 'N/A';
  };

  // Function to safely get change from LiveDataPoint or string
  const getChange = (item: LiveDataPoint | string | undefined): string => {
    if (!item) return 'N/A';
    if (typeof item === 'string') return '';
    return item.change || 'N/A';
  };

  return (
    <div className="live-data-tab">
      <div className="status-indicator">
        Connection: <span className={`status-${connectionStatus.toLowerCase().replace(/\s+/g, '-').replace(/\.\.\./g, '')}`}>{connectionStatus}</span>
      </div>
      
      <div className="live-data-grid">
        <div className="grid-header">
          <div>Source</div>
          <div>Value</div>
          <div>Change</div>
        </div>
        
        {Object.keys(DATA_SOURCES).map(key => (
          <div key={key} className="grid-row">
            <div>{getDisplayName(key)}</div>
            <div>{getValue(liveData[key])}</div>
            <div className={getChangeClass(getChange(liveData[key]))}>
              {getChange(liveData[key])}
            </div>
          </div>
        ))}
      </div>
      
      {liveData.lastUpdated && (
        <div className="last-updated">
          Last updated: {new Date(liveData.lastUpdated as string).toLocaleString()}
        </div>
      )}
    </div>
  );
};

// Helper function to determine CSS class based on change value
const getChangeClass = (change?: string): string => {
  if (!change) return '';
  
  const numericChange = parseFloat(change);
  if (isNaN(numericChange)) return '';
  
  return numericChange > 0 ? 'positive-change' : 
         numericChange < 0 ? 'negative-change' : '';
};

export default LiveDataTab;
