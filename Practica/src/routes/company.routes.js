import { Router } from 'express';
import { createCompany, updateCompany, deleteCompany, getCompanies } from '../controllers/company.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Todas las rutas de compañía requieren estar autenticado y verificado (por defecto true)
router.use(authMiddleware());

router.post('/', createCompany);
router.put('/:id', updateCompany);
router.get('/', getCompanies);
router.delete('/:id', deleteCompany);

export default router;