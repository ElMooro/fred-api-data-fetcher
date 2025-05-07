import React, { useState, useEffect } from 'react';
import { LiveData, ConnectionStatus } from '../../types';
import { DATA_SOURCES } from '../../constants/financial';
import WebSocketService from '../../services/WebSocketService';

interface LiveDataTabProps {
  // Props can be added as needed
}

const LiveDataTab: React.FC<LiveDataTabProps> = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('Disconnected');
  const [liveData, setLiveData] = useState<LiveData>({});

  // Connect to WebSocket for live data
  useEffect(() => {
    const unsubscribeStatus = WebSocketService.onConnectionStatusChange(setConnectionStatus);
    
    const unsubscribeMessage = WebSocketService.onMessage(data => {
      if (data && data.data) {
        setLiveData(prev => ({
          ...prev,
          ...data.data,
          lastUpdated: data.timestamp
        }));
      }
    });
    
    return () => {
      unsubscribeStatus();
      unsubscribeMessage();
    };
  }, []);

  // WebSocket connection management
  const connectWebSocket = () => {
    WebSocketService.connect();
  };

  const disconnectWebSocket = () => {
    WebSocketService.disconnect();
  };

  return (
    <div className="bg-white shadow rounded-lg p-6" role="tabpanel">
      <h2 className="text-xl font-semibold mb-4">Live Data Feed</h2>
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <p className="text-sm font-medium">
            Status: <span className={`font-semibold ${connectionStatus === 'Connected' ? 'text-green-600' : 'text-red-600'}`}>{connectionStatus}</span>
          </p>
          {connectionStatus !== 'Connected' ? (
            <button
              onClick={connectWebSocket}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm transition duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Connect to WebSocket
            </button>
          ) : (
            <button
              onClick={disconnectWebSocket}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm transition duration-150 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Disconnect
            </button>
          )}
        </div>
        
        {/* Live data display */}
        {connectionStatus === 'Connected' && Object.keys(liveData).length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {Object.entries(liveData)
              .filter(([key]) => key !== 'lastUpdated')
              .map(([key, data]) => {
                const indicator = Object.values(DATA_SOURCES)
                  .flat()
                  .find(ind => ind.id === key);
                
                const name = indicator?.name || key;
                const unit = indicator?.unit || '';
                
                return (
                  <div key={key} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between mb-2">
                      <h3 className="font-medium">{name}</h3>
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
        )}
        
        {connectionStatus === 'Connected' && Object.keys(liveData).length === 0 && (
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Waiting for data updates...</p>
          </div>
        )}
        
        {connectionStatus !== 'Connected' && (
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Connect to WebSocket to receive live updates</p>
          </div>
        )}
        
        <div className="p-4 bg-gray-50 rounded mt-6">
          <h3 className="text-lg font-medium mb-2">Fault-Tolerant WebSocket Implementation</h3>
          <p className="text-sm text-gray-600 mb-4">
            This implementation demonstrates a production-grade fault-tolerant WebSocket connection with automatic 
            reconnection and partial data handling. If any data source fails, the system continues to display 
            available data while attempting recovery.
          </p>
          <div className="bg-gray-800 text-gray-200 p-3 rounded font-mono text-xs overflow-x-auto">
            <pre>{`// Fault-tolerant WebSocket client implementation
class WebSocketClient {
  constructor(url, options = {}) {
    this.url = url;
    this.options = {
      reconnectInterval: 2000,
      reconnectAttempts: 10,
      connectionTimeout: 5000,
      heartbeatInterval: 30000,
      ...options
    };
    
    this.reconnectCount = 0;
    this.lastHeartbeat = null;
    this.heartbeatTimer = null;
    this.connectionTimer = null;
    
    this.handlers = {
      message: new Set(),
      open: new Set(),
      close: new Set(),
      error: new Set()
    };
    
    this.sourceStatus = new Map(); // Track individual data source status
    
    this.connect();
  }
  
  // Rest of implementation in WebSocketService.ts
}`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveDataTab;
