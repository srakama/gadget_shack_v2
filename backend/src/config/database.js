const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs-extra');

class Database {
  constructor() {
    this.db = null;
    // Allow override via DB_PATH for tests or custom setups
    this.dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/gadgetshack.db');
  }

  async initialize() {
    try {
      // Ensure data directory exists
      await fs.ensureDir(path.dirname(this.dbPath));

      // Create database connection
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err.message);
          throw err;
        }
        console.log('✅ Connected to SQLite database');
      });

      // Help prevent SQLITE_BUSY during concurrent reads/writes (e.g. refresh import while API is serving)
      // Note: sqlite3 supports a connection-level busy timeout via configure.
      try {
        this.db.configure('busyTimeout', parseInt(process.env.SQLITE_BUSY_TIMEOUT_MS || '10000', 10));
      } catch {}

      // Enable foreign keys
      this.db.run('PRAGMA foreign_keys = ON');

      // Improve concurrent read/write behavior
      this.db.run('PRAGMA journal_mode = WAL');
      this.db.run('PRAGMA synchronous = NORMAL');
      this.db.run(`PRAGMA busy_timeout = ${parseInt(process.env.SQLITE_BUSY_TIMEOUT_MS || '10000', 10)}`);

      // Create tables
      await this.createTables();
      // Ensure new columns exist on products table
      await this.ensureProductColumns();
      // Ensure new columns exist on users table
      await this.ensureUserColumns();

      return this.db;
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  async ensureProductColumns() {
    const neededColumns = [
      { name: 'source_url', type: 'TEXT' },
      { name: 'grade', type: 'TEXT' },
      { name: 'shopify_id', type: 'TEXT' },
      { name: 'product_type', type: 'TEXT' },
      { name: 'tags', type: 'TEXT' },
      { name: 'vendor', type: 'TEXT' },
      { name: 'compare_at_price', type: 'REAL' },
      { name: 'discount_percent', type: 'INTEGER' },
      { name: 'featured', type: 'INTEGER DEFAULT 0' }
    ];

    const existingCols = await this.query("PRAGMA table_info('products')");
    const existingNames = new Set(existingCols.map(c => c.name));

    for (const col of neededColumns) {
      if (!existingNames.has(col.name)) {
        await this.run(`ALTER TABLE products ADD COLUMN ${col.name} ${col.type}`);
        console.log(`✅ Added missing column to products: ${col.name}`);
      }
    }
  }

  async ensureUserColumns() {
    const neededColumns = [
      { name: 'phone', type: 'TEXT' },
      { name: 'address', type: 'TEXT' },
      { name: 'city', type: 'TEXT' },
      { name: 'province', type: 'TEXT' },
      { name: 'postal_code', type: 'TEXT' },
      { name: 'profile_picture', type: 'TEXT' },
      { name: 'oauth_provider', type: 'TEXT' },
      { name: 'oauth_id', type: 'TEXT' }
    ];

    const existingCols = await this.query("PRAGMA table_info('users')");
    const existingNames = new Set(existingCols.map(c => c.name));

    for (const col of neededColumns) {
      if (!existingNames.has(col.name)) {
        await this.run(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
        console.log(`✅ Added missing column to users: ${col.name}`);
      }
    }
  }

  createTables() {
    return new Promise((resolve, reject) => {
      const tables = [
        // Users table
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT,
          first_name TEXT,
          last_name TEXT,
          phone TEXT,
          address TEXT,
          city TEXT,
          province TEXT,
          postal_code TEXT,
          role TEXT DEFAULT 'customer',
          profile_picture TEXT,
          oauth_provider TEXT,
          oauth_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Categories table
        `CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Products table
        `CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sku TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          price DECIMAL(10,2) NOT NULL,
          category_id INTEGER,
          stock_quantity INTEGER DEFAULT 0,
          images TEXT, -- JSON array of image URLs
          sizes TEXT,  -- Comma-separated sizes
          colors TEXT, -- Comma-separated colors
          status TEXT DEFAULT 'active',
          scraped_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories (id)
        )`,
        
        // Orders table
        `CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          status TEXT DEFAULT 'pending',
          payment_status TEXT DEFAULT 'pending',
          payment_intent_id TEXT,
          total_amount DECIMAL(10,2) NOT NULL,
          shipping_address TEXT,
          billing_address TEXT,
          tracking_number TEXT,
          shipping_provider TEXT,
          shipping_service TEXT,
          shipping_cost DECIMAL(10,2),
          shipping_status TEXT,
          shipping_location TEXT,
          estimated_delivery DATE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )`,
        
        // Order items table
        `CREATE TABLE IF NOT EXISTS order_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          quantity INTEGER NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (order_id) REFERENCES orders (id),
          FOREIGN KEY (product_id) REFERENCES products (id)
        )`,

        // Stock movements table for inventory tracking
        `CREATE TABLE IF NOT EXISTS stock_movements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id INTEGER NOT NULL,
          old_quantity INTEGER NOT NULL,
          new_quantity INTEGER NOT NULL,
          change_amount INTEGER NOT NULL,
          reason TEXT,
          admin_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products (id),
          FOREIGN KEY (admin_id) REFERENCES users (id)
        )`,

        // Shipping events table for tracking
        `CREATE TABLE IF NOT EXISTS shipping_events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER NOT NULL,
          tracking_number TEXT NOT NULL,
          status TEXT NOT NULL,
          location TEXT,
          timestamp DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (order_id) REFERENCES orders (id)
        )`,
        
        // Sessions table for authentication
        `CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )`
      ];

      let completed = 0;
      const total = tables.length;

      tables.forEach((sql, index) => {
        this.db.run(sql, (err) => {
          if (err) {
            console.error(`Error creating table ${index}:`, err.message);
            reject(err);
            return;
          }
          
          completed++;
          if (completed === total) {
            console.log('✅ Database tables created successfully');
            resolve();
          }
        });
      });
    });
  }

  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing database:', err.message);
          } else {
            console.log('Database connection closed');
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = new Database();
