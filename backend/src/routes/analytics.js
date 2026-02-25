const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const analyticsService = require('../services/analyticsService');

const router = express.Router();

// Apply admin authentication to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Sales Analytics
router.get('/sales', async (req, res) => {
  try {
    const { period = 30 } = req.query;
    const analytics = await analyticsService.getSalesAnalytics(parseInt(period));
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching sales analytics:', error);
    res.status(500).json({ error: 'Failed to fetch sales analytics' });
  }
});

// Customer Analytics
router.get('/customers', async (req, res) => {
  try {
    const { period = 30 } = req.query;
    const analytics = await analyticsService.getCustomerAnalytics(parseInt(period));
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching customer analytics:', error);
    res.status(500).json({ error: 'Failed to fetch customer analytics' });
  }
});

// Inventory Analytics
router.get('/inventory', async (req, res) => {
  try {
    const analytics = await analyticsService.getInventoryAnalytics();
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching inventory analytics:', error);
    res.status(500).json({ error: 'Failed to fetch inventory analytics' });
  }
});

// Performance Analytics
router.get('/performance', async (req, res) => {
  try {
    const { period = 30 } = req.query;
    const analytics = await analyticsService.getPerformanceAnalytics(parseInt(period));
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching performance analytics:', error);
    res.status(500).json({ error: 'Failed to fetch performance analytics' });
  }
});

// Combined Dashboard Analytics
router.get('/dashboard', async (req, res) => {
  try {
    const { period = 30 } = req.query;
    const periodInt = parseInt(period);

    const [
      salesAnalytics,
      customerAnalytics,
      inventoryAnalytics,
      performanceAnalytics
    ] = await Promise.all([
      analyticsService.getSalesAnalytics(periodInt),
      analyticsService.getCustomerAnalytics(periodInt),
      analyticsService.getInventoryAnalytics(),
      analyticsService.getPerformanceAnalytics(periodInt)
    ]);

    res.json({
      sales: salesAnalytics,
      customers: customerAnalytics,
      inventory: inventoryAnalytics,
      performance: performanceAnalytics,
      period: periodInt,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard analytics' });
  }
});

// Export data for reporting
router.get('/export/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { period = 30, format = 'json' } = req.query;

    let data;
    switch (type) {
      case 'sales':
        data = await analyticsService.getSalesAnalytics(parseInt(period));
        break;
      case 'customers':
        data = await analyticsService.getCustomerAnalytics(parseInt(period));
        break;
      case 'inventory':
        data = await analyticsService.getInventoryAnalytics();
        break;
      case 'performance':
        data = await analyticsService.getPerformanceAnalytics(parseInt(period));
        break;
      default:
        return res.status(400).json({ error: 'Invalid export type' });
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(data, type);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}_analytics_${Date.now()}.csv"`);
      res.send(csv);
    } else {
      // Return JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${type}_analytics_${Date.now()}.json"`);
      res.json(data);
    }

  } catch (error) {
    console.error('Error exporting analytics:', error);
    res.status(500).json({ error: 'Failed to export analytics data' });
  }
});

// Clear analytics cache
router.post('/cache/clear', (req, res) => {
  try {
    analyticsService.clearCache();
    res.json({ message: 'Analytics cache cleared successfully' });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// Get cache statistics
router.get('/cache/stats', (req, res) => {
  try {
    const stats = analyticsService.getCacheStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching cache stats:', error);
    res.status(500).json({ error: 'Failed to fetch cache statistics' });
  }
});

// Helper function to convert data to CSV
function convertToCSV(data, type) {
  try {
    let csvContent = '';
    
    switch (type) {
      case 'sales':
        if (data.salesByDay && data.salesByDay.length > 0) {
          csvContent = 'Date,Orders,Revenue,Average Order Value\n';
          data.salesByDay.forEach(row => {
            csvContent += `${row.date},${row.orders},${row.revenue},${row.avg_order_value}\n`;
          });
        }
        break;
        
      case 'customers':
        if (data.topCustomers && data.topCustomers.length > 0) {
          csvContent = 'First Name,Last Name,Email,Order Count,Total Spent,Average Order Value,Last Order Date\n';
          data.topCustomers.forEach(customer => {
            csvContent += `${customer.first_name},${customer.last_name},${customer.email},${customer.order_count},${customer.total_spent},${customer.avg_order_value},${customer.last_order_date}\n`;
          });
        }
        break;
        
      case 'inventory':
        if (data.stockLevels && data.stockLevels.length > 0) {
          csvContent = 'Category,Product Count,Total Stock,Average Stock,Stock Value\n';
          data.stockLevels.forEach(row => {
            csvContent += `${row.category},${row.product_count},${row.total_stock},${row.avg_stock},${row.stock_value}\n`;
          });
        }
        break;
        
      case 'performance':
        if (data.orderMetrics && data.orderMetrics.length > 0) {
          csvContent = 'Status,Count,Average Age (Days)\n';
          data.orderMetrics.forEach(row => {
            csvContent += `${row.status},${row.count},${row.avg_age_days}\n`;
          });
        }
        break;
        
      default:
        csvContent = 'No data available for CSV export\n';
    }
    
    return csvContent;
  } catch (error) {
    console.error('Error converting to CSV:', error);
    return 'Error generating CSV data\n';
  }
}

module.exports = router;
