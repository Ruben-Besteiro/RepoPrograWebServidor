// src/routes/auth.routes.js
import { Router } from 'express';
import authMiddleware, { middlewareRegister, middlewareLogin } from '../middleware/auth.middleware.js';
import { loginCtrl, registerCtrl, getMeCtrl } from '../controllers/auth.controller.js';

const router = Router();

// Endpoints: Register, login y me

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
 *         application/json:
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
 *         application/json:
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