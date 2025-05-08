import { LiveData, ConnectionStatus } from '../types';

// Type definition for message handlers
type MessageHandler = (data: LiveData) => void;
type ConnectionStatusHandler = (status: ConnectionStatus) => void;

// WebSocketService implementation
export class WebSocketService {
  private static instance: WebSocket | null = null;
  private static messageHandlers: MessageHandler[] = [];
  private static statusHandlers: ConnectionStatusHandler[] = [];
  private static status: ConnectionStatus = 'Disconnected';
  private static reconnectAttempts = 0;
  private static maxReconnectAttempts = 5;
  private static reconnectTimeout: NodeJS.Timeout | null = null;

  // Initialize WebSocket connection
  public static initialize(url: string): void {
    if (this.instance) {
      this.closeConnection();
    }

    try {
      this.updateStatus('Connecting...');
      this.instance = new WebSocket(url);
      
      this.instance.onopen = () => {
        this.updateStatus('Connected');
        this.reconnectAttempts = 0;
      };
      
      this.instance.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notifyMessageHandlers(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.instance.onclose = () => {
        this.updateStatus('Disconnected');
        this.attemptReconnect(url);
      };
      
      this.instance.onerror = () => {
        this.updateStatus('Connection Error');
        this.closeConnection();
        this.attemptReconnect(url);
      };
    } catch (error) {
      console.error('Error initializing WebSocket:', error);
      this.updateStatus('Connection Error');
    }
  }

  // Close the connection
  public static closeConnection(): void {
    if (this.instance && this.instance.readyState === WebSocket.OPEN) {
      this.instance.close();
    }
    this.instance = null;
    this.updateStatus('Disconnected');
  }

  // Register a message handler
  public static onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.push(handler);
    
    // Return unsubscribe function
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  // Register a connection status handler
  public static onConnectionStatusChange(handler: ConnectionStatusHandler): () => void {
    this.statusHandlers.push(handler);
    
    // Immediately notify with current status
    handler(this.status);
    
    // Return unsubscribe function
    return () => {
      this.statusHandlers = this.statusHandlers.filter(h => h !== handler);
    };
  }

  // Send data through WebSocket
  public static sendMessage(data: any): boolean {
    if (this.instance && this.instance.readyState === WebSocket.OPEN) {
      this.instance.send(JSON.stringify(data));
      return true;
    }
    return false;
  }

  // Get current connection status
  public static getStatus(): ConnectionStatus {
    return this.status;
  }

  // Private method to notify all message handlers
  private static notifyMessageHandlers(data: LiveData): void {
    this.messageHandlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });
  }

  // Private method to update and notify about connection status changes
  private static updateStatus(status: ConnectionStatus): void {
    this.status = status;
    this.statusHandlers.forEach(handler => {
      try {
        handler(status);
      } catch (error) {
        console.error('Error in status handler:', error);
      }
    });
  }

  // Private method to attempt reconnection
  private static attemptReconnect(url: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.updateStatus('Reconnecting');
      
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
      
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }
      
      this.reconnectTimeout = setTimeout(() => {
        this.initialize(url);
      }, delay);
    } else {
      this.updateStatus('Reconnect Failed');
    }
  }
}
