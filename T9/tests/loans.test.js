import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'testsecret';

const mockPrisma = {
  loan: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
  },
  book: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn((promises) => Promise.all(promises)) // Mock transaction simplificado
};

jest.unstable_mockModule('../src/config/prisma.js', () => ({
  prisma: mockPrisma,
  default: jest.fn(),
}));

const request = (await import('supertest')).default;
const app = (await import('../src/app.js')).default;

const userToken = jwt.sign({ user: 1 }, process.env.JWT_SECRET);
const librarianToken = jwt.sign({ user: 2 }, process.env.JWT_SECRET);

describe('Loans Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.user.findUnique.mockImplementation(({ where }) => {
      if (where.id === 1) return Promise.resolve({ id: 1, role: 'USER' });
      if (where.id === 2) return Promise.resolve({ id: 2, role: 'LIBRARIAN' });
      return Promise.resolve(null);
    });
  });

  describe('GET /api/loans', () => {
    it('debería retornar préstamos si el token es válido', async () => {
      mockPrisma.loan.findMany.mockResolvedValue([{ id: 1, bookId: 1 }]);
      mockPrisma.loan.count.mockResolvedValue(1);

      const res = await request(app)
        .get('/api/loans')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(mockPrisma.loan.findMany).toHaveBeenCalled();
    });

    it('debería devolver 500 simulando caída', async () => {
      mockPrisma.loan.findMany.mockRejectedValue(new Error('Crash'));
      mockPrisma.loan.count.mockResolvedValue(1);
      const res = await request(app).get('/api/loans').set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toBe(500);
    });
  });

  describe('GET /api/loans/all', () => {
    it('debería permitir visualizar a admin/librarian', async () => {
      mockPrisma.loan.findMany.mockResolvedValue([{ id: 1 }]);
      mockPrisma.loan.count.mockResolvedValue(1);
      const res = await request(app)
        .get('/api/loans/all')
        .set('Authorization', `Bearer ${librarianToken}`);
      expect(res.statusCode).toBe(200);
    });
    it('debería bloquear usuario general', async () => {
      const res = await request(app)
        .get('/api/loans/all')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toBe(403);
    });
    it('debería devolver 500 en fallo', async () => {
      mockPrisma.loan.findMany.mockRejectedValue(new Error('Crash'));
      mockPrisma.loan.count.mockResolvedValue(1);
      const res = await request(app).get('/api/loans/all').set('Authorization', `Bearer ${librarianToken}`);
      expect(res.statusCode).toBe(500);
    });
  });

  describe('POST /api/loans', () => {
    it('debería crear un préstamo correctamente (Librero/Admin)', async () => {
      mockPrisma.book.findUnique.mockResolvedValue({ id: 1, availableCopies: 2 });
      mockPrisma.loan.count.mockResolvedValue(0);
      mockPrisma.loan.findFirst.mockResolvedValue(null);
      mockPrisma.loan.create.mockResolvedValue({ id: 1, userId: 1, bookId: 1 });
      mockPrisma.book.update.mockResolvedValue({});

      const res = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({ 
          bookId: 1, 
          loanDate: '2026-10-01', 
          dueDate: '2026-10-10', 
          returnedDate: null, 
          status: 'ACTIVE' 
        });

      expect(res.statusCode).toBe(201);
    });

    it('debería atrapar error interno 500', async () => {
      mockPrisma.book.findUnique.mockRejectedValue(new Error('Crash DB'));
      const res = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({ bookId: 1, loanDate: '2026-10-01', dueDate: '2026-10-10', returnedDate: null, status: 'ACTIVE' });
      expect(res.statusCode).toBe(500);
    });
  });

  describe('PUT /api/loans/:id/return', () => {
    it('debería permitir devolver un libro', async () => {
      mockPrisma.loan.findUnique.mockResolvedValue({ id: 1, bookId: 1, status: 'ACTIVE' });
      mockPrisma.loan.update.mockResolvedValue({ id: 1, status: 'RETURNED' });
      mockPrisma.book.update.mockResolvedValue({});

      const res = await request(app)
        .put('/api/loans/1/return')
        .set('Authorization', `Bearer ${librarianToken}`);

      expect(res.statusCode).toBe(200);
      expect(mockPrisma.loan.update).toHaveBeenCalled();
    });

    it('debería rechazar con 500', async () => {
      mockPrisma.loan.findUnique.mockRejectedValue(new Error('Boom'));
      const res = await request(app).put('/api/loans/1/return').set('Authorization', `Bearer ${librarianToken}`);
      expect(res.statusCode).toBe(500);
    });
  });
});
