process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';

const request = require('supertest');
const { app } = require('../src/index');
const database = require('../src/config/database');

beforeAll(async () => {
  await database.initialize();
  // Seed a category and a product
  const cat = await database.run("INSERT INTO categories (name, description) VALUES (?, ?)", ['Phones', 'Smartphones']);
  await database.run(
    `INSERT INTO products (sku, name, description, price, category_id, stock_quantity, images, sizes, colors, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['SKU-1', 'Test Phone', 'A phone', 1000, cat.id, 5, JSON.stringify(['https://via.placeholder.com/300']), '', '', 'active']
  );
});

afterAll(async () => {
  await database.close();
});

describe('Products API', () => {
  it('lists products with pagination', async () => {
    const res = await request(app).get('/api/products?limit=10&page=1');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.pagination).toBeTruthy();
  });

  it('gets product by id', async () => {
    const list = await request(app).get('/api/products?limit=1&page=1');
    const first = Array.isArray(list.body.products) && list.body.products.length > 0 ? list.body.products[0] : null;
    const id = first && first.id;
    const res = await request(app).get(`/api/products/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.product && res.body.product.id).toBe(id);
  });

  it('gets product by sku', async () => {
    const res = await request(app).get('/api/products/sku/SKU-1');
    expect(res.status).toBe(200);
    expect(res.body.product && res.body.product.sku).toBe('SKU-1');
  });
});

