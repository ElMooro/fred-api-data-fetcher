import { DataPoint, ConnectionStatus } from '../types';

type StatusHandler = (status: ConnectionStatus) => void;
type DataHandler = (data: DataPoint[]) => void;

export class WebSocketService {
  private socket: WebSocket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private readonly MAX_RECONNECT_ATTEMPTS: number = 5;
  private readonly RECONNECT_DELAY_MS: number = 3000;
  
  private readonly connectionStatusHandlers: Set<StatusHandler> = new Set();
  private readonly dataHandlers: Set<DataHandler> = new Set();
  
  private updateConnectionStatus(status: ConnectionStatus): void {
    this.isConnected = status === ConnectionStatus.CONNECTED;
    this.connectionStatusHandlers.forEach(handler => handler(status));
  }
  
  public connect(url: string): void {
    if (this.socket) {
      return; // Already connected or connecting
    }
    
    try {
      this.updateConnectionStatus(ConnectionStatus.CONNECTING);
      
      // Mock WebSocket connection for development
      setTimeout(() => {
        this.updateConnectionStatus(ConnectionStatus.CONNECTED);
        this.reconnectAttempts = 0;
        
        const interval = setInterval(() => {
          // Simulate receiving data
          const mockData: DataPoint[] = [
            {
              date: new Date().toISOString().split('T')[0],
              value: Math.random() * 100
            }
          ];
          
          this.dataHandlers.forEach(handler => handler(mockData));
        }, 5000);
        
        // Store interval reference for cleanup
        (this as any).mockInterval = interval;
      }, 1000);
      
      /* Real WebSocket implementation would be:
      this.socket = new WebSocket(url);
      
      this.socket.onopen = () => {
        this.updateConnectionStatus(ConnectionStatus.CONNECTED);
        this.reconnectAttempts = 0;
      };
      
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.dataHandlers.forEach(handler => handler(data));
        } catch (error) {
          console.error('Error parsing WebSocket data', error);
        }
      };
      
      this.socket.onclose = () => {
        this.disconnect();
        this.reconnect();
      };
      
      this.socket.onerror = (error) => {
        console.error('WebSocket error', error);
        this.updateConnectionStatus(ConnectionStatus.ERROR);
      };
      */
    } catch (error) {
      console.error("WebSocket connection error", error);
      this.updateConnectionStatus(ConnectionStatus.ERROR);
      this.reconnect();
    }
  }

  public onMessage(callback: (data: any) => void): () => void {
    // Simple wrapper for the data handler that passes the raw message
    return this.onData((data) => {
      callback({ data, timestamp: new Date().toISOString() });
    });
  }
  
  public disconnect(): void {
    if ((this as any).mockInterval) {
      clearInterval((this as any).mockInterval);
      (this as any).mockInterval = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.updateConnectionStatus(ConnectionStatus.DISCONNECTED);
  }
  
  private reconnect(): void {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      this.updateConnectionStatus(ConnectionStatus.RECONNECT_FAILED);
      return;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.reconnectAttempts++;
    this.updateConnectionStatus(ConnectionStatus.CONNECTING);
    
    this.reconnectTimeout = setTimeout(() => {
      this.socket = null;
      this.connect('ws://example.com/websocket'); // Use your actual WebSocket URL
    }, this.RECONNECT_DELAY_MS);
  }
  
  public onData(handler: DataHandler): () => void {
    this.dataHandlers.add(handler);
    return () => this.dataHandlers.delete(handler);
  }
  
  public onConnectionStatusChange(handler: StatusHandler): () => void {
    this.connectionStatusHandlers.add(handler);
    handler(this.isConnected ? ConnectionStatus.CONNECTED : ConnectionStatus.DISCONNECTED);
    return () => this.connectionStatusHandlers.delete(handler);
  }
}

// Create and export a singleton instance
const webSocketService = new WebSocketService();
export default webSocketService;
