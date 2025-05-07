// WebSocket service for live data
class AwsWebSocketService {
  constructor() {
    this.url = process.env.REACT_APP_WS_ENDPOINT;
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.messageHandlers = new Set();
    this.statusHandlers = new Set();
    
    this.handleOpen = this.handleOpen.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleError = this.handleError.bind(this);
  }

  connect() {
    if (this.socket) return;
    
    try {
      this.updateStatus('connecting');
      this.socket = new WebSocket(this.url);
      
      this.socket.addEventListener('open', this.handleOpen);
      this.socket.addEventListener('message', this.handleMessage);
      this.socket.addEventListener('close', this.handleClose);
      this.socket.addEventListener('error', this.handleError);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.updateStatus('error');
      this.reconnect();
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close(1000, 'Normal closure');
      this.socket = null;
    }
    
    this.updateStatus('disconnected');
  }

  subscribe(sources) {
    if (!this.isConnected) {
      this.connect();
    }
    
    this.send({
      action: 'subscribe',
      sources: Array.isArray(sources) ? sources : [sources],
      timestamp: new Date().toISOString()
    });
  }

  unsubscribe(sources) {
    if (this.isConnected) {
      this.send({
        action: 'unsubscribe',
        sources: Array.isArray(sources) ? sources : [sources],
        timestamp: new Date().toISOString()
      });
    }
  }

  send(data) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send message: WebSocket is not connected');
      return false;
    }

    try {
      const payload = typeof data === 'object' ? JSON.stringify(data) : data;
      this.socket.send(payload);
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  }

  onMessage(handler) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onStatus(handler) {
    this.statusHandlers.add(handler);
    handler(this.getStatus());
    return () => this.statusHandlers.delete(handler);
  }

  getStatus() {
    return this.status || 'disconnected';
  }

  updateStatus(status) {
    this.status = status;
    this.isConnected = status === 'connected';
    this.statusHandlers.forEach(handler => handler(status));
  }

  reconnect() {
    if (this.reconnectAttempts >= 5) return;
    
    this.reconnectAttempts++;
    this.updateStatus('reconnecting');
    
    setTimeout(() => {
      this.socket = null;
      this.connect();
    }, 2000 * this.reconnectAttempts);
  }

  handleOpen() {
    this.reconnectAttempts = 0;
    this.updateStatus('connected');
  }

  handleMessage(event) {
    try {
      const data = JSON.parse(event.data);
      this.messageHandlers.forEach(handler => handler(data));
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  handleClose(event) {
    this.updateStatus('disconnected');
    
    if (event.code !== 1000) {
      this.reconnect();
    }
  }

  handleError(error) {
    console.error('WebSocket error:', error);
  }
}

const webSocketService = new AwsWebSocketService();
export default webSocketService;
