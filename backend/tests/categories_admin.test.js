process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';

const request = require('supertest');
const { app } = require('../src/index');
const database = require('../src/config/database');
const { generateToken } = require('../src/middleware/auth');

let adminToken;

beforeAll(async () => {
  await database.initialize();
  // Create admin user directly in DB
  const user = await database.run(
    `INSERT INTO users (email, password, role) VALUES (?, ?, 'admin')`,
    ['admin@example.com', 'hash',]
  );
  adminToken = generateToken(user.id, 'admin@example.com', 'admin');
});

afterAll(async () => {
  await database.close();
});

describe('Admin categories', () => {
  it('can create, update, and delete a category', async () => {
    // Create
    let res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Accessories', description: 'All accessories' });
    expect(res.status).toBe(201);
    const id = res.body.category.id;

    // Update
    res = await request(app)
      .put(`/api/categories/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ description: 'Updated' });
    expect(res.status).toBe(200);

    // Delete
    res = await request(app)
      .delete(`/api/categories/${id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});

