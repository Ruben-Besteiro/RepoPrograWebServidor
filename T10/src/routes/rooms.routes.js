import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Todas las rutas de salas requieren autenticación en este ejemplo
router.use(authMiddleware);

router.get('/', getAllRooms);
router.post('/', createRoom);
router.get('/:id/messages', getRoomMessages);

export default router;
