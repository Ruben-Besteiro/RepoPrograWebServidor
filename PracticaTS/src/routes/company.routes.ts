import { Router } from 'express';
import { createCompany, updateCompany, deleteCompany, getCompanies, editLogo } from '../controllers/company.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { uploadMiddleware } from '../middleware/upload.middleware.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Companies
 *   description: Endpoints para la gestión de las compañías
 */

// Todas las rutas de compañía requieren estar autenticado y verificado (por defecto true)
router.use(authMiddleware());

/**
 * @swagger
 * /api/company:
 *   post:
 *     summary: Crear una nueva compañía
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Company'
 *     responses:
 *       201:
 *         description: Compañía creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Company'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', createCompany);

/**
 * @swagger
 * /api/company/{id}:
 *   put:
 *     summary: Actualizar una compañía existente
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la compañía
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Company'
 *     responses:
 *       200:
 *         description: Compañía actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Company'
 *       500:
 *         description: Error interno del servidor
 */
router.put('/:id', updateCompany);

/**
 * @swagger
 * /api/company:
 *   get:
 *     summary: Listar todas las compañías
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de compañías obtenida del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Company'
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', getCompanies);

/**
 * @swagger
 * /api/company/{id}:
 *   delete:
 *     summary: Eliminar una compañía
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la compañía
 *     responses:
 *       200:
 *         description: Compañía eliminada satisfactoriamente
 *       500:
 *         description: Ocurrió un error en el servidor
 */
router.delete('/:id', deleteCompany);

/**
 * @swagger
 * /api/company/logo:
 *   patch:
 *     summary: Subir o actualizar el logo de la compañía del usuario autenticado
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: Archivo de imagen para subir como logo
 *     responses:
 *       200:
 *         description: Logo actualizado con éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: LOGO_UPDATED
 *                 data:
 *                   type: object
 *                   properties:
 *                     logo:
 *                       type: string
 *                       format: uri
 *       400:
 *         description: Falta subir el archivo (NO_IMAGE_UPLOADED)
 *       403:
 *         description: El usuario actual no pertenece o no tiene compañía asignada (USER_HAS_NO_COMPANY)
 */
router.patch('/logo', uploadMiddleware.single('logo'), editLogo);      // Subir el logo de la compañía con Multer

export default router;