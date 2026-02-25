process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';

const request = require('supertest');
const { app } = require('../src/index');
const database = require('../src/config/database');
const { generateToken } = require('../src/middleware/auth');

let adminToken;
let productId;

beforeAll(async () => {
  await database.initialize();
  const admin = await database.run(
    `INSERT INTO users (email, password, role) VALUES (?, ?, 'admin')`,
    ['admin@example.com', 'hash']
  );
  adminToken = generateToken(admin.id, 'admin@example.com', 'admin');

  const cat = await database.run("INSERT INTO categories (name) VALUES (?)", ['AdminCat']);
  const prod = await database.run(
    `INSERT INTO products (sku, name, price, category_id, stock_quantity, status)
     VALUES (?, ?, ?, ?, ?, 'inactive')`,
    ['SKU-ADM', 'AdminProd', 100, cat.id, 2]
  );
  productId = prod.id;
});

afterAll(async () => {
  await database.close();
});

describe('Admin products', () => {
  it('lists products with filters', async () => {
    const res = await request(app)
      .get('/api/admin/products?status=inactive&limit=10&page=1')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.products.find(p => p.id === productId)).toBeTruthy();
  });

  it('reactivates and deactivates a product', async () => {
    // Reactivate
    let res = await request(app)
      .post(`/api/admin/products/${productId}/reactivate`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);

    // Deactivate
    res = await request(app)
      .post(`/api/admin/products/${productId}/deactivate`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});

