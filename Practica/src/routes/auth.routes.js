// src/routes/auth.routes.js
import { Router } from 'express';
import {
    loginUser,
    registerUser,
    refreshTokenCtrl,
    logoutUser,
    revokeAllTokens
} from '../controllers/user.controller.js';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh', refreshTokenCtrl);           // Obtener nuevo access token
router.post('/logout', logoutUser);                  // Revocar refresh token
//router.post('/logout-all', authMiddleware, revokeAllTokens); // Cerrar todas las sesiones

export default router;