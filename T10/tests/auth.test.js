import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/user.model.js';
import * as passwordUtils from '../src/utils/handlePassword.js';
import * as jwtUtils from '../src/utils/handleJwt.js';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

describe('Auth routes', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('POST /api/auth/register debe crear un usuario y devolver token', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    jest.spyOn(User.prototype, 'save').mockResolvedValue();

    const response = await request(app)
      .post('/api/auth/register')
      .send({ username: 'tester', email: 'tester@example.com', password: 'password123' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Usuario registrado exitosamente',
        token: expect.any(String),
        user: expect.objectContaining({
          username: 'tester',
          email: 'tester@example.com',
        }),
      })
    );
  });

  test('POST /api/auth/login debe iniciar sesión correctamente', async () => {
    const hashedPassword = await passwordUtils.hashPassword('password123');
    const fakeUser = {
      _id: '507f1f77bcf86cd799439011',
      username: 'tester',
      email: 'tester@example.com',
      password: hashedPassword,
      toJSON() {
        return {
          id: this._id,
          username: this.username,
          email: this.email,
        };
      },
    };

    jest.spyOn(User, 'findOne').mockResolvedValue(fakeUser);

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'tester@example.com', password: 'password123' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Inicio de sesión exitoso',
        token: expect.any(String),
        user: expect.objectContaining({
          username: 'tester',
          email: 'tester@example.com',
        }),
      })
    );
  });

  test('POST /api/auth/login con credenciales inválidas debe devolver 401', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'noexiste@example.com', password: 'badpassword' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Credenciales inválidas',
      })
    );
  });

  test('GET /api/auth/me debe devolver usuario autenticado con token válido', async () => {
    const fakeUser = {
      _id: '507f1f77bcf86cd799439011',
      username: 'tester',
      email: 'tester@example.com',
    };

    const token = jwtUtils.generateToken({ id: fakeUser._id });
    jest.spyOn(User, 'findById').mockResolvedValue(fakeUser);

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        user: expect.objectContaining({
          _id: fakeUser._id,
          username: fakeUser.username,
          email: fakeUser.email,
        }),
      })
    );
  });
});
