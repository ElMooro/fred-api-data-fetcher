require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { StatusCodes } = require('http-status-codes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;
const API_VERSION = process.env.API_VERSION || 'v1';

// Basic middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Request parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// Simple logging middleware
app.use(morgan('dev'));

// Sample data
const items = [
  {
    id: 1,
    name: 'Enterprise Laptop',
    description: 'High-performance laptop for business use',
    price: 1299.99,
    category: 'electronics',
    createdAt: '2023-01-15T08:30:00.000Z',
    updatedAt: '2023-01-15T08:30:00.000Z'
  },
  {
    id: 2,
    name: 'Office Chair',
    description: 'Ergonomic chair for office workers',
    price: 299.99,
    category: 'furniture',
    createdAt: '2023-01-17T10:15:00.000Z',
    updatedAt: '2023-01-17T10:15:00.000Z'
  },
  {
    id: 3,
    name: 'Wireless Headphones',
    description: 'Noise-cancelling headphones for clear calls',
    price: 199.99,
    category: 'electronics',
    createdAt: '2023-01-20T14:45:00.000Z',
    updatedAt: '2023-01-20T14:45:00.000Z'
  }
];

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(StatusCodes.OK).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.get(`/api/${API_VERSION}/items`, (req, res) => {
  const { page = 1, limit = 10, sort = 'createdAt', order = 'desc', search } = req.query;
  
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  
  let filteredItems = [...items];
  
  // Apply search filter if provided
  if (search) {
    const searchLower = search.toLowerCase();
    filteredItems = filteredItems.filter(item => 
      item.name.toLowerCase().includes(searchLower) || 
      (item.description && item.description.toLowerCase().includes(searchLower))
    );
  }
  
  // Apply sorting
  filteredItems.sort((a, b) => {
    const aValue = a[sort];
    const bValue = b[sort];
    
    if (order.toLowerCase() === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
  
  // Apply pagination
  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = startIndex + limitNum;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);
  
  res.status(StatusCodes.OK).json({
    status: 'success',
    data: paginatedItems,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalItems: filteredItems.length,
      totalPages: Math.ceil(filteredItems.length / limitNum)
    }
  });
});

app.get(`/api/${API_VERSION}/items/:id`, (req, res) => {
  const { id } = req.params;
  const item = items.find(item => item.id.toString() === id.toString());
  
  if (!item) {
    return res.status(StatusCodes.NOT_FOUND).json({
      status: 'error',
      message: `Item with ID ${id} not found`
    });
  }
  
  res.status(StatusCodes.OK).json({
    status: 'success',
    data: item
  });
});

app.post(`/api/${API_VERSION}/items`, (req, res) => {
  const newItem = {
    id: items.length + 1,
    name: req.body.name,
    description: req.body.description,
    price: req.body.price,
    category: req.body.category,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  items.push(newItem);
  
  res.status(StatusCodes.CREATED).json({
    status: 'success',
    data: newItem
  });
});

app.put(`/api/${API_VERSION}/items/:id`, (req, res) => {
  const { id } = req.params;
  const index = items.findIndex(item => item.id.toString() === id.toString());
  
  if (index === -1) {
    return res.status(StatusCodes.NOT_FOUND).json({
      status: 'error',
      message: `Item with ID ${id} not found`
    });
  }
  
  const updatedItem = {
    ...items[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  items[index] = updatedItem;
  
  res.status(StatusCodes.OK).json({
    status: 'success',
    data: updatedItem
  });
});

app.delete(`/api/${API_VERSION}/items/:id`, (req, res) => {
  const { id } = req.params;
  const index = items.findIndex(item => item.id.toString() === id.toString());
  
  if (index === -1) {
    return res.status(StatusCodes.NOT_FOUND).json({
      status: 'error',
      message: `Item with ID ${id} not found`
    });
  }
  
  items.splice(index, 1);
  
  res.status(StatusCodes.NO_CONTENT).send();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// 404 handler
app.use((req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    status: 'error',
    message: 'Resource not found',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  res.status(err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api/${API_VERSION}`);
});

module.exports = app;
