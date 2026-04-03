// src/routes/books.routes.js
import { Router } from 'express';
import authMiddleware, { checkRole, middlewareBook, middlewareReview } from '../middleware/auth.middleware.js';
import { createBookCtrl, getAllBooksCtrl, getBookCtrl, updateBookCtrl, deleteBookCtrl, getMostRentedBooksCtrl, getBestRatedBooksCtrl } from '../controllers/books.controller.js';
import { getReviewsCtrl, createReviewCtrl, deleteReviewCtrl } from '../controllers/reviews.controller.js';

const router = Router();

// En cuanto al orden de las rutas, es importante que las que tienen :id vayan abajo
// Las rutas más específicas van arriba y las más generales van abajo

/**
 * @openapi
 * /api/books:
 *   post:
 *     tags:
 *       - Books
 *     summary: "Crear un nuevo libro"
 *     description: "Crea un libro en la base de datos. Requiere rol LIBRARIAN o ADMIN."
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Book'
 *     responses:
 *       201:
 *         description: "Libro creado con éxito"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       400:
 *         $ref: '#/components/responses/Error'
 */
router.post('/', authMiddleware, checkRole(['LIBRARIAN', 'ADMIN']), middlewareBook, createBookCtrl);

/**
 * @openapi
 * /api/books:
 *   get:
 *     tags:
 *       - Books
 *     summary: "Obtener todos los libros"
 *     description: "Retorna una lista paginada de libros. Soporta filtros por género y autor."
 *     parameters:
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: "Filtrar por género"
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *         description: "Filtrar por autor"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: "Número de página"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: "Elementos por página"
 *     responses:
 *       200:
 *         description: "Lista de libros"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/', getAllBooksCtrl);

/**
 * @openapi
 * /api/books/most-rented:
 *   get:
 *     tags:
 *       - Books
 *     summary: "Obtener los N libros más alquilados"
 *     parameters:
 *       - in: query
 *         name: limit
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: "Lista de libros"
 */
router.get('/most-rented', getMostRentedBooksCtrl);

/**
 * @openapi
 * /api/books/best-rated:
 *   get:
 *     tags:
 *       - Books
 *     summary: "Obtener los N libros mejor valorados"
 *     parameters:
 *       - in: query
 *         name: limit
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: "Lista de libros"
 */
router.get('/best-rated', getBestRatedBooksCtrl);

/**
 * @openapi
 * /api/books/{id}:
 *   get:
 *     tags:
 *       - Books
 *     summary: "Obtener un libro por ID"
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: "Detalles del libro"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       404:
 *         $ref: '#/components/responses/Error'
 */
router.get('/:id', getBookCtrl);

/**
 * @openapi
 * /api/books/{id}:
 *   put:
 *     tags:
 *       - Books
 *     summary: "Actualizar un libro"
 *     description: "Actualiza los datos de un libro existente. Requiere rol LIBRARIAN o ADMIN."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Book'
 *     responses:
 *       200:
 *         description: "Libro actualizado"
 *       404:
 *         $ref: '#/components/responses/Error'
 */
router.put('/:id', authMiddleware, checkRole(['LIBRARIAN', 'ADMIN']), middlewareBook, updateBookCtrl);

/**
 * @openapi
 * /api/books/{id}:
 *   delete:
 *     tags:
 *       - Books
 *     summary: "Eliminar un libro"
 *     description: "Elimina un libro de la base de datos. Requiere rol ADMIN."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: "Libro eliminado"
 *       404:
 *         $ref: '#/components/responses/Error'
 */
router.delete('/:id', authMiddleware, checkRole(['ADMIN']), deleteBookCtrl);

// Y esto de aquí son las rutas del controlador de reseñas

/**
 * @openapi
 * /api/books/{id}/reviews:
 *   get:
 *     tags:
 *       - Reviews
 *     summary: "Obtener las reseñas de un libro"
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: "Lista de reseñas"
 */
router.get('/:id/reviews', getReviewsCtrl);

/**
 * @openapi
 * /api/books/{id}/reviews:
 *   post:
 *     tags:
 *       - Reviews
 *     summary: "Crear una reseña para un libro"
 *     description: "Crea una reseña para el libro especificado. El usuario debe haber tomado prestado y devuelto el libro previamente."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Review'
 *     responses:
 *       201:
 *         description: "Reseña creada"
 *       403:
 *         description: "No permitido (no ha devuelto el libro)"
 */
router.post('/:id/reviews', authMiddleware, middlewareReview, createReviewCtrl);

/**
 * @openapi
 * /api/books/{id}/reviews:
 *   delete:
 *     tags:
 *       - Reviews
 *     summary: "Eliminar la reseña de un libro por parte del usuario"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "ID del libro"
 *     responses:
 *       200:
 *         description: "Reseña eliminada"
 */
router.delete('/:id/reviews', authMiddleware, deleteReviewCtrl);

export default router;
