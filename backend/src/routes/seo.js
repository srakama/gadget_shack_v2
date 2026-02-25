const express = require('express');
const database = require('../config/database');
const seoService = require('../services/seoService');

const router = express.Router();

// Generate sitemap.xml
router.get('/sitemap.xml', async (req, res) => {
  try {
    const sitemap = await seoService.generateSitemap();
    
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.send(sitemap);

  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

// Generate robots.txt
router.get('/robots.txt', (req, res) => {
  try {
    const robotsTxt = seoService.generateRobotsTxt();
    
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.send(robotsTxt);

  } catch (error) {
    console.error('Error generating robots.txt:', error);
    res.status(500).send('Error generating robots.txt');
  }
});

// Get meta tags for product
router.get('/meta/product/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const products = await database.query(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ? AND p.status = 'active'
    `, [id]);

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = products[0];
    
    // Parse images
    if (product.images) {
      product.images = JSON.parse(product.images);
    }

    const meta = seoService.generateProductMeta(product);
    res.json(meta);

  } catch (error) {
    console.error('Error generating product meta:', error);
    res.status(500).json({ error: 'Failed to generate meta tags' });
  }
});

// Get meta tags for category
router.get('/meta/category/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [categories, products] = await Promise.all([
      database.query('SELECT * FROM categories WHERE id = ?', [id]),
      database.query(`
        SELECT p.*, c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.category_id = ? AND p.status = 'active'
        LIMIT 10
      `, [id])
    ]);

    if (categories.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const category = categories[0];
    
    // Parse product images
    products.forEach(product => {
      if (product.images) {
        product.images = JSON.parse(product.images);
      }
    });

    const meta = seoService.generateCategoryMeta(category, products);
    res.json(meta);

  } catch (error) {
    console.error('Error generating category meta:', error);
    res.status(500).json({ error: 'Failed to generate meta tags' });
  }
});

// Get meta tags for homepage
router.get('/meta/homepage', (req, res) => {
  try {
    const meta = seoService.generateHomepageMeta();
    res.json(meta);
  } catch (error) {
    console.error('Error generating homepage meta:', error);
    res.status(500).json({ error: 'Failed to generate meta tags' });
  }
});

// Get structured data for product
router.get('/structured-data/product/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const products = await database.query(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ? AND p.status = 'active'
    `, [id]);

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = products[0];
    
    // Parse images
    if (product.images) {
      product.images = JSON.parse(product.images);
    }

    const structuredData = seoService.generateProductStructuredData(product);
    res.json(structuredData);

  } catch (error) {
    console.error('Error generating product structured data:', error);
    res.status(500).json({ error: 'Failed to generate structured data' });
  }
});

// Get breadcrumb structured data
router.post('/structured-data/breadcrumb', (req, res) => {
  try {
    const { breadcrumbs } = req.body;

    if (!breadcrumbs || !Array.isArray(breadcrumbs)) {
      return res.status(400).json({ error: 'Breadcrumbs array is required' });
    }

    const structuredData = seoService.generateBreadcrumbStructuredData(breadcrumbs);
    res.json(structuredData);

  } catch (error) {
    console.error('Error generating breadcrumb structured data:', error);
    res.status(500).json({ error: 'Failed to generate structured data' });
  }
});

// Get FAQ structured data
router.post('/structured-data/faq', (req, res) => {
  try {
    const { faqs } = req.body;

    if (!faqs || !Array.isArray(faqs)) {
      return res.status(400).json({ error: 'FAQs array is required' });
    }

    const structuredData = seoService.generateFAQStructuredData(faqs);
    res.json(structuredData);

  } catch (error) {
    console.error('Error generating FAQ structured data:', error);
    res.status(500).json({ error: 'Failed to generate structured data' });
  }
});

// Generate organization structured data
router.get('/structured-data/organization', (req, res) => {
  try {
    const structuredData = seoService.generateOrganizationStructuredData();
    res.json(structuredData);
  } catch (error) {
    console.error('Error generating organization structured data:', error);
    res.status(500).json({ error: 'Failed to generate structured data' });
  }
});

// SEO audit endpoint
router.get('/audit/product/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const products = await database.query(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ? AND p.status = 'active'
    `, [id]);

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = products[0];
    const audit = {
      productId: product.id,
      issues: [],
      recommendations: [],
      score: 100
    };

    // Check title length
    if (!product.name || product.name.length < 10) {
      audit.issues.push('Product name is too short (less than 10 characters)');
      audit.score -= 10;
    } else if (product.name.length > 60) {
      audit.issues.push('Product name is too long (more than 60 characters)');
      audit.score -= 5;
    }

    // Check description
    if (!product.description || product.description.length < 50) {
      audit.issues.push('Product description is too short (less than 50 characters)');
      audit.score -= 15;
    } else if (product.description.length > 300) {
      audit.recommendations.push('Consider shortening product description for better readability');
    }

    // Check images
    const images = product.images ? JSON.parse(product.images) : [];
    if (images.length === 0) {
      audit.issues.push('Product has no images');
      audit.score -= 20;
    } else if (images.length < 3) {
      audit.recommendations.push('Add more product images for better user experience');
    }

    // Check SKU
    if (!product.sku) {
      audit.issues.push('Product is missing SKU');
      audit.score -= 5;
    }

    // Check category
    if (!product.category_name) {
      audit.issues.push('Product is not assigned to a category');
      audit.score -= 10;
    }

    // Check stock
    if (product.stock_quantity <= 0) {
      audit.issues.push('Product is out of stock');
      audit.score -= 5;
    }

    // Generate recommendations
    if (audit.score >= 90) {
      audit.recommendations.push('Excellent SEO optimization!');
    } else if (audit.score >= 70) {
      audit.recommendations.push('Good SEO optimization with room for improvement');
    } else {
      audit.recommendations.push('SEO optimization needs significant improvement');
    }

    res.json(audit);

  } catch (error) {
    console.error('Error performing SEO audit:', error);
    res.status(500).json({ error: 'Failed to perform SEO audit' });
  }
});

// Bulk SEO audit for multiple products
router.post('/audit/bulk', async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds)) {
      return res.status(400).json({ error: 'Product IDs array is required' });
    }

    const audits = [];
    
    for (const productId of productIds) {
      try {
        // Simplified audit for bulk processing
        const products = await database.query(`
          SELECT p.*, c.name as category_name
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.id = ? AND p.status = 'active'
        `, [productId]);

        if (products.length > 0) {
          const product = products[0];
          let score = 100;
          const issues = [];

          if (!product.name || product.name.length < 10) score -= 10;
          if (!product.description || product.description.length < 50) score -= 15;
          if (!product.images || JSON.parse(product.images).length === 0) score -= 20;
          if (!product.sku) score -= 5;
          if (!product.category_name) score -= 10;

          audits.push({
            productId: product.id,
            name: product.name,
            score,
            status: score >= 80 ? 'good' : score >= 60 ? 'fair' : 'poor'
          });
        }
      } catch (error) {
        audits.push({
          productId,
          error: 'Failed to audit product'
        });
      }
    }

    res.json({
      audits,
      summary: {
        total: audits.length,
        good: audits.filter(a => a.score >= 80).length,
        fair: audits.filter(a => a.score >= 60 && a.score < 80).length,
        poor: audits.filter(a => a.score < 60).length
      }
    });

  } catch (error) {
    console.error('Error performing bulk SEO audit:', error);
    res.status(500).json({ error: 'Failed to perform bulk SEO audit' });
  }
});

module.exports = router;
