// src/routes/books.routes.js
import { Router } from 'express';
import authMiddleware from '../middleware/session.middleware.js';
import { checkRole } from '../middleware/role.middleware.js';
import { createBookCtrl, getAllBooksCtrl, getBookCtrl, updateBookCtrl, deleteBookCtrl } from '../controllers/books.controller.js';
import { getReviewsCtrl, createReviewCtrl } from '../controllers/reviews.controller.js';

const router = Router();

// Esto de aquí son las rutas del controlador de libros
router.post('/', authMiddleware, checkRole(['LIBRARIAN', 'ADMIN']), createBookCtrl);
router.get('/', authMiddleware, getAllBooksCtrl);
router.get('/:id', authMiddleware, getBookCtrl);
router.put('/:id', authMiddleware, checkRole(['LIBRARIAN', 'ADMIN']), updateBookCtrl);
router.delete('/:id', authMiddleware, checkRole(['ADMIN']), deleteBookCtrl);

// Y esto de aquí son las rutas del controlador de reseñas
router.get('/:id/reviews', authMiddleware, getReviewsCtrl);
router.post('/:id/reviews', authMiddleware, createReviewCtrl);

export default router;
