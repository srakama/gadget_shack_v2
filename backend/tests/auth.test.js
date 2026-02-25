process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';

const request = require('supertest');
const { app } = require('../src/index');
const database = require('../src/config/database');

beforeAll(async () => {
  await database.initialize();
});

afterAll(async () => {
  await database.close();
});

describe('Auth flow', () => {
  const email = `test${Date.now()}@example.com`;
  const password = 'P@ssw0rd123';

  it('registers a user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password, first_name: 'T', phone: '123' });
    expect(res.status).toBe(201);
    expect(res.body && res.body.token).toBeTruthy();
  });

  it('logs in the user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password });
    expect(res.status).toBe(200);
    expect(res.body && res.body.token).toBeTruthy();
  });
});

