import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'testsecret';

const mockPrisma = {
  book: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
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

const userToken = jwt.sign({ user: 1 }, process.env.JWT_SECRET);
const adminToken = jwt.sign({ user: 2 }, process.env.JWT_SECRET);

describe('Books Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma.user.findUnique.mockImplementation(({ where }) => {
      if (where.id === 1) return Promise.resolve({ id: 1, role: 'USER' });
      if (where.id === 2) return Promise.resolve({ id: 2, role: 'ADMIN' });
      return Promise.resolve(null);
    });
  });

  describe('GET /api/books', () => {
    it('debería obtener una lista de libros', async () => {
      mockPrisma.book.findMany.mockResolvedValue([
        { id: 1, title: 'Libro 1', author: 'Autor 1' }
      ]);
      mockPrisma.book.count.mockResolvedValue(1);

      const res = await request(app).get('/api/books');

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(mockPrisma.book.findMany).toHaveBeenCalled();
    });
  });

  describe('GET /api/books/:id', () => {
    it('debería obtener un libro específico', async () => {
      mockPrisma.book.findUnique.mockResolvedValue({ id: 1, title: 'Libro 1' });

      const res = await request(app).get('/api/books/1');

      expect(res.statusCode).toBe(200);
      expect(res.body.title).toBe('Libro 1');
    });

    it('debería retornar 404 si el libro no existe', async () => {
      mockPrisma.book.findUnique.mockResolvedValue(null);

      const res = await request(app).get('/api/books/999');

      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/books', () => {
    it('debería crear un libro si es Admin/Librarian', async () => {
      mockPrisma.book.create.mockResolvedValue({ id: 1, title: 'Nuevo' });

      const res = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          isbn: '978-3-16-148410-0',
          title: 'Nuevo',
          author: 'Yo',
          genre: 'Ficción',
          description: null,
          publishedYear: null,
          copies: 5,
          availableCopies: 5
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.title).toBe('Nuevo');
    });

    it('no debería permitir crear libro a un perfil USER normal', async () => {
      const res = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'No puedo' });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('DELETE /api/books/:id', () => {
    it('debería borrar un libro si es admin', async () => {
      mockPrisma.book.delete.mockResolvedValue({ id: 1 });

      const res = await request(app)
        .delete('/api/books/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(mockPrisma.book.delete).toHaveBeenCalled();
    });
  });

  describe('GET /api/books/most-rented', () => {
    it('debería regresar los más rentados', async () => {
      mockPrisma.book.findMany.mockResolvedValue([{ title: 'A' }]);
      const res = await request(app).get('/api/books/most-rented?limit=5');
      expect(res.statusCode).toBe(200);
    });
    it('debería devolver 500 en error', async () => {
      mockPrisma.book.findMany.mockRejectedValue(new Error('Test'));
      const res = await request(app).get('/api/books/most-rented');
      expect(res.statusCode).toBe(500);
    });
  });

  describe('GET /api/books/best-rated', () => {
    it('debería regresar los mejor valorados', async () => {
      mockPrisma.book.findMany.mockResolvedValue([{ title: 'B' }]);
      const res = await request(app).get('/api/books/best-rated?limit=5');
      expect(res.statusCode).toBe(200);
    });
    it('debería devolver 500 en error', async () => {
      mockPrisma.book.findMany.mockRejectedValue(new Error('Test'));
      const res = await request(app).get('/api/books/best-rated');
      expect(res.statusCode).toBe(500);
    });
  });

  describe('PUT /api/books/:id', () => {
    it('debería actualizar un libro (LIBRARIAN/ADMIN)', async () => {
      mockPrisma.book.update.mockResolvedValue({ id: 1, title: 'Modificado' });
      const res = await request(app)
        .put('/api/books/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          isbn: '978-3-16-148410-0',
          title: 'Modificado',
          author: 'Yo',
          genre: 'Ficción',
          description: null,
          publishedYear: null,
          copies: 5,
          availableCopies: 5
        });
      expect(res.statusCode).toBe(200);
    });
    it('debería rechazar 500 en error', async () => {
      mockPrisma.book.update.mockRejectedValue(new Error('Crash'));
      const res = await request(app)
        .put('/api/books/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          isbn: '978-3-16-148410-0',
          title: 'Modificado',
          author: 'Yo',
          genre: 'Ficción',
          description: null,
          publishedYear: null,
          copies: 5,
          availableCopies: 5
        });
      expect(res.statusCode).toBe(500);
    });
  });
});
