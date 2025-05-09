const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

// Create Express server
const app = express();

// Enable CORS for all routes
app.use(cors());

// Serve static files from the React app
app.use(express.static('build'));

// Proxy API requests to backend
app.use('/api', createProxyMiddleware({ 
  target: 'http://localhost:5001',
  changeOrigin: true
}));

// Serve the health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'UP', timestamp: new Date().toISOString() });
});

// All other routes should redirect to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
