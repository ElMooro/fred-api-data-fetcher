// WebSocket handler Lambda function
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

// Table for connection management
const TABLE_NAME = process.env.TABLE_NAME;

// Generate mock financial data
const generateMockData = () => {
  return {
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
  };
};

// Send message to connected client
const sendMessage = async (connectionId, message, domainName, stage) => {
  const apiGateway = new AWS.ApiGatewayManagementApi({
    endpoint: `${domainName}/${stage}`
  });
  
  try {
    await apiGateway.postToConnection({
      ConnectionId: connectionId,
      Data: JSON.stringify(message)
    }).promise();
    return { success: true };
  } catch (error) {
    console.error('Error sending message:', error);
    
    // If connection not found, remove it from the database
    if (error.statusCode === 410) {
      try {
        await dynamo.delete({
          TableName: TABLE_NAME,
          Key: { connectionId }
        }).promise();
      } catch (deleteError) {
        console.error('Error removing stale connection:', deleteError);
      }
    }
    
    return { success: false, error };
  }
};

// Lambda handlers for WebSocket API routes
exports.handler = async (event) => {
  console.log('Event received:', JSON.stringify(event));
  
  const connectionId = event.requestContext.connectionId;
  const routeKey = event.requestContext.routeKey;
  const domainName = event.requestContext.domainName;
  const stage = event.requestContext.stage;
  
  try {
    switch (routeKey) {
      case '$connect':
        // Store connection ID in DynamoDB
        await dynamo.put({
          TableName: TABLE_NAME,
          Item: {
            connectionId,
            connectedAt: new Date().toISOString(),
            subscriptions: [] // Initialize empty subscriptions array
          }
        }).promise();
        
        return { statusCode: 200, body: 'Connected' };
        
      case '$disconnect':
        // Remove connection ID from DynamoDB
        await dynamo.delete({
          TableName: TABLE_NAME,
          Key: { connectionId }
        }).promise();
        
        return { statusCode: 200, body: 'Disconnected' };
        
      case '$default':
        // Default handler for unspecified routes
        return { statusCode: 200, body: 'Received on default route' };
        
      case 'heartbeat':
        // Handle heartbeat requests to keep connection alive
        await sendMessage(connectionId, {
          type: 'heartbeat',
          timestamp: new Date().toISOString()
        }, domainName, stage);
        
        return { statusCode: 200, body: 'Heartbeat acknowledged' };
        
      case 'subscribe':
        // Handle subscription requests
        let body = {};
        try {
          if (event.body) {
            body = JSON.parse(event.body);
          }
        } catch (error) {
          console.error('Error parsing request body:', error);
        }
        
        // Get sources to subscribe to
        const sources = Array.isArray(body.sources) ? body.sources : [];
        
        // Update subscription in the database
        await dynamo.update({
          TableName: TABLE_NAME,
          Key: { connectionId },
          UpdateExpression: 'SET subscriptions = :sources',
          ExpressionAttributeValues: {
            ':sources': sources
          }
        }).promise();
        
        // Send confirmation
        await sendMessage(connectionId, {
          type: 'subscribed',
          sources,
          timestamp: new Date().toISOString()
        }, domainName, stage);
        
        return { statusCode: 200, body: 'Subscribed' };
        
      default:
        // Unknown route
        console.error(`Unknown route: ${routeKey}`);
        return { statusCode: 400, body: 'Unknown route' };
    }
  } catch (error) {
    console.error('Error processing event:', error);
    return { statusCode: 500, body: 'Internal server error' };
  }
};

// Separate handler for scheduled data broadcasts
exports.broadcastData = async (event) => {
  console.log('Broadcast event received:', JSON.stringify(event));
  
  try {
    // Get all connections
    const connections = await dynamo.scan({
      TableName: TABLE_NAME
    }).promise();
    
    if (!connections.Items || connections.Items.length === 0) {
      console.log('No active connections to broadcast to');
      return { statusCode: 200, body: 'No connections' };
    }
    
    // Generate new data
    const data = generateMockData();
    const message = {
      type: 'update',
      timestamp: new Date().toISOString(),
      data
    };
    
    // Extract domain and stage from event or use environment variables
    const domainName = process.env.DOMAIN_NAME;
    const stage = process.env.STAGE || 'production';
    
    if (!domainName) {
      throw new Error('DOMAIN_NAME environment variable is required');
    }
    
    // Send to all connections
    const sendPromises = connections.Items.map(async (connection) => {
      return sendMessage(
        connection.connectionId,
        message,
        domainName,
        stage
      );
    });
    
    await Promise.all(sendPromises);
    
    return { statusCode: 200, body: 'Broadcast complete' };
  } catch (error) {
    console.error('Error broadcasting data:', error);
    return { statusCode: 500, body: 'Broadcast failed' };
  }
};
