import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'testsecret';

const mockPrisma = {
  review: {
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn()
  },
  loan: {
    findFirst: jest.fn(),
  },
  book: {
    update: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  }
};

jest.unstable_mockModule('../src/config/prisma.js', () => ({
  prisma: mockPrisma,
  default: jest.fn(),
}));

const request = (await import('supertest')).default;
const app = (await import('../src/app.js')).default;

// JWT Token
const userToken = jwt.sign({ user: 1 }, process.env.JWT_SECRET);

describe('Reviews Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.user.findUnique.mockImplementation(({ where }) => {
      if (where.id === 1) return Promise.resolve({ id: 1, role: 'USER' });
      return Promise.resolve(null);
    });
  });

  describe('GET /api/books/:id/reviews', () => {
    it('debería retornar evaluaciones del libro', async () => {
      mockPrisma.review.findMany.mockResolvedValue([
        { id: 1, comment: 'Muy bueno', rating: 5 }
      ]);
      mockPrisma.review.count.mockResolvedValue(1);

      const res = await request(app).get('/api/books/1/reviews');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
    });

    it('debería devolver 500 si falla al obtener', async () => {
      mockPrisma.review.count.mockRejectedValue(new Error('Crash'));
      const res = await request(app).get('/api/books/1/reviews');
      expect(res.statusCode).toBe(500);
    });
  });

  describe('POST /api/books/:id/reviews', () => {
    it('debería fallar si el usuario no tiene permisos/préstamo de ese libro', async () => {
      mockPrisma.loan.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/books/1/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ rating: 5, comment: 'Excelente!' });

      expect(res.statusCode).toBe(403);
    });

    it('debería crear una reseña si el préstamo aplica', async () => {
      mockPrisma.loan.findFirst.mockResolvedValue({ id: 1, status: 'RETURNED' });
      mockPrisma.review.create.mockResolvedValue({ id: 1, rating: 5 });
      mockPrisma.review.findMany.mockResolvedValue([{ rating: 5 }]);
      mockPrisma.book.update.mockResolvedValue({});

      const res = await request(app)
        .post('/api/books/1/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ rating: 5, comment: 'Excelente!' });

      expect(res.statusCode).toBe(201);
      expect(mockPrisma.review.create).toHaveBeenCalled();
    });

    it('debería regresar 500 si la base explota', async () => {
      mockPrisma.loan.findFirst.mockRejectedValue(new Error('Fail DB'));
      const res = await request(app)
        .post('/api/books/1/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ rating: 5, comment: 'Excelente!' });

      expect(res.statusCode).toBe(500);
    });
  });

  describe('DELETE /api/books/:id/reviews', () => {
    it('debería permitir eliminar una reseña de un usuario', async () => {
      mockPrisma.review.delete.mockResolvedValue({ count: 1 });

      const res = await request(app)
        .delete('/api/books/1/reviews')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
    });

    it('debería devolver 500 si falla la eliminación', async () => {
      mockPrisma.review.delete.mockRejectedValue(new Error('Error delete'));

      const res = await request(app)
        .delete('/api/books/1/reviews')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(500);
    });
  });
});
