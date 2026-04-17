import request from 'supertest';
import app from '../src/app.js';

describe('App routes', () => {
  test('GET /health debe responder con estado ok', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        status: 'ok',
        timestamp: expect.any(String),
      })
    );
  });

  test('GET /api/una-ruta-no-existe debe devolver 404', async () => {
    const response = await request(app).get('/api/una-ruta-no-existe');

    expect(response.status).toBe(404);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: true,
        message: expect.stringContaining('Ruta no encontrada'),
      })
    );
  });
});
