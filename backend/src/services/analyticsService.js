// Analytics Service for GadgetShack
// Provides comprehensive business analytics and reporting

const database = require('../config/database');

class AnalyticsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Get cached result or execute query
  async getCachedResult(key, queryFunction) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const result = await queryFunction();
    this.cache.set(key, { data: result, timestamp: Date.now() });
    return result;
  }

  // Sales Analytics
  async getSalesAnalytics(period = 30) {
    const cacheKey = `sales_analytics_${period}`;
    
    return this.getCachedResult(cacheKey, async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - period);

      const [
        totalSales,
        salesByDay,
        salesByCategory,
        topProducts,
        averageOrderValue,
        conversionMetrics
      ] = await Promise.all([
        // Total sales
        database.query(`
          SELECT 
            COUNT(*) as total_orders,
            SUM(total_amount) as total_revenue,
            AVG(total_amount) as avg_order_value
          FROM orders 
          WHERE status != 'cancelled' AND created_at >= ?
        `, [startDate.toISOString()]),

        // Sales by day
        database.query(`
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as orders,
            SUM(total_amount) as revenue,
            AVG(total_amount) as avg_order_value
          FROM orders 
          WHERE status != 'cancelled' AND created_at >= ?
          GROUP BY DATE(created_at)
          ORDER BY date DESC
        `, [startDate.toISOString()]),

        // Sales by category
        database.query(`
          SELECT 
            c.name as category,
            COUNT(DISTINCT o.id) as orders,
            SUM(oi.quantity) as items_sold,
            SUM(oi.quantity * oi.price) as revenue
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          JOIN products p ON oi.product_id = p.id
          JOIN categories c ON p.category_id = c.id
          WHERE o.status != 'cancelled' AND o.created_at >= ?
          GROUP BY c.id, c.name
          ORDER BY revenue DESC
        `, [startDate.toISOString()]),

        // Top products
        database.query(`
          SELECT 
            p.name,
            p.sku,
            SUM(oi.quantity) as units_sold,
            SUM(oi.quantity * oi.price) as revenue,
            AVG(oi.price) as avg_price
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          JOIN products p ON oi.product_id = p.id
          WHERE o.status != 'cancelled' AND o.created_at >= ?
          GROUP BY p.id
          ORDER BY revenue DESC
          LIMIT 20
        `, [startDate.toISOString()]),

        // Average order value trend
        database.query(`
          SELECT 
            DATE(created_at) as date,
            AVG(total_amount) as avg_order_value,
            COUNT(*) as order_count
          FROM orders 
          WHERE status != 'cancelled' AND created_at >= ?
          GROUP BY DATE(created_at)
          ORDER BY date DESC
        `, [startDate.toISOString()]),

        // Conversion metrics (mock data - would need web analytics integration)
        this.getConversionMetrics(startDate)
      ]);

      return {
        summary: totalSales[0],
        salesByDay,
        salesByCategory,
        topProducts,
        averageOrderValue,
        conversionMetrics,
        period
      };
    });
  }

  // Customer Analytics
  async getCustomerAnalytics(period = 30) {
    const cacheKey = `customer_analytics_${period}`;
    
    return this.getCachedResult(cacheKey, async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - period);

      const [
        customerMetrics,
        newCustomers,
        customerSegments,
        topCustomers,
        customerRetention
      ] = await Promise.all([
        // Customer metrics
        database.query(`
          SELECT 
            COUNT(DISTINCT user_id) as total_customers,
            COUNT(*) as total_orders,
            AVG(total_amount) as avg_order_value,
            SUM(total_amount) / COUNT(DISTINCT user_id) as avg_customer_value
          FROM orders 
          WHERE status != 'cancelled' AND created_at >= ?
        `, [startDate.toISOString()]),

        // New customers
        database.query(`
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as new_customers
          FROM users 
          WHERE role = 'customer' AND created_at >= ?
          GROUP BY DATE(created_at)
          ORDER BY date DESC
        `, [startDate.toISOString()]),

        // Customer segments
        database.query(`
          SELECT 
            CASE 
              WHEN order_count = 1 THEN 'One-time'
              WHEN order_count BETWEEN 2 AND 5 THEN 'Regular'
              WHEN order_count > 5 THEN 'Loyal'
            END as segment,
            COUNT(*) as customer_count,
            AVG(total_spent) as avg_spent
          FROM (
            SELECT 
              user_id,
              COUNT(*) as order_count,
              SUM(total_amount) as total_spent
            FROM orders 
            WHERE status != 'cancelled'
            GROUP BY user_id
          ) customer_stats
          GROUP BY segment
        `),

        // Top customers
        database.query(`
          SELECT 
            u.first_name,
            u.last_name,
            u.email,
            COUNT(o.id) as order_count,
            SUM(o.total_amount) as total_spent,
            AVG(o.total_amount) as avg_order_value,
            MAX(o.created_at) as last_order_date
          FROM users u
          JOIN orders o ON u.id = o.user_id
          WHERE o.status != 'cancelled' AND o.created_at >= ?
          GROUP BY u.id
          ORDER BY total_spent DESC
          LIMIT 20
        `, [startDate.toISOString()]),

        // Customer retention (simplified)
        this.getCustomerRetention(startDate)
      ]);

      return {
        metrics: customerMetrics[0],
        newCustomers,
        segments: customerSegments,
        topCustomers,
        retention: customerRetention,
        period
      };
    });
  }

  // Inventory Analytics
  async getInventoryAnalytics() {
    const cacheKey = 'inventory_analytics';
    
    return this.getCachedResult(cacheKey, async () => {
      const [
        stockLevels,
        lowStockItems,
        fastMovingItems,
        slowMovingItems,
        stockValue
      ] = await Promise.all([
        // Stock levels by category
        database.query(`
          SELECT 
            c.name as category,
            COUNT(p.id) as product_count,
            SUM(p.stock_quantity) as total_stock,
            AVG(p.stock_quantity) as avg_stock,
            SUM(p.stock_quantity * p.price) as stock_value
          FROM products p
          JOIN categories c ON p.category_id = c.id
          WHERE p.status = 'active'
          GROUP BY c.id, c.name
          ORDER BY stock_value DESC
        `),

        // Low stock items
        database.query(`
          SELECT 
            p.name,
            p.sku,
            p.stock_quantity,
            p.price,
            c.name as category,
            COALESCE(sales.units_sold_30d, 0) as units_sold_30d
          FROM products p
          JOIN categories c ON p.category_id = c.id
          LEFT JOIN (
            SELECT 
              oi.product_id,
              SUM(oi.quantity) as units_sold_30d
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status != 'cancelled' 
              AND o.created_at >= date('now', '-30 days')
            GROUP BY oi.product_id
          ) sales ON p.id = sales.product_id
          WHERE p.status = 'active' AND p.stock_quantity <= 10
          ORDER BY p.stock_quantity ASC
        `),

        // Fast moving items (high sales velocity)
        database.query(`
          SELECT 
            p.name,
            p.sku,
            p.stock_quantity,
            SUM(oi.quantity) as units_sold_30d,
            SUM(oi.quantity * oi.price) as revenue_30d,
            p.stock_quantity / NULLIF(SUM(oi.quantity), 0) * 30 as days_of_stock
          FROM products p
          JOIN order_items oi ON p.id = oi.product_id
          JOIN orders o ON oi.order_id = o.id
          WHERE o.status != 'cancelled' 
            AND o.created_at >= date('now', '-30 days')
            AND p.status = 'active'
          GROUP BY p.id
          HAVING units_sold_30d > 5
          ORDER BY units_sold_30d DESC
          LIMIT 20
        `),

        // Slow moving items
        database.query(`
          SELECT 
            p.name,
            p.sku,
            p.stock_quantity,
            p.price,
            p.stock_quantity * p.price as stock_value,
            COALESCE(SUM(oi.quantity), 0) as units_sold_90d,
            p.created_at
          FROM products p
          LEFT JOIN order_items oi ON p.id = oi.product_id
          LEFT JOIN orders o ON oi.order_id = o.id 
            AND o.status != 'cancelled' 
            AND o.created_at >= date('now', '-90 days')
          WHERE p.status = 'active'
          GROUP BY p.id
          HAVING units_sold_90d <= 1
          ORDER BY stock_value DESC
          LIMIT 20
        `),

        // Total stock value
        database.query(`
          SELECT 
            COUNT(*) as total_products,
            SUM(stock_quantity) as total_units,
            SUM(stock_quantity * price) as total_value,
            AVG(price) as avg_price
          FROM products 
          WHERE status = 'active'
        `)
      ]);

      return {
        stockLevels,
        lowStockItems,
        fastMovingItems,
        slowMovingItems,
        stockValue: stockValue[0]
      };
    });
  }

  // Performance Analytics
  async getPerformanceAnalytics(period = 30) {
    const cacheKey = `performance_analytics_${period}`;
    
    return this.getCachedResult(cacheKey, async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - period);

      const [
        orderMetrics,
        paymentMetrics,
        shippingMetrics
      ] = await Promise.all([
        // Order processing metrics
        database.query(`
          SELECT 
            status,
            COUNT(*) as count,
            AVG(julianday('now') - julianday(created_at)) as avg_age_days
          FROM orders 
          WHERE created_at >= ?
          GROUP BY status
        `, [startDate.toISOString()]),

        // Payment metrics
        database.query(`
          SELECT 
            payment_status,
            COUNT(*) as count,
            SUM(total_amount) as total_amount
          FROM orders 
          WHERE created_at >= ?
          GROUP BY payment_status
        `, [startDate.toISOString()]),

        // Shipping metrics
        database.query(`
          SELECT 
            shipping_provider,
            COUNT(*) as shipments,
            AVG(julianday(estimated_delivery) - julianday(created_at)) as avg_delivery_days
          FROM orders 
          WHERE tracking_number IS NOT NULL 
            AND created_at >= ?
          GROUP BY shipping_provider
        `, [startDate.toISOString()])
      ]);

      return {
        orderMetrics,
        paymentMetrics,
        shippingMetrics,
        period
      };
    });
  }

  // Helper methods
  async getConversionMetrics(startDate) {
    // Mock conversion data - in production, integrate with Google Analytics
    return {
      websiteVisitors: Math.floor(Math.random() * 10000) + 5000,
      productViews: Math.floor(Math.random() * 50000) + 20000,
      cartAdditions: Math.floor(Math.random() * 2000) + 1000,
      checkoutInitiations: Math.floor(Math.random() * 800) + 400,
      completedOrders: Math.floor(Math.random() * 200) + 100,
      conversionRate: (Math.random() * 3 + 1).toFixed(2) + '%'
    };
  }

  async getCustomerRetention(startDate) {
    // Simplified retention calculation
    const retention = await database.query(`
      SELECT 
        COUNT(DISTINCT CASE WHEN order_count = 1 THEN user_id END) as new_customers,
        COUNT(DISTINCT CASE WHEN order_count > 1 THEN user_id END) as returning_customers
      FROM (
        SELECT 
          user_id,
          COUNT(*) as order_count
        FROM orders 
        WHERE status != 'cancelled' AND created_at >= ?
        GROUP BY user_id
      ) customer_orders
    `, [startDate.toISOString()]);

    const result = retention[0];
    const total = result.new_customers + result.returning_customers;
    
    return {
      newCustomers: result.new_customers,
      returningCustomers: result.returning_customers,
      retentionRate: total > 0 ? ((result.returning_customers / total) * 100).toFixed(2) + '%' : '0%'
    };
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

module.exports = new AnalyticsService();
