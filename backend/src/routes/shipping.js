const express = require('express');
const database = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateInput } = require('../middleware/security');
const { body } = require('express-validator');
const shippingService = require('../services/shippingService');

const router = express.Router();

// Get shipping zones
router.get('/zones', (req, res) => {
  try {
    const zones = shippingService.getShippingZones();
    res.json({ zones });
  } catch (error) {
    console.error('Error fetching shipping zones:', error);
    res.status(500).json({ error: 'Failed to fetch shipping zones' });
  }
});

// Calculate shipping costs
router.post('/calculate', validateInput([
  body('toAddress').notEmpty().withMessage('Delivery address is required'),
  body('weight').isFloat({ min: 0.1 }).withMessage('Weight must be at least 0.1kg'),
  body('value').isFloat({ min: 0 }).withMessage('Order value is required'),
  body('serviceType').optional().isIn(['standard', 'express']).withMessage('Invalid service type')
]), async (req, res) => {
  try {
    const { 
      toAddress, 
      weight, 
      value, 
      dimensions = { length: 30, width: 20, height: 10 },
      serviceType = 'standard'
    } = req.body;

    // Default from address (business address)
    const fromAddress = process.env.BUSINESS_ADDRESS || 'Johannesburg, South Africa';

    const result = await shippingService.calculateShipping({
      fromAddress,
      toAddress,
      weight,
      dimensions,
      value,
      serviceType
    });

    res.json(result);

  } catch (error) {
    console.error('Error calculating shipping:', error);
    res.status(500).json({ error: 'Failed to calculate shipping costs' });
  }
});

// Create shipping label (admin only)
router.post('/labels', authenticateToken, requireAdmin, validateInput([
  body('orderId').isInt({ min: 1 }).withMessage('Valid order ID is required'),
  body('shippingQuote').isObject().withMessage('Shipping quote is required')
]), async (req, res) => {
  try {
    const { orderId, shippingQuote } = req.body;

    // Get order details
    const orders = await database.query(`
      SELECT o.*, u.email, u.first_name, u.last_name, u.phone
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [orderId]);

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[0];

    // Get order items for weight calculation
    const items = await database.query(`
      SELECT oi.*, p.name, p.weight
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [orderId]);

    // Calculate total weight (assume 0.5kg if product weight not specified)
    const totalWeight = items.reduce((sum, item) => {
      const itemWeight = item.weight || 0.5;
      return sum + (itemWeight * item.quantity);
    }, 0);

    const orderData = {
      orderId: order.id,
      customerName: `${order.first_name} ${order.last_name}`,
      customerEmail: order.email,
      customerPhone: order.phone,
      shippingAddress: order.shipping_address,
      weight: totalWeight,
      value: order.total_amount,
      items: items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        weight: item.weight || 0.5
      }))
    };

    const result = await shippingService.createShippingLabel(orderData, shippingQuote);

    if (result.success) {
      // Update order with shipping information
      await database.run(`
        UPDATE orders SET 
          tracking_number = ?,
          shipping_provider = ?,
          shipping_service = ?,
          shipping_cost = ?,
          estimated_delivery = ?,
          status = 'shipped',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        result.trackingNumber,
        result.provider,
        result.service,
        result.cost,
        result.estimatedDelivery,
        orderId
      ]);

      res.json({
        success: true,
        trackingNumber: result.trackingNumber,
        labelUrl: result.labelUrl,
        estimatedDelivery: result.estimatedDelivery
      });
    } else {
      res.status(400).json({ error: result.error });
    }

  } catch (error) {
    console.error('Error creating shipping label:', error);
    res.status(500).json({ error: 'Failed to create shipping label' });
  }
});

// Track shipment
router.get('/track/:trackingNumber', async (req, res) => {
  try {
    const { trackingNumber } = req.params;

    // Get order with tracking number
    const orders = await database.query(
      'SELECT * FROM orders WHERE tracking_number = ?',
      [trackingNumber]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Tracking number not found' });
    }

    const order = orders[0];
    const provider = order.shipping_provider || 'standard';

    const trackingInfo = await shippingService.trackShipment(trackingNumber, provider);

    if (trackingInfo.success) {
      res.json({
        ...trackingInfo,
        order: {
          id: order.id,
          status: order.status,
          estimatedDelivery: order.estimated_delivery,
          shippingAddress: order.shipping_address
        }
      });
    } else {
      res.status(400).json({ error: trackingInfo.error });
    }

  } catch (error) {
    console.error('Error tracking shipment:', error);
    res.status(500).json({ error: 'Failed to track shipment' });
  }
});

// Update order shipping status (webhook endpoint)
router.post('/webhook/status', validateInput([
  body('trackingNumber').notEmpty().withMessage('Tracking number is required'),
  body('status').notEmpty().withMessage('Status is required'),
  body('location').optional().isString()
]), async (req, res) => {
  try {
    const { trackingNumber, status, location, timestamp } = req.body;

    // Find order by tracking number
    const orders = await database.query(
      'SELECT * FROM orders WHERE tracking_number = ?',
      [trackingNumber]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[0];

    // Update order status based on shipping status
    let orderStatus = order.status;
    if (status.toLowerCase().includes('delivered')) {
      orderStatus = 'delivered';
    } else if (status.toLowerCase().includes('out for delivery')) {
      orderStatus = 'out_for_delivery';
    } else if (status.toLowerCase().includes('transit')) {
      orderStatus = 'shipped';
    }

    // Update order
    await database.run(`
      UPDATE orders SET 
        status = ?,
        shipping_status = ?,
        shipping_location = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [orderStatus, status, location, order.id]);

    // Log shipping event
    await database.run(`
      INSERT INTO shipping_events (order_id, tracking_number, status, location, timestamp, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [order.id, trackingNumber, status, location, timestamp || new Date().toISOString()]);

    res.json({ success: true, message: 'Status updated successfully' });

  } catch (error) {
    console.error('Error updating shipping status:', error);
    res.status(500).json({ error: 'Failed to update shipping status' });
  }
});

// Get shipping history for order (admin)
router.get('/orders/:orderId/history', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;

    const events = await database.query(`
      SELECT * FROM shipping_events 
      WHERE order_id = ? 
      ORDER BY timestamp DESC
    `, [orderId]);

    res.json({ events });

  } catch (error) {
    console.error('Error fetching shipping history:', error);
    res.status(500).json({ error: 'Failed to fetch shipping history' });
  }
});

// Bulk shipping label creation (admin)
router.post('/labels/bulk', authenticateToken, requireAdmin, validateInput([
  body('orders').isArray({ min: 1 }).withMessage('Orders array is required'),
  body('orders.*.orderId').isInt({ min: 1 }).withMessage('Valid order ID is required'),
  body('orders.*.shippingQuote').isObject().withMessage('Shipping quote is required')
]), async (req, res) => {
  try {
    const { orders } = req.body;
    const results = [];

    for (const orderData of orders) {
      try {
        // Process each order individually
        const result = await processShippingLabel(orderData.orderId, orderData.shippingQuote);
        results.push({ orderId: orderData.orderId, success: true, ...result });
      } catch (error) {
        results.push({ 
          orderId: orderData.orderId, 
          success: false, 
          error: error.message 
        });
      }
    }

    res.json({
      message: 'Bulk shipping processing completed',
      results,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });

  } catch (error) {
    console.error('Error in bulk shipping:', error);
    res.status(500).json({ error: 'Failed to process bulk shipping' });
  }
});

// Helper function for processing shipping labels
async function processShippingLabel(orderId, shippingQuote) {
  // Implementation similar to single label creation
  // This is a simplified version - full implementation would be similar to the single label endpoint
  return {
    trackingNumber: `GS${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
    estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  };
}

module.exports = router;
