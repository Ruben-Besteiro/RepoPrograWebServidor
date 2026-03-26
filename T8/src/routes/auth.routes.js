// src/routes/auth.routes.js
import { Router } from 'express';
import authMiddleware from '../middleware/session.middleware.js';
import {
    loginCtrl,
    registerCtrl,
    refreshCtrl,
    logoutCtrl,
    revokeAllTokensCtrl,
    getMeCtrl
} from '../controllers/auth.controller.js';
import { middlewareRegister, middlewareLogin } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: "Registrar un nuevo usuario"
 *     requestBody:
 *       required: true
 *       content:
 *         application_json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: "Usuario registrado con éxito"
 *       400:
 *         $ref: '#/components/responses/Error'
 */
router.post('/register', middlewareRegister, registerCtrl);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: "Iniciar sesión"
 *     requestBody:
 *       required: true
 *       content:
 *         application_json:
 *           schema:
 *             $ref: '#/components/schemas/Login'
 *     responses:
 *       200:
 *         description: "Login exitoso, retorna token JWT"
 *       401:
 *         description: "Credenciales inválidas"
 */
router.post('/login', middlewareLogin, loginCtrl);

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     tags:
 *       - Auth
 *     summary: "Refrescar token"
 *     responses:
 *       200:
 *         description: "Nuevo access token generado"
 */
router.post('/refresh', refreshCtrl);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: "Cerrar sesión"
 *     responses:
 *       200:
 *         description: "Sesión cerrada con éxito"
 */
router.post('/logout', logoutCtrl);

/**
 * @openapi
 * /api/auth/logout-all:
 *   post:
 *     tags:
 *       - Auth
 *     summary: "Cerrar todas las sesiones"
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "Tokens revocados con éxito"
 */
router.post('/logout-all', authMiddleware, revokeAllTokensCtrl);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags:
 *       - Auth
 *     summary: "Ver perfil del usuario actual"
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "Datos del usuario actual"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.get('/me', authMiddleware, getMeCtrl);

export default router;