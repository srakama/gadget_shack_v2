const express = require('express');
const database = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateInput, validationSets } = require('../middleware/security');
const emailService = require('../services/emailService');

const router = express.Router();

// Get user's orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const sql = `
      SELECT 
        o.*,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const orders = await database.query(sql, [userId, parseInt(limit), parseInt(offset)]);

    // Get total count
    const countResult = await database.query('SELECT COUNT(*) as total FROM orders WHERE user_id = ?', [userId]);
    const total = countResult[0].total;

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order with items
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get order
    const orderSql = 'SELECT * FROM orders WHERE id = ? AND user_id = ?';
    const orders = await database.query(orderSql, [id, userId]);

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[0];

    // Get order items with product details
    const itemsSql = `
      SELECT 
        oi.*,
        p.name as product_name,
        p.sku as product_sku,
        p.images as product_images
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `;

    const items = await database.query(itemsSql, [id]);

    // Parse product images
    const formattedItems = items.map(item => ({
      ...item,
      product_images: item.product_images ? JSON.parse(item.product_images) : []
    }));

    res.json({
      order: {
        ...order,
        items: formattedItems
      }
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Create new order
router.post('/', authenticateToken, validateInput(validationSets.createOrder), async (req, res) => {
  try {
    const userId = req.user.id;
    const { items, shipping_address, billing_address } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order items are required' });
    }

    // Calculate total amount and validate products
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const { product_id, quantity } = item;

      if (!product_id || !quantity || quantity <= 0) {
        return res.status(400).json({ error: 'Invalid item data' });
      }

      // Get product details
      const products = await database.query('SELECT * FROM products WHERE id = ? AND status = "active"', [product_id]);
      if (products.length === 0) {
        return res.status(400).json({ error: `Product with ID ${product_id} not found or inactive` });
      }

      const product = products[0];

      // Check stock
      if (product.stock_quantity < quantity) {
        return res.status(400).json({ error: `Insufficient stock for product ${product.name}` });
      }

      const itemTotal = product.price * quantity;
      totalAmount += itemTotal;

      validatedItems.push({
        product_id,
        quantity,
        price: product.price
      });
    }

    // Create order
    const orderSql = `
      INSERT INTO orders (user_id, status, total_amount, shipping_address, billing_address)
      VALUES (?, ?, ?, ?, ?)
    `;

    const orderResult = await database.run(orderSql, [
      userId,
      'pending',
      totalAmount,
      shipping_address,
      billing_address
    ]);

    const orderId = orderResult.id;

    // Create order items and update stock
    for (const item of validatedItems) {
      // Insert order item
      const itemSql = 'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)';
      await database.run(itemSql, [orderId, item.product_id, item.quantity, item.price]);

      // Update product stock
      const updateStockSql = 'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?';
      await database.run(updateStockSql, [item.quantity, item.product_id]);
    }

    // Get user email for order confirmation
    const userResult = await database.query('SELECT email FROM users WHERE id = ?', [userId]);
    const userEmail = userResult[0]?.email;

    // Send order confirmation email (don't wait for it to complete)
    if (userEmail) {
      const orderWithItems = {
        id: orderId,
        total_amount: totalAmount,
        status: 'pending',
        created_at: new Date().toISOString(),
        shipping_address: shipping_address,
        items: validatedItems.map((item, index) => ({
          ...item,
          product_name: `Product ${item.product_id}`, // TODO: Get actual product name
        }))
      };

      emailService.sendOrderConfirmation(userEmail, orderWithItems).catch(err => {
        console.error('Failed to send order confirmation email:', err);
      });
    }

    res.status(201).json({
      message: 'Order created successfully',
      order: {
        id: orderId,
        total_amount: totalAmount,
        status: 'pending',
        item_count: validatedItems.length
      }
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Update order status (admin only)
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const sql = 'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    const result = await database.run(sql, [status, id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order status updated successfully' });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Cancel order (customer can cancel their own pending orders)
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // First, check if the order exists and belongs to the user
    const orderCheck = await database.query(
      'SELECT id, status, user_id FROM orders WHERE id = ?',
      [id]
    );

    if (orderCheck.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderCheck[0];

    // Check if the order belongs to the user (unless admin)
    if (req.user.role !== 'admin' && order.user_id !== userId) {
      return res.status(403).json({ error: 'You can only cancel your own orders' });
    }

    // Check if the order can be cancelled
    if (order.status !== 'pending') {
      return res.status(400).json({
        error: `Cannot cancel order with status: ${order.status}. Only pending orders can be cancelled.`
      });
    }

    // Update order status to cancelled
    const result = await database.run(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['cancelled', id]
    );

    if (result.changes === 0) {
      return res.status(500).json({ error: 'Failed to cancel order' });
    }

    // TODO: In a real application, you might want to:
    // - Restore inventory for cancelled items
    // - Process refunds if payment was already captured
    // - Send cancellation email to customer

    res.json({
      message: 'Order cancelled successfully',
      order_id: id,
      status: 'cancelled'
    });

  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

module.exports = router;
