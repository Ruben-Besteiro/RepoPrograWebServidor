import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import { deleteReviewCtrl } from '../controllers/reviews.controller.js';
const router = Router();

/**
 * @openapi
 * /api/reviews/{id}:
 *   delete:
 *     tags:
 *       - Reviews
 *     summary: "Eliminar una reseña"
 *     description: "Elimina una reseña específica. Requiere estar autenticado y ser el autor."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: "Reseña eliminada"
 *       404:
 *         $ref: '#/components/responses/Error'
 */
router.delete('/:id', authMiddleware, deleteReviewCtrl);

export default router;