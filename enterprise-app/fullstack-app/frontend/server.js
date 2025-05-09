const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const path = require('path');

const app = express();

// Enable CORS for all routes
app.use(cors());

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Proxy API requests to backend
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:5001',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api/v1' // Rewrite path if needed
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying request to: ${proxyReq.method} ${proxyReq.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`Proxy response: ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Proxy error', message: err.message });
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Direct endpoint to test connectivity
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Proxy server is working!', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Dynamic test endpoint that makes a direct request to the backend
app.get('/test-backend', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('http://localhost:5001/api/v1/items');
    
    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    res.json({
      message: 'Successfully connected to backend!',
      items_count: data.data?.length || 0,
      backend_response: data
    });
  } catch (error) {
    console.error('Error connecting to backend:', error);
    res.status(500).json({
      error: 'Failed to connect to backend',
      message: error.message
    });
  }
});

// Serve static files from the build directory
app.use(express.static('build'));

// For all other GET requests, serve the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
  console.log(`Test it by visiting: http://localhost:${PORT}/test`);
});
