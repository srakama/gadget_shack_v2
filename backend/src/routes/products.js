const express = require('express');
const database = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Price markup configuration
function getMarkupPercent() {
  const val = parseFloat(process.env.MARKUP_PERCENT || '20');
  return isNaN(val) ? 20 : val;
}
function applyMarkup(basePrice) {
  const pct = getMarkupPercent();
  const final = basePrice * (1 + pct / 100);
  return Math.round(final * 100) / 100;
}

// Get all products with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      search,
      minPrice,
      maxPrice,
      status = 'active'
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = ['p.status = ?'];
    let params = [status];

    // Add filters
    if (category) {
      whereConditions.push('p.category_id = ?');
      params.push(category);
    }

    if (search) {
      whereConditions.push('(p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (minPrice) {
      whereConditions.push('p.price >= ?');
      params.push(minPrice);
    }

    if (maxPrice) {
      whereConditions.push('p.price <= ?');
      params.push(maxPrice);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get products with category information
    const sql = `
      SELECT 
        p.*,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit), parseInt(offset));
    const products = await database.query(sql, params);

    // Parse JSON fields and apply public markup
    const formattedProducts = products.map(product => {
      const obj = {
        ...product,
        images: product.images ? JSON.parse(product.images) : [],
        sizes: product.sizes ? product.sizes.split(',').map(s => s.trim()) : [],
        colors: product.colors ? product.colors.split(',').map(c => c.trim()) : []
      };
      obj.price = applyMarkup(obj.price);
      return obj;
    });

    // Get total count for pagination
    const countSql = `
      SELECT COUNT(*) as total
      FROM products p
      ${whereClause}
    `;
    const countParams = params.slice(0, -2); // Remove limit and offset
    const countResult = await database.query(countSql, countParams);
    const total = countResult[0].total;

    res.json({
      products: formattedProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT 
        p.*,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `;

    const products = await database.query(sql, [id]);

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = products[0];
    
    // Parse JSON fields and apply public markup
    const formattedProduct = {
      ...product,
      images: product.images ? JSON.parse(product.images) : [],
      sizes: product.sizes ? product.sizes.split(',').map(s => s.trim()) : [],
      colors: product.colors ? product.colors.split(',').map(c => c.trim()) : []
    };
    formattedProduct.price = applyMarkup(formattedProduct.price);

    res.json({ product: formattedProduct });

  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Get product by SKU
router.get('/sku/:sku', async (req, res) => {
  try {
    const { sku } = req.params;

    const sql = `
      SELECT 
        p.*,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.sku = ?
    `;

    const products = await database.query(sql, [sku]);

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = products[0];
    
    // Parse JSON fields and apply public markup
    const formattedProduct = {
      ...product,
      images: product.images ? JSON.parse(product.images) : [],
      sizes: product.sizes ? product.sizes.split(',').map(s => s.trim()) : [],
      colors: product.colors ? product.colors.split(',').map(c => c.trim()) : []
    };
    formattedProduct.price = applyMarkup(formattedProduct.price);

    res.json({ product: formattedProduct });

  } catch (error) {
    console.error('Error fetching product by SKU:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create new product (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const {
      sku,
      name,
      description,
      price,
      category_id,
      stock_quantity = 0,
      images = [],
      sizes = '',
      colors = '',
      status = 'active'
    } = req.body;

    if (!sku || !name || !price) {
      return res.status(400).json({ error: 'SKU, name, and price are required' });
    }

    const sql = `
      INSERT INTO products (
        sku, name, description, price, category_id,
        stock_quantity, images, sizes, colors, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await database.run(sql, [
      sku,
      name,
      description,
      price,
      category_id,
      stock_quantity,
      JSON.stringify(images),
      sizes,
      colors,
      status
    ]);

    res.status(201).json({
      message: 'Product created successfully',
      product: { id: result.id, sku, name, price }
    });

  } catch (error) {
    console.error('Error creating product:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'Product with this SKU already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create product' });
    }
  }
});

// Update product (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const {
      sku,
      name,
      description,
      price,
      category_id,
      stock_quantity,
      images,
      sizes,
      colors,
      status
    } = req.body;

    const sql = `
      UPDATE products SET
        sku = COALESCE(?, sku),
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        price = COALESCE(?, price),
        category_id = COALESCE(?, category_id),
        stock_quantity = COALESCE(?, stock_quantity),
        images = COALESCE(?, images),
        sizes = COALESCE(?, sizes),
        colors = COALESCE(?, colors),
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const result = await database.run(sql, [
      sku,
      name,
      description,
      price,
      category_id,
      stock_quantity,
      images ? JSON.stringify(images) : null,
      sizes,
      colors,
      status,
      id
    ]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product updated successfully' });

  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;

    const result = await database.run('DELETE FROM products WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });

  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
