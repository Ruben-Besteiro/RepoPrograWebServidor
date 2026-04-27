import { Router } from 'express';
import { createDeliveryNote, signDeliveryNote, deleteDeliveryNote, getAllDeliveryNotes, getDeliveryNoteById } from '../controllers/deliveryNote.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authMiddleware());

/**
 * @swagger
 * tags:
 *   name: DeliveryNotes
 *   description: Gestión de albaranes de trabajo
 */

/**
 * @swagger
 * /api/deliveryNote:
 *   post:
 *     summary: Crear un nuevo albarán
 *     tags: [DeliveryNotes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeliveryNote'
 *     responses:
 *       201:
 *         description: Albarán creado
 *   get:
 *     summary: Obtener todos los albaranes
 *     tags: [DeliveryNotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: signed
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado de firma
 *     responses:
 *       200:
 *         description: Lista de albaranes
 */
router.post('/', createDeliveryNote);
router.get('/', getAllDeliveryNotes);

/**
 * @swagger
 * /api/deliveryNote/{id}:
 *   get:
 *     summary: Obtener un albarán por ID
 *     tags: [DeliveryNotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos del albarán
 *   patch:
 *     summary: Firmar un albarán
 *     tags: [DeliveryNotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Albarán firmado
 *   delete:
 *     summary: Eliminar un albarán
 *     tags: [DeliveryNotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Albarán eliminado
 */
router.get('/:id', getDeliveryNoteById);
router.patch('/:id', signDeliveryNote);
router.delete('/:id', deleteDeliveryNote);

export default router;