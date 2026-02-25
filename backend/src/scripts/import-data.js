#!/usr/bin/env node

require('dotenv').config();
const fs = require('fs-extra');
const path = require('path');
const database = require('../config/database');

class DataImporter {
  constructor(options = {}) {
    // Try multiple possible data file locations
    this.possibleDataFiles = [
      path.join(__dirname, '../../../scraper/data/techmarkit-products.json'), // New Shopify scraper data
      path.join(__dirname, '../../../techmarkit_products.json'), // Old scraper data
      path.join(__dirname, '../../../scraper/techmarkit_products.json') // Alternative location
    ];
    this.dataFile = null;
    this.categoryMap = new Map();
    this.fullRefresh = options.fullRefresh || false;
  }

  async initialize() {
    console.log('🚀 Initializing data importer...');
    await database.initialize();
  }

  async importData() {
    try {
      console.log('📂 Reading scraped data...');

      // Find the first existing data file
      for (const filePath of this.possibleDataFiles) {
        if (await fs.pathExists(filePath)) {
          this.dataFile = filePath;
          console.log(`📁 Using data file: ${filePath}`);
          break;
        }
      }

      if (!this.dataFile) {
        console.error('❌ No data file found in any of these locations:');
        this.possibleDataFiles.forEach(file => console.log(`   - ${file}`));
        console.log('💡 Please run the scraper first: npm run scrape');
        return;
      }

      const data = await fs.readJson(this.dataFile);

      // Handle different data formats
      let products = [];
      let totalProducts = 0;

      if (Array.isArray(data)) {
        // New format: array of products
        products = data;
        totalProducts = data.length;
      } else if (data.products && Array.isArray(data.products)) {
        // Old format: object with products array
        products = data.products;
        totalProducts = data.total_products || data.products.length;
      } else {
        console.error('❌ Invalid data format in file:', this.dataFile);
        return;
      }

      console.log(`📊 Found ${totalProducts} products to import`);

      // Import categories first
      await this.importCategories(products);

      // Import products
      const processedSkus = await this.importProducts(products);

      // On full refresh, mark missing products as inactive
      if (this.fullRefresh) {
        await this.deactivateMissingProducts(processedSkus);
        // Record last full refresh time
        try {
          const stampPath = path.join(__dirname, '../../data/last_full_refresh.json');
          await fs.ensureFile(stampPath);
          await fs.writeJson(stampPath, { last_full_refresh_at: new Date().toISOString() }, { spaces: 2 });
          console.log('🕒 Recorded last full refresh timestamp');
        } catch (e) {
          console.warn('⚠️ Failed to write last full refresh timestamp:', e.message);
        }
      }

      console.log('✅ Data import completed successfully!');

    } catch (error) {
      console.error('❌ Import failed:', error);
      throw error;
    }
  }

  async importCategories(products) {
    console.log('📁 Importing categories...');

    const categories = new Set();
    products.forEach(product => {
      if (product.category) {
        categories.add(product.category);
      }
    });

    let imported = 0;
    for (const categoryName of categories) {
      try {
        // Check if category exists
        const existing = await database.query('SELECT id FROM categories WHERE name = ?', [categoryName]);

        if (existing.length === 0) {
          const result = await database.run(
            'INSERT INTO categories (name, description) VALUES (?, ?)',
            [categoryName, `Products in the ${categoryName} category`]
          );
          this.categoryMap.set(categoryName, result.id);
          imported++;
          console.log(`  ✓ Created category: ${categoryName}`);
        } else {
          this.categoryMap.set(categoryName, existing[0].id);
          console.log(`  → Category exists: ${categoryName}`);
        }
      } catch (error) {
        console.error(`  ❌ Failed to create category ${categoryName}:`, error.message);
      }
    }

    console.log(`📁 Categories imported: ${imported} new, ${categories.size - imported} existing`);
  }

  async importProducts(products) {
    console.log('📦 Importing products...');

    let imported = 0;
    let updated = 0;
    let skipped = 0;

    const processedSkus = new Set();

    for (const product of products) {
      try {
        const categoryId = this.categoryMap.get(product.category) || null;

        // Check if product exists by SKU
        const existing = await database.query('SELECT id FROM products WHERE sku = ?', [product.sku]);

        if (existing.length === 0) {
          // Create new product
          await database.run(`
            INSERT INTO products (
              sku, name, description, price, category_id,
              stock_quantity, images, sizes, colors, status, scraped_at,
              source_url, grade, shopify_id, product_type, tags,
              vendor, compare_at_price, discount_percent
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            product.sku,
            product.name,
            product.description,
            product.price,
            categoryId,
            product.stock_quantity != null ? product.stock_quantity : 100,
            JSON.stringify(product.images || []),
            product.sizes || '',
            product.colors || '',
            'active',
            product.scraped_at,
            product.source_url || null,
            product.grade || null,
            product.shopify_id || null,
            product.product_type || null,
            Array.isArray(product.tags) ? product.tags.join(',') : (product.tags || null),
            product.vendor || null,
            product.compare_at_price != null ? product.compare_at_price : null,
            product.discount_percent != null ? product.discount_percent : null
          ]);

          imported++;
          processedSkus.add(product.sku);
          console.log(`  ✓ Imported: ${product.sku} - ${product.name}`);

        } else {
          // Update existing product
          await database.run(`
            UPDATE products SET
              name = ?, description = ?, price = ?, category_id = ?,
              images = ?, sizes = ?, colors = ?, scraped_at = ?,
              source_url = ?, grade = ?, shopify_id = ?, product_type = ?, tags = ?,
              vendor = ?, compare_at_price = ?, discount_percent = ?,
              stock_quantity = COALESCE(?, stock_quantity),
              updated_at = CURRENT_TIMESTAMP
            WHERE sku = ?
          `, [
            product.name,
            product.description,
            product.price,
            categoryId,
            JSON.stringify(product.images || []),
            product.sizes || '',
            product.colors || '',
            product.scraped_at,
            product.source_url || null,
            product.grade || null,
            product.shopify_id || null,
            product.product_type || null,
            Array.isArray(product.tags) ? product.tags.join(',') : (product.tags || null),
            product.vendor || null,
            product.compare_at_price != null ? product.compare_at_price : null,
            product.discount_percent != null ? product.discount_percent : null,
            product.stock_quantity != null ? product.stock_quantity : null,
            product.sku
          ]);

          updated++;
          processedSkus.add(product.sku);
          console.log(`  ↻ Updated: ${product.sku} - ${product.name}`);
        }

      } catch (error) {
        console.error(`  ❌ Failed to import ${product.sku}:`, error.message);
        skipped++;
      }
    }

    console.log(`📦 Products processed: ${imported} new, ${updated} updated, ${skipped} skipped`);
    return processedSkus;
  }
  async deactivateMissingProducts(processedSkus) {
    console.log('🗑️  Marking missing products as inactive (full refresh)...');
    try {
      // Get all active product SKUs
      const rows = await database.query("SELECT sku FROM products WHERE status = 'active'");
      const toDeactivate = rows
        .map(r => r.sku)
        .filter(sku => !processedSkus.has(sku));

      if (toDeactivate.length === 0) {
        console.log('  ✓ No products to deactivate');
        return;
      }

      // Batch deactivate
      const placeholders = toDeactivate.map(() => '?').join(',');
      const sql = `UPDATE products SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE sku IN (${placeholders})`;
      await database.run(sql, toDeactivate);
      console.log(`  ↻ Deactivated ${toDeactivate.length} products not present in latest scrape`);
    } catch (e) {
      console.error('  ❌ Failed to deactivate missing products:', e.message);
    }
  }


  async createDefaultAdmin() {
    console.log('👤 Creating default admin user...');

    const bcrypt = require('bcryptjs');
    const adminEmail = 'admin@gadgetshack.com';
    const adminPassword = 'admin123';

    try {
      // Check if admin exists
      const existing = await database.query('SELECT id FROM users WHERE email = ?', [adminEmail]);

      if (existing.length === 0) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        await database.run(`
          INSERT INTO users (email, password, first_name, last_name, role)
          VALUES (?, ?, ?, ?, ?)
        `, [adminEmail, hashedPassword, 'Admin', 'User', 'admin']);

        console.log('✅ Default admin user created:');
        console.log(`   Email: ${adminEmail}`);
        console.log(`   Password: ${adminPassword}`);
        console.log('   ⚠️  Please change the password after first login!');
      } else {
        console.log('👤 Admin user already exists');
      }
    } catch (error) {
      console.error('❌ Failed to create admin user:', error.message);
    }
  }

  async close() {
    await database.close();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const fullRefresh = args.includes('--full');
  const importer = new DataImporter({ fullRefresh });

  try {
    await importer.initialize();
    await importer.importData();
    await importer.createDefaultAdmin();

    console.log('\n🎉 Import process completed!');
    console.log('📝 Summary:');
    console.log('   - Categories and products imported from scraped data');
    console.log('   - Default admin user created (if not exists)');
    console.log('   - Backend ready to serve API requests');
    console.log('\n🚀 Next steps:');
    console.log('   1. Start the backend: npm run dev');
    console.log('   2. Access API at: http://localhost:9000/api');
    console.log('   3. Admin panel: http://localhost:9000/api/admin/panel');

  } catch (error) {
    console.error('💥 Import process failed:', error);
    process.exit(1);
  } finally {
    await importer.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = DataImporter;
