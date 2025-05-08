const express = require('express');
const app = express();
const PORT = 5000; // Using port 5000 to avoid any conflicts

app.get('/', (req, res) => {
  res.json({ message: 'Test server is running' });
});

app.get('/test', (req, res) => {
  res.json({ endpoint: 'test', working: true });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on port ${PORT}`);
});
