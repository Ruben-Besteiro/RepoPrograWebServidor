import { Router } from 'express';
import {
    getAllUsers,
    verifyUser,
    deleteUser,
    loginUser,
    registerUser,
    refreshTokenCtrl,
    logoutUser,
    revokeAllTokens,
    restoreUser,
    getMe,
    updateUser,
    onboardUser,
    changePassword,
    inviteUser
} from '../controllers/user.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { createUserSchema, loginUserSchema, updateUserSchema, updatePasswordSchema } from '../validators/user.validator.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { checkRole } from '../middleware/role.middleware.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Endpoints para la gestión de usuarios y autenticación
 */

// Rutas Públicas (sin token)

/**
 * @swagger
 * /api/user/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       409:
 *         description: El email ya existe
 */
router.post('/register', validate(createUserSchema), registerUser);

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       404:
 *         description: Usuario no encontrado
 *       401:
 *         description: Contraseña inválida
 */
router.post('/login', validate(loginUserSchema), loginUser);

/**
 * @swagger
 * /api/user/refresh:
 *   post:
 *     summary: Refrescar el Access Token usando el Refresh Token
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tokens generados exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       400:
 *         description: Refresh Token requerido
 *       401:
 *         description: Refresh Token inválido o revocado
 */
router.post('/refresh', refreshTokenCtrl);

/**
 * @swagger
 * /api/user:
 *   put:
 *     summary: Actualizar los datos del usuario autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/User'
 */
router.put('/', authMiddleware(), validate(updateUserSchema), updateUser);

/**
 * @swagger
 * /api/user/password:
 *   patch:
 *     summary: Cambiar la contraseña del usuario autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, password]
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 format: password
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Contraseña cambiada con éxito
 *       401:
 *         description: Contraseña actual inválida
 */
router.patch('/password', authMiddleware(), validate(updatePasswordSchema), changePassword);

// Ruta de Verificación (necesita token pero nos saltamos la comprobación de verificación)
/**
 * @swagger
 * /api/user/verify:
 *   put:
 *     summary: Verificar el usuario usando un código enviado (usualmente al correo)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               verificationCode:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Usuario verificado correctamente
 *       400:
 *         description: El usuario ya estaba verificado
 *       401:
 *         description: Código de verificación inválido
 *       429:
 *         description: Has excedido el límite de intentos permitidos de verificación
 */
router.put('/verify', authMiddleware(false), verifyUser);

/**
 * @swagger
 * /api/user/company:
 *   patch:
 *     summary: Realizar el Onboarding asignando usuario a una compañía o creando una nueva en modo freelance
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cif:
 *                 type: string
 *                 description: CIF de la compañía (Dejar vacío para crear una nueva)
 *     responses:
 *       200:
 *         description: Usuario asociado exitosamente
 */
router.patch('/company', authMiddleware(), onboardUser);

// Rutas Protegidas (necesitan token y estar verificado por defecto)

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Listar todos los usuarios
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios (filtrando campos sensibles)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 */
router.get('/', authMiddleware(), getAllUsers);

/**
 * @swagger
 * /api/user/me:
 *   get:
 *     summary: Obtener datos del propio usuario
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Toda la información del usuario autenticado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                     $ref: '#/components/schemas/User'
 *       404:
 *         description: Usuario borrado (soft delete)
 */
router.get('/me', authMiddleware(), getMe);

/**
 * @swagger
 * /api/user:
 *   delete:
 *     summary: Eliminar un usuario especificado en el cuerpo (Solo Soft Delete por defecto)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: soft
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Define si el borrado es soft (true por defecto manual)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: ID del User a eliminar
 *     responses:
 *       200:
 *         description: Operación de eliminación completada con éxito
 */
router.delete('/', authMiddleware(), deleteUser);

/**
 * @swagger
 * /api/user/restore:
 *   put:
 *     summary: Recuperar un usuario que sufrió un Soft Delete
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario restaurado
 *       400:
 *         description: El usuario no estaba baneado de forma lógica
 */
router.put('/restore', authMiddleware(), restoreUser);

/**
 * @swagger
 * /api/user/logout:
 *   post:
 *     summary: Revocar un Refresh Token para cerrar sesión
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sesión cerrada (Refresh token revocado)
 */
router.post('/logout', authMiddleware(), logoutUser);

/**
 * @swagger
 * /api/user/logout-all:
 *   post:
 *     summary: Inválidar todos los Refresh Tokens asociados al usuario activo en todos los dispositivos
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Se han cerrado todas las sesiones forzosamente
 */
router.post('/logout-all', authMiddleware(), revokeAllTokens);

/**
 * @swagger
 * /api/user/invite:
 *   post:
 *     summary: Mandar link de invitación/incorporación a la misma compañía (Solo admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       200:
 *         description: Usuario de la compañía exitosamente invitado
 */
router.post('/invite', authMiddleware(), checkRole(['admin']), inviteUser);

export default router;