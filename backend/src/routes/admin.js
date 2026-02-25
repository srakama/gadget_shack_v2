const express = require('express');
const database = require('../config/database');
const { authenticateToken, basicAuth, requireAdmin } = require('../middleware/auth');
const { validateInput } = require('../middleware/security');
const { body } = require('express-validator');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Admin dashboard stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get various statistics
    const stats = {};

    // Product stats
    const productStats = await database.query(`
      SELECT
        COUNT(*) as total_products,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_products,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_products,
        SUM(stock_quantity) as total_stock
      FROM products
    `);
    stats.products = productStats[0];

    // Order stats
    const orderStats = await database.query(`
      SELECT
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_orders,
        COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped_orders,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
        SUM(total_amount) as total_revenue
      FROM orders
    `);
    stats.orders = orderStats[0];

    // User stats
    const userStats = await database.query(`
      SELECT
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
        COUNT(CASE WHEN role = 'customer' THEN 1 END) as customer_users
      FROM users
    `);
    stats.users = userStats[0];

    // Category stats
    const categoryStats = await database.query('SELECT COUNT(*) as total_categories FROM categories');
    stats.categories = categoryStats[0];

    // Recent orders
    const recentOrders = await database.query(`
      SELECT
        o.id,
        o.status,
        o.total_amount,
        o.created_at,
        u.email as customer_email,
        COUNT(oi.id) as item_count
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `);
    stats.recent_orders = recentOrders;

    // Low stock products
    const lowStockProducts = await database.query(`
      SELECT id, sku, name, stock_quantity
      FROM products
      WHERE stock_quantity < 10 AND status = 'active'
      ORDER BY stock_quantity ASC
      LIMIT 10
    `);
    stats.low_stock_products = lowStockProducts;

    res.json({ stats });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// Get all orders (admin only)
router.get('/orders', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [];

    if (status) {
      whereClause = 'WHERE o.status = ?';
      params.push(status);
    }

    const sql = `
      SELECT
        o.*,
        u.email as customer_email,
        u.first_name,
        u.last_name,
        COUNT(oi.id) as item_count
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ${whereClause}
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit), parseInt(offset));
    const orders = await database.query(sql, params);

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM orders o ${whereClause}`;
    const countParams = status ? [status] : [];
    const countResult = await database.query(countSql, countParams);
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
    console.error('Error fetching admin orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order by ID (admin only)
router.get('/orders/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;

    const sql = `
      SELECT
        o.*,
        u.email as customer_email,
        u.first_name,
        u.last_name,
        u.phone as customer_phone
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `;

    const orders = await database.query(sql, [id]);

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[0];

    // Get order items
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

// Update order (admin only)
router.put('/orders/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const {
      status,
      payment_status,
      tracking_number,
      shipping_provider,
      shipping_service,
      shipping_cost,
      shipping_status,
      shipping_location,
      estimated_delivery,
      shipping_address,
      billing_address
    } = req.body;

    // Check if order exists
    const existing = await database.query('SELECT id FROM orders WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const sql = `
      UPDATE orders SET
        status = COALESCE(?, status),
        payment_status = COALESCE(?, payment_status),
        tracking_number = COALESCE(?, tracking_number),
        shipping_provider = COALESCE(?, shipping_provider),
        shipping_service = COALESCE(?, shipping_service),
        shipping_cost = COALESCE(?, shipping_cost),
        shipping_status = COALESCE(?, shipping_status),
        shipping_location = COALESCE(?, shipping_location),
        estimated_delivery = COALESCE(?, estimated_delivery),
        shipping_address = COALESCE(?, shipping_address),
        billing_address = COALESCE(?, billing_address),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await database.run(sql, [
      status,
      payment_status,
      tracking_number,
      shipping_provider,
      shipping_service,
      shipping_cost,
      shipping_status,
      shipping_location,
      estimated_delivery,
      shipping_address,
      billing_address,
      id
    ]);

    res.json({ message: 'Order updated successfully' });

  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Delete order (admin only) - Use with caution
router.delete('/orders/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;

    // Delete order items first (foreign key constraint)
    await database.run('DELETE FROM order_items WHERE order_id = ?', [id]);

    // Delete the order
    const result = await database.run('DELETE FROM orders WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order deleted successfully' });

  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// Get all users (admin only)
router.get('/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { page = 1, limit = 20, role } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [];

    if (role) {
      whereClause = 'WHERE role = ?';
      params.push(role);
    }

    const sql = `
      SELECT
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        u.phone,
        u.address,
        u.city,
        u.province,
        u.postal_code,
        u.created_at,
        COUNT(o.id) as order_count,
        COALESCE(SUM(o.total_amount), 0) as total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      ${whereClause}
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit), parseInt(offset));
    const users = await database.query(sql, params);

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const countParams = role ? [role] : [];
    const countResult = await database.query(countSql, countParams);
    const total = countResult[0].total;

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get single user by ID (admin only)
router.get('/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;

    const sql = `
      SELECT
        u.*,
        COUNT(o.id) as order_count,
        COALESCE(SUM(o.total_amount), 0) as total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.id = ?
      GROUP BY u.id
    `;

    const users = await database.query(sql, [id]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Don't send password hash
    const user = users[0];
    delete user.password;

    res.json({ user });

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create new user (admin only)
router.post('/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const {
      email,
      password,
      first_name,
      last_name,
      phone,
      address,
      city,
      province,
      postal_code,
      role = 'customer'
    } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user already exists
    const existing = await database.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password if provided
    let hashedPassword = null;
    if (password) {
      const bcrypt = require('bcryptjs');
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const sql = `
      INSERT INTO users (
        email, password, first_name, last_name, phone,
        address, city, province, postal_code, role
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await database.run(sql, [
      email,
      hashedPassword,
      first_name || null,
      last_name || null,
      phone || null,
      address || null,
      city || null,
      province || null,
      postal_code || null,
      role
    ]);

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: result.id,
        email,
        first_name,
        last_name,
        role
      }
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user (admin only)
router.put('/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const {
      email,
      password,
      first_name,
      last_name,
      phone,
      address,
      city,
      province,
      postal_code,
      role
    } = req.body;

    // Check if user exists
    const existing = await database.query('SELECT id FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If email is being changed, check it's not already taken
    if (email) {
      const emailCheck = await database.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
      if (emailCheck.length > 0) {
        return res.status(400).json({ error: 'Email already in use by another user' });
      }
    }

    // Hash password if provided
    let hashedPassword = null;
    if (password) {
      const bcrypt = require('bcryptjs');
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const sql = `
      UPDATE users SET
        email = COALESCE(?, email),
        password = COALESCE(?, password),
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        phone = COALESCE(?, phone),
        address = COALESCE(?, address),
        city = COALESCE(?, city),
        province = COALESCE(?, province),
        postal_code = COALESCE(?, postal_code),
        role = COALESCE(?, role),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await database.run(sql, [
      email,
      hashedPassword,
      first_name,
      last_name,
      phone,
      address,
      city,
      province,
      postal_code,
      role,
      id
    ]);

    res.json({ message: 'User updated successfully' });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (admin only)
router.delete('/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;

    // Prevent deleting yourself
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Check if user has orders
    const orders = await database.query('SELECT COUNT(*) as count FROM orders WHERE user_id = ?', [id]);
    if (orders[0].count > 0) {
      return res.status(400).json({
        error: 'Cannot delete user with existing orders. Consider deactivating instead.',
        order_count: orders[0].count
      });
    }

    const result = await database.run('DELETE FROM users WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Basic auth protected admin panel info
router.get('/panel', basicAuth, (req, res) => {
  res.json({
    message: 'Welcome to GadgetShack Admin Panel',
    user: req.user.username,
    endpoints: {
      stats: '/api/admin/stats',
      orders: '/api/admin/orders',
      users: '/api/admin/users',
      products: '/api/products',
      categories: '/api/categories'
    },
    note: 'Use JWT authentication for API endpoints'
  });
});

// Trigger daily refresh (admin only)
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const rootDir = path.join(__dirname, '../../..');
    const scriptPath = path.join(rootDir, 'scripts', 'daily-refresh.sh');

    const forceFull = ((req.query && req.query.full === 'true') || (req.body && req.body.full === true)) ? '1' : '0';
    const env = { ...process.env, FORCE_FULL: forceFull };

    const child = exec(`bash "${scriptPath}"`, {
      cwd: rootDir,
      env
    });

    child.stdout.on('data', (data) => console.log('[refresh]', data.toString().trim()));
    child.stderr.on('data', (data) => console.error('[refresh:err]', data.toString().trim()));

    res.json({ status: 'started', message: `Daily refresh started in background${forceFull === '1' ? ' (full)' : ''}` });
  } catch (error) {
    console.error('Error starting refresh:', error);
    res.status(500).json({ error: 'Failed to start refresh' });
  }
});

// Get last refresh status (admin only)
router.get('/refresh/status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const rootDir = path.join(__dirname, '../../..');
    const logDir = path.join(rootDir, 'logs');
    if (!fs.existsSync(logDir)) {
      return res.json({ status: 'unknown', message: 'No logs found' });
    }

    const files = fs.readdirSync(logDir)
      .filter(f => f.startsWith('daily-refresh-') && f.endsWith('.log'))
      .sort((a, b) => b.localeCompare(a));

    if (files.length === 0) {
      return res.json({ status: 'unknown', message: 'No logs found' });
    }

    const latest = files[0];
    const fullPath = path.join(logDir, latest);
    const content = fs.readFileSync(fullPath, 'utf8');

    // Simple parse for summary and times
    const completed = content.includes('Daily refresh completed');
    const totalMatch = content.match(/Total Products:\s*(\d+)/);
    const total = totalMatch ? parseInt(totalMatch[1], 10) : undefined;

    const startMatch = content.match(/Daily Refresh Started:\s*(.*)/);
    const completeMatch = content.match(/Daily refresh completed at\s*(.*)/);
    const started_at = startMatch ? startMatch[1].trim() : undefined;
    const completed_at = completeMatch ? completeMatch[1].trim() : undefined;

    // Last full refresh timestamp (if available)
    let lastFull = null;
    try {
      const stampPath = path.join(__dirname, '../../data/last_full_refresh.json');
      if (fs.existsSync(stampPath)) {
        const j = JSON.parse(fs.readFileSync(stampPath, 'utf8'));
        lastFull = j.last_full_refresh_at || null;
      }
    } catch {}

    res.json({
      status: completed ? 'completed' : 'running_or_failed',
      log_file: latest,
      total_products: total,
      started_at,
      completed_at,
      last_full_refresh_at: lastFull
    });
  } catch (error) {
    console.error('Error reading refresh status:', error);
    res.status(500).json({ error: 'Failed to read refresh status' });
  }
});

// Get last refresh log tail (admin only)
router.get('/refresh/log-tail', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const rootDir = path.join(__dirname, '../../..');
    const logDir = path.join(rootDir, 'logs');
    if (!fs.existsSync(logDir)) {
      return res.json({ lines: [] });
    }

    const files = fs.readdirSync(logDir)
      .filter(f => f.startsWith('daily-refresh-') && f.endsWith('.log'))
      .sort((a, b) => b.localeCompare(a));

    if (files.length === 0) {
      return res.json({ lines: [] });
    }

    const latest = files[0];
    const fullPath = path.join(logDir, latest);
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.trim().split('\n');
    const tail = lines.slice(-50);

    res.json({ lines: tail, log_file: latest });
  } catch (error) {
    console.error('Error reading refresh log tail:', error);
    res.status(500).json({ error: 'Failed to read log tail' });
  }
});
// List products by status (admin only)
router.get('/products', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const { page = 1, limit = 20, status = 'inactive', q, category_id } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const like = q ? `%${q}%` : null;
    const whereParts = ['p.status = ?'];
    const whereParams = [status];
    if (like) { whereParts.push('(p.name LIKE ? OR p.sku LIKE ?)'); whereParams.push(like, like); }
    if (category_id) { whereParts.push('p.category_id = ?'); whereParams.push(parseInt(category_id)); }
    const where = whereParts.join(' AND ');

    const items = await database.query(
      `SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE ${where} ORDER BY p.updated_at DESC LIMIT ? OFFSET ?`,
      [...whereParams, parseInt(limit), parseInt(offset)]
    );

    const count = await database.query(
      `SELECT COUNT(*) as total FROM products p WHERE ${where}`,
      whereParams
    );

    res.json({
      products: items.map(p => ({
        ...p,
        images: p.images ? JSON.parse(p.images) : []
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count[0].total,
        pages: Math.ceil(count[0].total / limit)
      }
    });
  } catch (e) {
    console.error('Error listing products by status:', e);
    res.status(500).json({ error: 'Failed to list products' });
  }
});

// Reactivate product (admin only)
router.post('/products/:id/reactivate', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const { id } = req.params;
    await database.run(`UPDATE products SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [id]);
    res.json({ status: 'ok' });
  } catch (e) {
    console.error('Error reactivating product:', e);
    res.status(500).json({ error: 'Failed to reactivate product' });
  }
});
// Bulk reactivate products (admin only)
router.post('/products/reactivate', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const ids = Array.isArray(req.body && req.body.ids) ? req.body.ids.filter((v) => Number.isInteger(v)) : [];
    if (ids.length === 0) {
      return res.status(400).json({ error: 'No valid product IDs provided' });
    }
    const placeholders = ids.map(() => '?').join(',');
    const sql = `UPDATE products SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`;
    await database.run(sql, ids);
    res.json({ status: 'ok', reactivated: ids.length });
  } catch (e) {
    console.error('Error bulk reactivating products:', e);
    res.status(500).json({ error: 'Failed to bulk reactivate products' });
  }
});

// Deactivate product (admin only)
router.post('/products/:id/deactivate', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const id = parseInt(req.params.id);
    await database.run(`UPDATE products SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [id]);
    res.json({ status: 'ok' });
  } catch (e) {
    console.error('Error deactivating product:', e);
    res.status(500).json({ error: 'Failed to deactivate product' });
  }
});

// Bulk deactivate products (admin only)
router.post('/products/deactivate', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const ids = Array.isArray(req.body && req.body.ids) ? req.body.ids.filter((v) => Number.isInteger(v)) : [];
    if (ids.length === 0) {
      return res.status(400).json({ error: 'No valid product IDs provided' });
    }
    const placeholders = ids.map(() => '?').join(',');
    const sql = `UPDATE products SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`;
    await database.run(sql, ids);
    res.json({ status: 'ok', deactivated: ids.length });
  } catch (e) {
    console.error('Error bulk deactivating products:', e);
    res.status(500).json({ error: 'Failed to bulk deactivate products' });
  }
});

// FEATURE TOGGLE ENDPOINTS
// Feature a product
router.post('/products/:id/feature', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const id = parseInt(req.params.id);
    await database.run(`UPDATE products SET featured = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [id]);
    res.json({ status: 'ok' });
  } catch (e) {
    console.error('Error featuring product:', e);
    res.status(500).json({ error: 'Failed to feature product' });
  }
});

// Unfeature a product
router.post('/products/:id/unfeature', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const id = parseInt(req.params.id);
    await database.run(`UPDATE products SET featured = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [id]);
    res.json({ status: 'ok' });
  } catch (e) {
    console.error('Error unfeaturing product:', e);
    res.status(500).json({ error: 'Failed to unfeature product' });
  }
});

// Bulk feature products
router.post('/products/feature', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const ids = Array.isArray(req.body && req.body.ids) ? req.body.ids.filter((v) => Number.isInteger(v)) : [];
    if (ids.length === 0) {
      return res.status(400).json({ error: 'No valid product IDs provided' });
    }
    const placeholders = ids.map(() => '?').join(',');
    const sql = `UPDATE products SET featured = 1, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`;
    await database.run(sql, ids);
    res.json({ status: 'ok', featured: ids.length });
  } catch (e) {
    console.error('Error bulk featuring products:', e);
    res.status(500).json({ error: 'Failed to bulk feature products' });
  }
});

// Bulk unfeature products
router.post('/products/unfeature', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const ids = Array.isArray(req.body && req.body.ids) ? req.body.ids.filter((v) => Number.isInteger(v)) : [];
    if (ids.length === 0) {
      return res.status(400).json({ error: 'No valid product IDs provided' });
    }
    const placeholders = ids.map(() => '?').join(',');
    const sql = `UPDATE products SET featured = 0, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`;
    await database.run(sql, ids);
    res.json({ status: 'ok', unfeatured: ids.length });
  } catch (e) {
    console.error('Error bulk unfeaturing products:', e);
    res.status(500).json({ error: 'Failed to bulk unfeature products' });
  }
});

// Enhanced Dashboard Analytics
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const daysAgo = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Get key metrics
    const [
      totalOrders,
      totalRevenue,
      totalCustomers,
      totalProducts,
      recentOrders,
      topProducts,
      salesByDay,
      ordersByStatus
    ] = await Promise.all([
      // Total orders in period
      database.query(
        'SELECT COUNT(*) as count FROM orders WHERE created_at >= ?',
        [startDate.toISOString()]
      ),

      // Total revenue in period
      database.query(
        'SELECT SUM(total_amount) as revenue FROM orders WHERE status != "cancelled" AND created_at >= ?',
        [startDate.toISOString()]
      ),

      // Total customers
      database.query(
        'SELECT COUNT(*) as count FROM users WHERE role = "customer"'
      ),

      // Total products
      database.query(
        'SELECT COUNT(*) as count FROM products WHERE status = "active"'
      ),

      // Recent orders
      database.query(`
        SELECT o.*, u.email, u.first_name, u.last_name
        FROM orders o
        JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
        LIMIT 10
      `),

      // Top selling products
      database.query(`
        SELECT p.name, p.sku, SUM(oi.quantity) as total_sold, SUM(oi.quantity * oi.price) as revenue
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status != 'cancelled' AND o.created_at >= ?
        GROUP BY p.id
        ORDER BY total_sold DESC
        LIMIT 10
      `, [startDate.toISOString()]),

      // Sales by day
      database.query(`
        SELECT DATE(created_at) as date, COUNT(*) as orders, SUM(total_amount) as revenue
        FROM orders
        WHERE status != 'cancelled' AND created_at >= ?
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `, [startDate.toISOString()]),

      // Orders by status
      database.query(`
        SELECT status, COUNT(*) as count
        FROM orders
        WHERE created_at >= ?
        GROUP BY status
      `, [startDate.toISOString()])
    ]);

    res.json({
      metrics: {
        totalOrders: totalOrders[0]?.count || 0,
        totalRevenue: totalRevenue[0]?.revenue || 0,
        totalCustomers: totalCustomers[0]?.count || 0,
        totalProducts: totalProducts[0]?.count || 0
      },
      recentOrders,
      topProducts,
      salesByDay,
      ordersByStatus,
      period: daysAgo
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

module.exports = router;
