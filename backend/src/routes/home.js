const express = require('express');
const database = require('../config/database');

const router = express.Router();

// In-memory cache for homepage (simple TTL cache)
let cache = { data: null, expires: 0 };
const TTL_MS = 60 * 1000; // 60 seconds

function getMarkupPercent() {
  const val = parseFloat(process.env.MARKUP_PERCENT || '20');
  return isNaN(val) ? 20 : val;
}
function applyMarkup(basePrice) {
  const pct = getMarkupPercent();
  const final = basePrice * (1 + pct / 100);
  return Math.round(final * 100) / 100;
}

router.get('/homepage', async (req, res) => {
  try {
    const now = Date.now();
    if (cache.data && cache.expires > now) {
      return res.json({ ...cache.data, cached: true });
    }

    // Get featured products first, then fill with latest if < 8
    const limit = parseInt(req.query.limit || '8');

    const featuredSql = `
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'active' AND COALESCE(p.featured, 0) = 1
      ORDER BY RANDOM()
      LIMIT ?
    `;
    const featured = await database.query(featuredSql, [limit]);

    let products = featured;
    if (featured.length < limit) {
      const remaining = limit - featured.length;
      const fillerSql = `
        SELECT p.*, c.name AS category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.status = 'active' AND COALESCE(p.featured, 0) = 0
        ORDER BY p.created_at DESC
        LIMIT ?
      `;
      const filler = await database.query(fillerSql, [remaining]);
      products = [...featured, ...filler];
    }

    // Parse JSON + apply markup
    const formatted = products.map((product) => {
      const obj = {
        ...product,
        images: product.images ? JSON.parse(product.images) : [],
        sizes: product.sizes ? product.sizes.split(',').map((s) => s.trim()) : [],
        colors: product.colors ? product.colors.split(',').map((c) => c.trim()) : [],
      };
      obj.price = applyMarkup(obj.price);
      return obj;
    });

    const payload = { products: formatted, pagination: { limit } };
    cache = { data: payload, expires: now + TTL_MS };

    res.json(payload);
  } catch (e) {
    console.error('Error building homepage:', e);
    res.status(500).json({ error: 'Failed to load homepage' });
  }
});

module.exports = router;

