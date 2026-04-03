// src/routes/loans.routes.js
import { Router } from 'express';
import authMiddleware, { checkRole, middlewareLoan } from '../middleware/auth.middleware.js';
import { createLoanCtrl, getMyLoansCtrl, getAllLoansCtrl, returnLoanCtrl } from '../controllers/loans.controller.js';
const router = Router();

/**
 * @openapi
 * /api/loans:
 *   post:
 *     tags:
 *       - Loans
 *     summary: "Solicitar un préstamo de un libro"
 *     description: "Crea un nuevo registro de préstamo. El libro debe estar disponible y el usuario no puede tener más de 3 préstamos activos."
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Loan'
 *     responses:
 *       201:
 *         description: "Préstamo creado"
 *       400:
 *         $ref: '#/components/responses/Error'
 */
router.post('/', authMiddleware, middlewareLoan, createLoanCtrl);

/**
 * @openapi
 * /api/loans:
 *   get:
 *     tags:
 *       - Loans
 *     summary: "Obtener mis préstamos"
 *     description: "Lista paginada de los préstamos realizados por el usuario autenticado."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: "Lista de préstamos"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/', authMiddleware, getMyLoansCtrl);

/**
 * @openapi
 * /api/loans/all:
 *   get:
 *     tags:
 *       - Loans
 *     summary: "Obtener todos los préstamos (Admin/Librarian)"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: "Lista completa de préstamos"
 */
router.get('/all', authMiddleware, checkRole(['LIBRARIAN', 'ADMIN']), getAllLoansCtrl);

/**
 * @openapi
 * /api/loans/{id}/return:
 *   put:
 *     tags:
 *       - Loans
 *     summary: "Devolver un préstamo"
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
 *         description: "Préstamo devuelto con éxito"
 *       404:
 *         $ref: '#/components/responses/Error'
 */
router.put('/:id/return', authMiddleware, returnLoanCtrl);

export default router;
