// Migration script from SQLite to PostgreSQL for production
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

class DatabaseMigration {
  constructor() {
    // SQLite connection (source)
    this.sqliteDb = new sqlite3.Database('./backend/data/gadgetshack.db');
    
    // PostgreSQL connection (destination)
    this.pgPool = new Pool({
      host: process.env.POSTGRES_HOST || 'localhost',
      port: process.env.POSTGRES_PORT || 5432,
      database: process.env.POSTGRES_DB || 'gadgetshack',
      user: process.env.POSTGRES_USER || 'gadgetshack_user',
      password: process.env.POSTGRES_PASSWORD,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  async migrate() {
    try {
      console.log('🚀 Starting database migration from SQLite to PostgreSQL...');
      
      // Create PostgreSQL schema
      await this.createPostgreSQLSchema();
      
      // Migrate data
      await this.migrateUsers();
      await this.migrateCategories();
      await this.migrateProducts();
      await this.migrateOrders();
      await this.migrateOrderItems();
      await this.migrateStockMovements();
      await this.migrateShippingEvents();
      
      // Update sequences
      await this.updateSequences();
      
      console.log('✅ Database migration completed successfully!');
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    } finally {
      this.sqliteDb.close();
      await this.pgPool.end();
    }
  }

  async createPostgreSQLSchema() {
    console.log('📋 Creating PostgreSQL schema...');
    
    const schema = `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(20),
        address TEXT,
        city VARCHAR(100),
        province VARCHAR(100),
        postal_code VARCHAR(20),
        role VARCHAR(20) DEFAULT 'customer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Categories table
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Products table
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        category_id INTEGER REFERENCES categories(id),
        sku VARCHAR(100) UNIQUE,
        stock_quantity INTEGER DEFAULT 0,
        images TEXT,
        sizes VARCHAR(255),
        colors VARCHAR(255),
        weight DECIMAL(8,2),
        dimensions VARCHAR(100),
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Orders table
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'pending',
        payment_status VARCHAR(50) DEFAULT 'pending',
        payment_intent_id VARCHAR(255),
        total_amount DECIMAL(10,2) NOT NULL,
        shipping_address TEXT,
        billing_address TEXT,
        tracking_number VARCHAR(255),
        shipping_provider VARCHAR(100),
        shipping_service VARCHAR(100),
        shipping_cost DECIMAL(10,2),
        shipping_status VARCHAR(100),
        shipping_location VARCHAR(255),
        estimated_delivery DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Order items table
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id),
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Stock movements table
      CREATE TABLE IF NOT EXISTS stock_movements (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id),
        old_quantity INTEGER NOT NULL,
        new_quantity INTEGER NOT NULL,
        change_amount INTEGER NOT NULL,
        reason TEXT,
        admin_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Shipping events table
      CREATE TABLE IF NOT EXISTS shipping_events (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id),
        tracking_number VARCHAR(255) NOT NULL,
        status VARCHAR(100) NOT NULL,
        location VARCHAR(255),
        timestamp TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
      CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
      CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
      CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
      CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
      CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
      CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
      CREATE INDEX IF NOT EXISTS idx_shipping_events_order ON shipping_events(order_id);
      CREATE INDEX IF NOT EXISTS idx_shipping_events_tracking ON shipping_events(tracking_number);
    `;

    await this.pgPool.query(schema);
    console.log('✅ PostgreSQL schema created');
  }

  async migrateTable(tableName, transformFn = null) {
    return new Promise((resolve, reject) => {
      console.log(`📦 Migrating ${tableName}...`);
      
      this.sqliteDb.all(`SELECT * FROM ${tableName}`, async (err, rows) => {
        if (err) {
          console.error(`Error reading ${tableName}:`, err);
          reject(err);
          return;
        }

        if (rows.length === 0) {
          console.log(`⚠️  No data found in ${tableName}`);
          resolve();
          return;
        }

        try {
          for (const row of rows) {
            const transformedRow = transformFn ? transformFn(row) : row;
            await this.insertRow(tableName, transformedRow);
          }
          console.log(`✅ Migrated ${rows.length} records from ${tableName}`);
          resolve();
        } catch (error) {
          console.error(`Error migrating ${tableName}:`, error);
          reject(error);
        }
      });
    });
  }

  async insertRow(tableName, row) {
    const columns = Object.keys(row).filter(key => row[key] !== undefined);
    const values = columns.map(key => row[key]);
    const placeholders = columns.map((_, index) => `$${index + 1}`);

    const query = `
      INSERT INTO ${tableName} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      ON CONFLICT DO NOTHING
    `;

    await this.pgPool.query(query, values);
  }

  async migrateUsers() {
    await this.migrateTable('users');
  }

  async migrateCategories() {
    await this.migrateTable('categories');
  }

  async migrateProducts() {
    await this.migrateTable('products', (row) => {
      // Convert SQLite REAL to PostgreSQL DECIMAL
      if (row.price) row.price = parseFloat(row.price);
      if (row.weight) row.weight = parseFloat(row.weight);
      return row;
    });
  }

  async migrateOrders() {
    await this.migrateTable('orders', (row) => {
      if (row.total_amount) row.total_amount = parseFloat(row.total_amount);
      if (row.shipping_cost) row.shipping_cost = parseFloat(row.shipping_cost);
      return row;
    });
  }

  async migrateOrderItems() {
    await this.migrateTable('order_items', (row) => {
      if (row.price) row.price = parseFloat(row.price);
      return row;
    });
  }

  async migrateStockMovements() {
    await this.migrateTable('stock_movements');
  }

  async migrateShippingEvents() {
    await this.migrateTable('shipping_events');
  }

  async updateSequences() {
    console.log('🔄 Updating PostgreSQL sequences...');
    
    const tables = ['users', 'categories', 'products', 'orders', 'order_items', 'stock_movements', 'shipping_events'];
    
    for (const table of tables) {
      try {
        const result = await this.pgPool.query(`SELECT MAX(id) as max_id FROM ${table}`);
        const maxId = result.rows[0].max_id || 0;
        
        if (maxId > 0) {
          await this.pgPool.query(`SELECT setval('${table}_id_seq', ${maxId})`);
          console.log(`✅ Updated ${table}_id_seq to ${maxId}`);
        }
      } catch (error) {
        console.error(`Error updating sequence for ${table}:`, error);
      }
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  const migration = new DatabaseMigration();
  migration.migrate()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = DatabaseMigration;
