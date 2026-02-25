const express = require('express');
const database = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateInput } = require('../middleware/security');
const { body } = require('express-validator');
const paymentService = require('../services/paymentService');

const router = express.Router();

// Get available payment methods
router.get('/methods', (req, res) => {
  try {
    const methods = paymentService.getAvailablePaymentMethods();
    res.json({ methods });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
});

// Create payment intent
router.post('/create-intent', authenticateToken, validateInput([
  body('orderId').isInt({ min: 1 }).withMessage('Valid order ID is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount is required'),
  body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters')
]), async (req, res) => {
  try {
    const { orderId, amount, currency = 'ZAR' } = req.body;
    const userId = req.user.id;

    // Verify order belongs to user and is pending payment
    const orders = await database.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ? AND status = ?',
      [orderId, userId, 'pending']
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found or already processed' });
    }

    const order = orders[0];

    // Verify amount matches order total
    if (Math.abs(order.total_amount - amount) > 0.01) {
      return res.status(400).json({ error: 'Amount mismatch' });
    }

    // Create payment intent
    const result = await paymentService.createPaymentIntent(amount, currency, {
      orderId: orderId.toString(),
      userId: userId.toString()
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    // Store payment intent ID in database
    await database.run(
      'UPDATE orders SET payment_intent_id = ? WHERE id = ?',
      [result.paymentIntentId, orderId]
    );

    res.json({
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Confirm payment
router.post('/confirm', authenticateToken, validateInput([
  body('paymentIntentId').notEmpty().withMessage('Payment intent ID is required')
]), async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const userId = req.user.id;

    // Find order by payment intent ID
    const orders = await database.query(
      'SELECT * FROM orders WHERE payment_intent_id = ? AND user_id = ?',
      [paymentIntentId, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[0];

    // Confirm payment with payment provider
    const result = await paymentService.confirmPayment(paymentIntentId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    // Update order status based on payment result
    const newStatus = result.success ? 'processing' : 'payment_failed';
    await database.run(
      'UPDATE orders SET status = ?, payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newStatus, result.status, order.id]
    );

    res.json({
      success: result.success,
      status: result.status,
      orderId: order.id
    });

  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// PayFast payment creation
router.post('/payfast/create', authenticateToken, validateInput([
  body('orderId').isInt({ min: 1 }).withMessage('Valid order ID is required')
]), async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.id;

    // Get order and user details
    const orderQuery = `
      SELECT o.*, u.email, u.first_name, u.last_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ? AND o.user_id = ? AND o.status = 'pending'
    `;
    
    const orders = await database.query(orderQuery, [orderId, userId]);

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found or already processed' });
    }

    const order = orders[0];

    // Get order items count
    const itemsResult = await database.query(
      'SELECT COUNT(*) as count FROM order_items WHERE order_id = ?',
      [orderId]
    );

    const orderData = {
      orderId: order.id,
      amount: order.total_amount,
      itemCount: itemsResult[0].count,
      customer: {
        email: order.email,
        first_name: order.first_name,
        last_name: order.last_name
      }
    };

    const result = paymentService.createPayFastPayment(orderData);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      paymentUrl: result.paymentUrl,
      paymentData: result.paymentData
    });

  } catch (error) {
    console.error('Error creating PayFast payment:', error);
    res.status(500).json({ error: 'Failed to create PayFast payment' });
  }
});

// PayFast webhook/notification handler
router.post('/payfast/notify', async (req, res) => {
  try {
    const validation = paymentService.validatePayFastPayment(req.body);

    if (!validation.valid) {
      console.error('Invalid PayFast notification:', validation.error);
      return res.status(400).send('Invalid signature');
    }

    const { orderId, status, amount } = validation;

    // Update order status
    let orderStatus = 'payment_failed';
    if (status === 'COMPLETE') {
      orderStatus = 'processing';
    }

    await database.run(
      'UPDATE orders SET status = ?, payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [orderStatus, status, orderId]
    );

    console.log(`PayFast payment notification: Order ${orderId}, Status: ${status}, Amount: ${amount}`);

    res.status(200).send('OK');

  } catch (error) {
    console.error('Error processing PayFast notification:', error);
    res.status(500).send('Error processing notification');
  }
});

// Mock payment for development
router.post('/mock', authenticateToken, validateInput([
  body('orderId').isInt({ min: 1 }).withMessage('Valid order ID is required')
]), async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Mock payments not available in production' });
    }

    const { orderId } = req.body;
    const userId = req.user.id;

    // Verify order
    const orders = await database.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ? AND status = ?',
      [orderId, userId, 'pending']
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found or already processed' });
    }

    const order = orders[0];

    // Process mock payment
    const result = await paymentService.mockPayment(order.total_amount, orderId);

    // Update order status
    const newStatus = result.success ? 'processing' : 'payment_failed';
    await database.run(
      'UPDATE orders SET status = ?, payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newStatus, result.status, orderId]
    );

    res.json({
      success: result.success,
      message: result.message,
      transactionId: result.transactionId,
      orderId
    });

  } catch (error) {
    console.error('Error processing mock payment:', error);
    res.status(500).json({ error: 'Failed to process mock payment' });
  }
});

module.exports = router;
