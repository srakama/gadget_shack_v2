// Performance optimization middleware for production

const compression = require('compression');
const responseTime = require('response-time');

// Redis client for caching (if available)
let redisClient = null;
try {
  if (process.env.REDIS_URL) {
    const redis = require('redis');
    redisClient = redis.createClient({
      url: process.env.REDIS_URL,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          return new Error('Redis server connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          return new Error('Redis retry time exhausted');
        }
        if (options.attempt > 10) {
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });
    
    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });
    
    redisClient.on('connect', () => {
      console.log('✅ Redis connected for caching');
    });
  }
} catch (error) {
  console.warn('Redis not available, using memory cache fallback');
}

// In-memory cache fallback
const memoryCache = new Map();
const MEMORY_CACHE_MAX_SIZE = 1000;
const MEMORY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Compression middleware
const compressionMiddleware = compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024,
  chunkSize: 16 * 1024,
  windowBits: 15,
  memLevel: 8
});

// Response time tracking
const responseTimeMiddleware = responseTime((req, res, time) => {
  // Log slow requests
  if (time > 1000) {
    console.warn(`Slow request: ${req.method} ${req.url} - ${time.toFixed(2)}ms`);
  }
  
  // Add response time header
  res.setHeader('X-Response-Time', `${time.toFixed(2)}ms`);
});

// Cache middleware
const cacheMiddleware = (ttl = 300) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    // Skip caching for authenticated requests
    if (req.headers.authorization) {
      return next();
    }
    
    const cacheKey = `cache:${req.originalUrl}`;
    
    try {
      let cachedData = null;
      
      // Try Redis first
      if (redisClient && redisClient.connected) {
        cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
          cachedData = JSON.parse(cachedData);
        }
      } else {
        // Fallback to memory cache
        const cached = memoryCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < MEMORY_CACHE_TTL) {
          cachedData = cached.data;
        }
      }
      
      if (cachedData) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Cache-Control', `public, max-age=${ttl}`);
        return res.json(cachedData);
      }
      
      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(data) {
        // Cache successful responses
        if (res.statusCode === 200) {
          try {
            if (redisClient && redisClient.connected) {
              redisClient.setex(cacheKey, ttl, JSON.stringify(data));
            } else {
              // Memory cache with size limit
              if (memoryCache.size >= MEMORY_CACHE_MAX_SIZE) {
                const firstKey = memoryCache.keys().next().value;
                memoryCache.delete(firstKey);
              }
              memoryCache.set(cacheKey, {
                data,
                timestamp: Date.now()
              });
            }
          } catch (error) {
            console.error('Cache write error:', error);
          }
        }
        
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('Cache-Control', `public, max-age=${ttl}`);
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

// Request optimization middleware
const requestOptimization = (req, res, next) => {
  // Set keep-alive headers
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=5, max=1000');
  
  // Security headers for performance
  res.setHeader('X-DNS-Prefetch-Control', 'on');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // CORS optimization
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  }
  
  next();
};

// Database connection pooling optimization
const optimizeDatabase = (database) => {
  // Set pragmas for SQLite optimization
  if (database.db && database.db.constructor.name === 'Database') {
    database.db.pragma('journal_mode = WAL');
    database.db.pragma('synchronous = NORMAL');
    database.db.pragma('cache_size = 1000');
    database.db.pragma('temp_store = MEMORY');
  }
};

// Memory usage monitoring
const memoryMonitoring = (req, res, next) => {
  const used = process.memoryUsage();
  
  // Log memory usage for high-memory requests
  if (used.heapUsed > 100 * 1024 * 1024) { // 100MB
    console.warn('High memory usage:', {
      rss: Math.round(used.rss / 1024 / 1024) + 'MB',
      heapTotal: Math.round(used.heapTotal / 1024 / 1024) + 'MB',
      heapUsed: Math.round(used.heapUsed / 1024 / 1024) + 'MB',
      external: Math.round(used.external / 1024 / 1024) + 'MB',
      url: req.url
    });
  }
  
  next();
};

// Graceful shutdown handling
const gracefulShutdown = (server) => {
  const shutdown = (signal) => {
    console.log(`Received ${signal}. Graceful shutdown...`);
    
    server.close(() => {
      console.log('HTTP server closed.');
      
      // Close Redis connection
      if (redisClient && redisClient.connected) {
        redisClient.quit();
      }
      
      // Clear memory cache
      memoryCache.clear();
      
      process.exit(0);
    });
    
    // Force close after 30 seconds
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 30000);
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

// Performance metrics collection
const performanceMetrics = {
  requests: 0,
  errors: 0,
  totalResponseTime: 0,
  slowRequests: 0,
  cacheHits: 0,
  cacheMisses: 0
};

const metricsMiddleware = (req, res, next) => {
  const startTime = Date.now();
  performanceMetrics.requests++;
  
  // Override res.end to capture metrics
  const originalEnd = res.end;
  res.end = function(...args) {
    const responseTime = Date.now() - startTime;
    performanceMetrics.totalResponseTime += responseTime;
    
    if (responseTime > 1000) {
      performanceMetrics.slowRequests++;
    }
    
    if (res.statusCode >= 400) {
      performanceMetrics.errors++;
    }
    
    if (res.getHeader('X-Cache') === 'HIT') {
      performanceMetrics.cacheHits++;
    } else if (res.getHeader('X-Cache') === 'MISS') {
      performanceMetrics.cacheMisses++;
    }
    
    return originalEnd.apply(this, args);
  };
  
  next();
};

// Get performance metrics
const getMetrics = () => {
  const avgResponseTime = performanceMetrics.requests > 0 
    ? performanceMetrics.totalResponseTime / performanceMetrics.requests 
    : 0;
    
  const cacheHitRate = (performanceMetrics.cacheHits + performanceMetrics.cacheMisses) > 0
    ? (performanceMetrics.cacheHits / (performanceMetrics.cacheHits + performanceMetrics.cacheMisses)) * 100
    : 0;
  
  return {
    ...performanceMetrics,
    avgResponseTime: Math.round(avgResponseTime * 100) / 100,
    cacheHitRate: Math.round(cacheHitRate * 100) / 100,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  };
};

module.exports = {
  compressionMiddleware,
  responseTimeMiddleware,
  cacheMiddleware,
  requestOptimization,
  optimizeDatabase,
  memoryMonitoring,
  gracefulShutdown,
  metricsMiddleware,
  getMetrics,
  redisClient
};
