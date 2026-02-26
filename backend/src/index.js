require('dotenv').config();
const express = require('express');
const cors = require('cors');
const database = require('./config/database');
const {
  generalLimiter,
  helmetConfig,
  handleValidationErrors
} = require('./middleware/security');
const {
  compressionMiddleware,
  responseTimeMiddleware,
  cacheMiddleware,
  requestOptimization,
  optimizeDatabase,
  memoryMonitoring,
  gracefulShutdown,
  metricsMiddleware,
  getMetrics
} = require('./middleware/performance');

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payments');
const shippingRoutes = require('./routes/shipping');
const analyticsRoutes = require('./routes/analytics');
const seoRoutes = require('./routes/seo');
const homeRoutes = require('./routes/home');

const app = express();
const PORT = process.env.PORT || 9000;

// Performance middleware
app.use(compressionMiddleware);
app.use(responseTimeMiddleware);
app.use(requestOptimization);
app.use(metricsMiddleware);
app.use(memoryMonitoring);

// Security middleware
app.use(helmetConfig);
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:8000',
      'http://127.0.0.1:8000',
      'http://127.0.0.1:3000',
      'https://gadgetshack-frontend.onrender.com',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    // Allow all Vercel preview and production deployments
    if (origin && origin.includes('.vercel.app')) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow all origins in development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
app.use('/api/', generalLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Error handling middleware
app.use(handleValidationErrors);

// Handle preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'GadgetShack Backend'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/seo', seoRoutes);
app.use('/api', homeRoutes);

// Basic API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'GadgetShack API',
    version: '1.0.0',
    description: 'Private e-commerce backend with SQLite',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      categories: '/api/categories',
      orders: '/api/orders',
      admin: '/api/admin'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Metrics endpoint for monitoring
app.get('/metrics', (req, res) => {
  const metrics = getMetrics();
  res.json(metrics);
});

// Ready check endpoint
app.get('/ready', async (req, res) => {
  try {
    // Check database connection
    await database.query('SELECT 1');
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      status: err.status || 500
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      message: 'Endpoint not found',
      status: 404
    }
  });
});

// Initialize database and start server
async function startServer() {
  try {
    console.log('🚀 Starting GadgetShack Backend...');
    
    // Initialize database
    await database.initialize();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📊 API documentation: http://localhost:${PORT}/api`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await database.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server...');
  await database.close();
  process.exit(0);
});

// Start the server unless running tests
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = { app, startServer };
