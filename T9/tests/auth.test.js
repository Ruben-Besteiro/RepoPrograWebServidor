import { jest } from '@jest/globals';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'testsecret';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

jest.unstable_mockModule('../src/config/prisma.js', () => ({
  prisma: mockPrisma,
  default: jest.fn(),
}));

const request = (await import('supertest')).default;
const app = (await import('../src/app.js')).default;
const bcrypt = (await import('bcryptjs')).default;

describe('Auth Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('debería registrar un nuevo usuario con éxito', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 1,
        name: 'Test',
        email: 'test@example.com',
        role: 'USER',
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'test@example.com', password: 'password123', role: 'USER' });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(mockPrisma.user.create).toHaveBeenCalled();
    });

    it('debería fallar si el email ya existe', async () => {
      mockPrisma.user.create.mockRejectedValue(new Error('Email already exists'));

      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'test@example.com', password: 'password123', role: 'USER' });

      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    it('debería iniciar sesión correctamente', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        name: 'Test',
        email: 'test@example.com',
        password: hashedPassword,
        role: 'USER',
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('debería fallar con credenciales inválidas', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'no_existe@example.com', password: 'badpassword' });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/auth/me', () => {
    it('debería retornar el usuario actual', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, name: 'Test' });
      const jwt = (await import('jsonwebtoken')).default;
      const validToken = jwt.sign({ user: 1 }, process.env.JWT_SECRET);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('Test');
    });

    it('debería regresar 500 en error interno simulado de login', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Fatal'));
      const res = await request(app).post('/api/auth/login').send({ email: 'test@m.com', password: 'password123' });
      expect(res.statusCode).toBe(500);
    });
  });
});
