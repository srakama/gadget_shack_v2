process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';

const request = require('supertest');
const { app } = require('../src/index');
const database = require('../src/config/database');
const { generateToken } = require('../src/middleware/auth');

let userToken;
let productId;

beforeAll(async () => {
  await database.initialize();
  // Create a user and product
  const user = await database.run(
    `INSERT INTO users (email, password, role) VALUES (?, ?, 'customer')`,
    ['user@example.com', 'hash']
  );
  userToken = generateToken(user.id, 'user@example.com', 'customer');

  const cat = await database.run("INSERT INTO categories (name) VALUES (?)", ['Temp']);
  const prod = await database.run(
    `INSERT INTO products (sku, name, price, category_id, stock_quantity, status)
     VALUES (?, ?, ?, ?, ?, 'active')`,
    ['SKU-ORD', 'Orderable', 500, cat.id, 3]
  );
  productId = prod.id;
});

afterAll(async () => {
  await database.close();
});

describe('Orders', () => {
  it('creates order and decrements stock', async () => {
    // Create
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ items: [{ product_id: productId, quantity: 2 }] });
    expect(res.status).toBe(201);
    expect(res.body.order && res.body.order.item_count).toBe(1);

    // Verify stock reduced
    const rows = await database.query('SELECT stock_quantity FROM products WHERE id = ?', [productId]);
    expect(rows[0].stock_quantity).toBe(1);
  });
});

