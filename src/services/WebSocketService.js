import { CONFIG, ERROR_TYPES, AppError } from '../constants';
import { Logger } from '../utils/Logger';

/**
 * WebSocket service for live data with AWS API Gateway support
 */
export const WebSocketService = (() => {
  let socket = null;
  let isConnected = false;
  let reconnectTimeout = null;
  let reconnectAttempts = 0;
  let messageHandlers = new Set();
  let connectionStatusHandlers = new Set();
  let heartbeatTimer = null;
  let lastHeartbeat = null;
  
  const MAX_RECONNECT_ATTEMPTS = CONFIG.WEBSOCKET.RECONNECT_ATTEMPTS;
  const RECONNECT_DELAY = CONFIG.WEBSOCKET.RECONNECT_INTERVAL;
  const CONNECTION_TIMEOUT = CONFIG.WEBSOCKET.CONNECTION_TIMEOUT;
  const HEARTBEAT_INTERVAL = CONFIG.WEBSOCKET.HEARTBEAT_INTERVAL;
  
  // WebSocket URL from config
  const WS_URL = CONFIG.WEBSOCKET.URL;
  
  // Authentication utility for AWS API Gateway authentication
  const getAuthParams = () => {
    // For AWS API Gateway with IAM auth, you'd implement signature generation here
    return {
      'x-api-key': process.env.REACT_APP_API_KEY || '',
      'Authorization': localStorage.getItem('auth_token') || ''
    };
  };
  
  const updateConnectionStatus = (status) => {
    isConnected = status === 'Connected';
    connectionStatusHandlers.forEach(handler => handler(status));
  };
  
  // Start heartbeat monitoring
  const startHeartbeatMonitoring = () => {
    clearInterval(heartbeatTimer);
    lastHeartbeat = Date.now();
    
    heartbeatTimer = setInterval(() => {
      const now = Date.now();
      if (socket && socket.readyState === WebSocket.OPEN) {
        // Check if we haven't received a heartbeat for too long
        if (now - lastHeartbeat > HEARTBEAT_INTERVAL * 1.5) {
          Logger.warn("WebSocket heartbeat timeout, connection may be stale");
          socket.close(4000, "Heartbeat timeout");
          return;
        }
        
        // Send heartbeat message
        try {
          socket.send(JSON.stringify({ 
            action: 'heartbeat',
            timestamp: new Date().toISOString()
          }));
        } catch (error) {
          Logger.error("Error sending heartbeat", error);
        }
      } else {
        clearInterval(heartbeatTimer);
      }
    }, HEARTBEAT_INTERVAL);
  };
  
  const connect = () => {
    if (socket) {
      return;
    }
    
    try {
      updateConnectionStatus('Connecting...');
      
      // Get auth params - for AWS API Gateway, typically added as query params
      const authParams = getAuthParams();
      let wsUrl = WS_URL;
      
      // Append auth params to WebSocket URL for AWS API Gateway
      if (Object.keys(authParams).length > 0) {
        const queryString = Object.entries(authParams)
          .filter(([_, value]) => value) // Only include non-empty values
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
          .join('&');
          
        if (queryString) {
          wsUrl = `${WS_URL}${WS_URL.includes('?') ? '&' : '?'}${queryString}`;
        }
      }
      
      // Create WebSocket connection
      socket = new WebSocket(wsUrl);
      
      // Set up connection timeout
      const connectionTimer = setTimeout(() => {
        if (socket && socket.readyState !== WebSocket.OPEN) {
          Logger.warn(`WebSocket connection timeout after ${CONNECTION_TIMEOUT}ms`);
          updateConnectionStatus('Connection Timeout');
          socket.close();
        }
      }, CONNECTION_TIMEOUT);
      
      socket.onopen = () => {
        clearTimeout(connectionTimer);
        Logger.info("WebSocket connected");
        updateConnectionStatus('Connected');
        reconnectAttempts = 0;
        lastHeartbeat = Date.now();
        
        // Start heartbeat
        startHeartbeatMonitoring();
        
        // Subscribe to data feeds
        try {
          socket.send(JSON.stringify({
            action: 'subscribe',
            sources: ['UNRATE', 'GDP', 'FEDFUNDS', 'FSI'],
            timestamp: new Date().toISOString()
          }));
        } catch (error) {
          Logger.error("Error sending subscribe message", error);
        }
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Update last heartbeat time if this is a heartbeat response
          if (data.type === 'heartbeat') {
            lastHeartbeat = Date.now();
            return;
          }
          
          // Process and forward message to handlers
          messageHandlers.forEach(handler => handler(data));
        } catch (error) {
          Logger.error("Error processing WebSocket message", error, { 
            messageData: event.data 
          });
        }
      };
      
      socket.onclose = (event) => {
        clearTimeout(connectionTimer);
        clearInterval(heartbeatTimer);
        
        Logger.warn("WebSocket connection closed", { 
          code: event.code, 
          reason: event.reason
        });
        
        // Update status based on close reason
        if (event.code === 1000) {
          updateConnectionStatus('Disconnected');
        } else if (event.code === 4000) {
          updateConnectionStatus('Connection Timeout');
        } else {
          updateConnectionStatus('Connection Error');
        }
        
        socket = null;
        
        // Attempt to reconnect unless this was an intentional close
        if (event.code !== 1000 && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnect();
        }
      };
      
      socket.onerror = (error) => {
        Logger.error("WebSocket error", error);
        // Don't update status here - will be handled by onclose handler
      };
      
    } catch (error) {
      Logger.error("WebSocket setup error", error);
      updateConnectionStatus('Connection Error');
      socket = null;
      reconnect();
    }
  };
  
  const disconnect = () => {
    if (socket) {
      try {
        socket.close(1000, "Normal closure");
      } catch (error) {
        Logger.error("Error closing WebSocket", error);
      }
      socket = null;
    }
    
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    
    updateConnectionStatus('Disconnected');
  };
  
  const reconnect = () => {
    // Clear any existing reconnect timeout
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
    }
    
    reconnectAttempts++;
    
    // If max attempts reached, stop trying
    if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
      updateConnectionStatus('Reconnect Failed');
      return;
    }
    
    // Update status to show reconnection attempt
    updateConnectionStatus(`Reconnecting (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
    
    // Use exponential backoff
    const delay = RECONNECT_DELAY * Math.pow(1.5, reconnectAttempts - 1);
    
    // Schedule reconnect
    reconnectTimeout = setTimeout(() => {
      if (!isConnected) {
        socket = null;
        connect();
      }
    }, delay);
  };
  
  const send = (message) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      Logger.warn("Cannot send message, WebSocket not connected");
      return false;
    }
    
    try {
      socket.send(typeof message === 'string' ? message : JSON.stringify(message));
      return true;
    } catch (error) {
      Logger.error("Error sending WebSocket message", error, { message });
      return false;
    }
  };
  
  // Register event handlers
  const onMessage = (handler) => {
    if (typeof handler !== 'function') {
      throw new AppError(ERROR_TYPES.GENERAL_ERROR, "Message handler must be a function");
    }
    
    messageHandlers.add(handler);
    return () => messageHandlers.delete(handler);
  };
  
  const onConnectionStatusChange = (handler) => {
    if (typeof handler !== 'function') {
      throw new AppError(ERROR_TYPES.GENERAL_ERROR, "Status handler must be a function");
    }
    
    connectionStatusHandlers.add(handler);
    // Immediately call with current status
    handler(isConnected ? 'Connected' : 'Disconnected');
    return () => connectionStatusHandlers.delete(handler);
  };
  
  // Simulate data for development/testing
  const simulateData = () => {
    if (process.env.NODE_ENV !== 'production' && !isConnected) {
      Logger.info("Starting simulated WebSocket data");
      
      updateConnectionStatus('Connected');
      
      // Simulate periodic data updates
      const interval = setInterval(() => {
        const mockData = {
          type: 'update',
          timestamp: new Date().toISOString(),
          data: {
            UNRATE: {
              value: (4 + Math.random() * 2).toFixed(2),
              change: (Math.random() * 0.4 - 0.2).toFixed(2)
            },
            GDP: {
              value: (21500 + Math.random() * 500).toFixed(2),
              change: (Math.random() * 1 - 0.3).toFixed(2)
            },
            FEDFUNDS: {
              value: (3 + Math.random() * 1).toFixed(2),
              change: (Math.random() * 0.2 - 0.1).toFixed(2)
            }
          }
        };
        
        messageHandlers.forEach(handler => handler(mockData));
      }, 5000);
      
      // Store the interval for cleanup
      socket = { interval };
      
      return () => {
        clearInterval(interval);
        updateConnectionStatus('Disconnected');
        socket = null;
      };
    }
    return () => {};
  };
  
  return {
    connect,
    disconnect,
    send,
    onMessage,
    onConnectionStatusChange,
    isConnected: () => isConnected,
    simulateData
  };
})();
