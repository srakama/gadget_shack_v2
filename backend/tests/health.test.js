process.env.NODE_ENV = 'test';

const request = require('supertest');
const { app } = require('../src/index');

describe('Health endpoints', () => {
  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body && res.body.status).toBe('ok');
  });

  it('GET /api returns API info', async () => {
    const res = await request(app).get('/api');
    expect(res.status).toBe(200);
    expect(res.body && res.body.name).toBe('GadgetShack API');
  });
});

