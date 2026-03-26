import { Router } from 'express';
import { getAllUsers } from '../controllers/user.controller.js';

const router = Router();

// Ruta protegida: necesita token JWT en el header Authorization
router.get('/', getAllUsers);

export default router;