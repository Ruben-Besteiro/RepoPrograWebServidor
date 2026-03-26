// src/routes/podcasts.routes.js
import { Router } from 'express';
import authMiddleware from '../middleware/session.middleware.js';
import {
    getPodcastsCtrl,
    getPodcastCtrl,
    createPodcastCtrl,
    updatePodcastCtrl,
    deletePodcastCtrl,
    getAllPodcastsCtrl,
    publishPodcastCtrl,
    unpublishPodcastCtrl
} from '../controllers/podcasts.controller.js';
import { checkRole } from '../middleware/role.middleware.js';

const router = Router();

/**
 * @openapi
 * /api/podcasts:
 *   get:
 *     tags:
 *       - Podcasts
 *     summary: "Listar podcasts publicados"
 *     description: "Retorna una lista de podcasts que tienen el estado 'published: true'."
 *     responses:
 *       200:
 *         description: "Lista de podcasts"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Podcast'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/', getPodcastsCtrl);

/**
 * @openapi
 * /api/podcasts/{id}:
 *   get:
 *     tags:
 *       - Podcasts
 *     summary: "Obtener un podcast por ID"
 *     description: "Retorna los detalles de un podcast. Si el podcast no está publicado, solo un admin puede verlo."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: "Detalles del podcast"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Podcast'
 *       403:
 *         description: "Acceso denegado (no publicado)"
 *       404:
 *         description: "Podcast no encontrado"
 */
router.get('/:id', authMiddleware, getPodcastCtrl);

/**
 * @openapi
 * /api/podcasts:
 *   post:
 *     tags:
 *       - Podcasts
 *     summary: "Crear un podcast"
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Podcast'
 *     responses:
 *       201:
 *         description: "Podcast creado"
 *       400:
 *         description: "Error de validación"
 *       401:
 *         description: "No autorizado"
 */
router.post('/', authMiddleware, createPodcastCtrl);

/**
 * @openapi
 * /api/podcasts/{id}:
 *   put:
 *     tags:
 *       - Podcasts
 *     summary: "Actualizar un podcast"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Podcast'
 *     responses:
 *       200:
 *         description: "Podcast actualizado"
 */
router.put('/:id', authMiddleware, updatePodcastCtrl);

/**
 * @openapi
 * /api/podcasts/{id}:
 *   delete:
 *     tags:
 *       - Podcasts
 *     summary: "Eliminar un podcast"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: "Podcast eliminado"
 */
router.delete('/:id', authMiddleware, checkRole(['admin']), deletePodcastCtrl);

/**
 * @openapi
 * /api/podcasts/admin/all:
 *   get:
 *     tags:
 *       - Podcasts
 *     summary: "Listar todos los podcasts (Admin)"
 *     description: "Muestra todos los podcasts. Si no eres admin, solo verás los publicados."
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "Lista completa de podcasts"
 */
router.get('/admin/all', authMiddleware, checkRole(['admin']), getAllPodcastsCtrl);

/**
 * @openapi
 * /api/podcasts/{id}/publish:
 *   patch:
 *     tags:
 *       - Podcasts
 *     summary: "Publicar un podcast"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: "Podcast publicado"
 */
router.patch('/:id/publish', authMiddleware, publishPodcastCtrl);

/**
 * @openapi
 * /api/podcasts/{id}/unpublish:
 *   patch:
 *     tags:
 *       - Podcasts
 *     summary: "Despublicar un podcast"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: "Podcast despublicado"
 */
router.patch('/:id/unpublish', authMiddleware, unpublishPodcastCtrl);

export default router;
