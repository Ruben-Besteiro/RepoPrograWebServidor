// src/routes/loans.routes.js
import { Router } from 'express';
import authMiddleware from '../middleware/session.middleware.js';
import { checkRole } from '../middleware/role.middleware.js';
import { createLoanCtrl, getMyLoansCtrl, getAllLoansCtrl, returnLoanCtrl } from '../controllers/loans.controller.js';
const router = Router();

router.post('/', authMiddleware, createLoanCtrl);
router.get('/', authMiddleware, getMyLoansCtrl);     // Debe mostrar solo los préstamos del usuario que se logueó
router.get('/all', authMiddleware, checkRole(['LIBRARIAN', 'ADMIN']), getAllLoansCtrl);     // Debe mostrar todos los préstamos
router.put('/:id/return', authMiddleware, returnLoanCtrl);

export default router;
