import { Router } from 'express';
import { getAllRooms, createRoom, getRoomMessages, editMessage, deleteMessage } from '../controllers/room.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Todas las rutas de salas requieren autenticación en este ejemplo
router.use(authMiddleware);

router.get('/', getAllRooms);
router.post('/', createRoom);
router.get('/:id/messages', getRoomMessages);
router.put('/:roomId/messages/:messageId', editMessage);
router.delete('/:roomId/messages/:messageId', deleteMessage);

export default router;
