import React, { useState, useEffect } from 'react';
import { LiveData as LiveDataType, ConnectionStatus, LiveDataPoint } from '../../types';
import { DATA_SOURCES } from '../../constants/financial';
import WebSocketService from '../../services/WebSocketService';

interface LiveDataTabProps {
  // Props can be added as needed
}

export const LiveData: React.FC<LiveDataTabProps> = () => {
  const [liveData, setLiveData] = useState<LiveDataType>({});
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("Disconnected");

  useEffect(() => {
    // Connect to WebSocket
    WebSocketService.connect();
    
    // Subscribe to connection status changes
    const unsubscribeStatus = WebSocketService.onConnectionStatusChange(setConnectionStatus);
    
    // Subscribe to data updates - with proper typing
    const unsubscribeMessage = WebSocketService.onMessage((data: any) => {
      if (data && data.data) {
        setLiveData(prev => ({
          ...prev,
          ...data.data,
          lastUpdated: data.timestamp
        }));
      }
    });
    
    // Clean up on unmount
    return () => {
      unsubscribeMessage();
      unsubscribeStatus();
      WebSocketService.disconnect();
    };
  }, []);

  const getDataItemDetails = (key: string) => {
    switch (key) {
      case 'UNRATE':
        return {
          name: 'Unemployment Rate',
          unit: 'Percent'
        };
      case 'GDP':
        return {
          name: 'Gross Domestic Product',
          unit: 'Billions of $'
        };
      case 'FEDFUNDS':
        return {
          name: 'Federal Funds Rate',
          unit: 'Percent'
        };
      default:
        return {
          name: key,
          unit: ''
        };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Live Market Data</h2>
        <div className="flex items-center space-x-2">
          <span className={`w-3 h-3 rounded-full ${
            connectionStatus === 'Connected' ? 'bg-green-500' : 
            connectionStatus === 'Connecting...' ? 'bg-yellow-500' : 'bg-red-500'
          }`}></span>
          <span className="text-sm">{connectionStatus}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(liveData)
          .filter(([key]) => key !== 'lastUpdated')
          .map(([key, value]) => {
            // Skip if not a LiveDataPoint
            if (typeof value !== 'object' || !value || !('value' in value) || !('change' in value)) {
              return null;
            }
            
            const data = value as LiveDataPoint;
            const { name, unit } = getDataItemDetails(key);
            
            return (
              <div 
                key={key} 
                className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500"
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium">{name}</h3>
                  <span 
                    className={`text-xs px-2 py-1 rounded-full ${
                      parseFloat(data.change) >= 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {parseFloat(data.change) >= 0 ? '+' : ''}{data.change}
                  </span>
                </div>
                <p className="text-2xl font-bold">
                  {data.value}{unit.includes('Percent') ? '%' : ''}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Refreshes automatically
                </p>
              </div>
            );
          })}
      </div>
      
      {liveData.lastUpdated && typeof liveData.lastUpdated === 'string' && (
        <p className="text-xs text-gray-500 mt-4">
          Last updated: {new Date(liveData.lastUpdated).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
};

export default LiveData;
