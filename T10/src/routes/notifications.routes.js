import { Router } from 'express';
import { subscribe, getVapidKey } from '../controllers/notification.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Todas las rutas de notificaciones requieren autenticación
router.use(authMiddleware);

router.post('/subscribe', subscribe);
router.get('/vapid-key', getVapidKey);

export default router;
