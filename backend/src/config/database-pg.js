const { Pool } = require('pg');

class Database {
  constructor() {
    this.pool = null;
    this.db = null; // For compatibility with existing code
  }

  normalizeSql(sql, params = []) {
    const text = String(sql);

    // Convert SQLite `?` placeholders to pg `$1, $2, ...`
    // This is required because much of the codebase was written for sqlite3.
    let idx = 0;
    const converted = text.replace(/\?/g, () => {
      idx += 1;
      return `$${idx}`;
    });

    return { text: converted, params };
  }

  maybeAddReturningId(sql) {
    const s = String(sql);
    const trimmed = s.trim();
    const isInsert = /^insert\s+into\s+/i.test(trimmed);
    const hasReturning = /\breturning\b/i.test(trimmed);

    if (isInsert && !hasReturning) {
      return `${trimmed} RETURNING id`;
    }
    return s;
  }

  async initialize() {
    try {
      // Use DATABASE_URL from Render or construct from individual vars
      const connectionString = process.env.DATABASE_URL || this.buildConnectionString();
      
      this.pool = new Pool({
        connectionString,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      // Test connection
      const client = await this.pool.connect();
      console.log('✅ Connected to PostgreSQL database');
      client.release();

      // Create tables
      await this.createTables();
      // Ensure new columns exist on products table
      await this.ensureProductColumns();
      // Ensure new columns exist on users table
      await this.ensureUserColumns();

      // Set db to pool for compatibility
      this.db = this.pool;

      return this.pool;
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  buildConnectionString() {
    const host = process.env.PGHOST || 'localhost';
    const port = process.env.PGPORT || 5432;
    const database = process.env.PGDATABASE || 'gadgetshack';
    const user = process.env.PGUSER || 'postgres';
    const password = process.env.PGPASSWORD || 'postgres';
    
    return `postgresql://${user}:${password}@${host}:${port}/${database}`;
  }

  async ensureProductColumns() {
    const neededColumns = [
      { name: 'source_url', type: 'TEXT' },
      { name: 'grade', type: 'TEXT' },
      { name: 'shopify_id', type: 'TEXT' },
      { name: 'product_type', type: 'TEXT' },
      { name: 'tags', type: 'TEXT' },
      { name: 'vendor', type: 'TEXT' },
      { name: 'compare_at_price', type: 'DECIMAL(10,2)' },
      { name: 'discount_percent', type: 'INTEGER' },
      { name: 'featured', type: 'INTEGER DEFAULT 0' }
    ];

    for (const col of neededColumns) {
      try {
        await this.run(
          `ALTER TABLE products ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`
        );
      } catch (err) {
        // Column might already exist, ignore
        if (!err.message.includes('already exists')) {
          console.warn(`Warning adding column ${col.name}:`, err.message);
        }
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

    for (const col of neededColumns) {
      try {
        await this.run(
          `ALTER TABLE users ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`
        );
      } catch (err) {
        // Column might already exist, ignore
        if (!err.message.includes('already exists')) {
          console.warn(`Warning adding column ${col.name}:`, err.message);
        }
      }
    }
  }

  async createTables() {
    const tables = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password TEXT,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        city VARCHAR(100),
        province VARCHAR(100),
        postal_code VARCHAR(20),
        role VARCHAR(50) DEFAULT 'customer',
        profile_picture TEXT,
        oauth_provider VARCHAR(50),
        oauth_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Categories table
      `CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Products table
      `CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        sku VARCHAR(255) UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        category_id INTEGER REFERENCES categories(id),
        stock_quantity INTEGER DEFAULT 0,
        images TEXT,
        sizes TEXT,
        colors TEXT,
        status VARCHAR(50) DEFAULT 'active',
        scraped_at TIMESTAMP,
        source_url TEXT,
        grade VARCHAR(50),
        shopify_id VARCHAR(255),
        product_type VARCHAR(255),
        tags TEXT,
        vendor VARCHAR(255),
        compare_at_price DECIMAL(10,2),
        discount_percent INTEGER,
        featured INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Orders table
      `CREATE TABLE IF NOT EXISTS orders (
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
        shipping_status VARCHAR(50),
        shipping_location TEXT,
        estimated_delivery DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Order items table
      `CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id),
        product_id INTEGER NOT NULL REFERENCES products(id),
        quantity INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Stock movements table for inventory tracking
      `CREATE TABLE IF NOT EXISTS stock_movements (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id),
        old_quantity INTEGER NOT NULL,
        new_quantity INTEGER NOT NULL,
        change_amount INTEGER NOT NULL,
        reason TEXT,
        admin_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Shipping events table for tracking
      `CREATE TABLE IF NOT EXISTS shipping_events (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id),
        tracking_number VARCHAR(255) NOT NULL,
        status VARCHAR(100) NOT NULL,
        location TEXT,
        timestamp TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Sessions table for authentication
      `CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(255) PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const sql of tables) {
      try {
        await this.run(sql);
      } catch (err) {
        console.error('Error creating table:', err.message);
        throw err;
      }
    }

    console.log('✅ Database tables created successfully');
  }

  async query(sql, params = []) {
    const client = await this.pool.connect();
    try {
      const normalized = this.normalizeSql(sql, params);
      const result = await client.query(normalized.text, normalized.params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async run(sql, params = []) {
    const client = await this.pool.connect();
    try {
      const sqlWithReturning = this.maybeAddReturningId(sql);
      const normalized = this.normalizeSql(sqlWithReturning, params);
      const result = await client.query(normalized.text, normalized.params);
      return {
        id: result.rows[0]?.id || null,
        changes: result.rowCount
      };
    } finally {
      client.release();
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log('Database connection closed');
    }
  }
}

module.exports = new Database();
