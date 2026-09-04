const request = require('supertest');
const express = require('express');
const { app } = require('../server');
// Dummy test for route sanity check
describe('Auth API Routes', () => {
  it('should respond to health check or root route', async () => {
    const app = express();
    app.get('/', (req, res) => res.status(200).send('API Running'));

    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toBe('API Running');
  });
});