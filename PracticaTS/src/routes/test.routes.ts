
import { Router } from 'express';

const router = Router();

/**
 * @swagger
 * /api/test/bug:
 *   get:
 *     summary: Forzar un error para probar integraciones (como Slack)
 *     tags: [Test]
 *     responses:
 *       500:
 *         description: Error forzado
 */
router.get('/bug', (req, res) => {
    throw new Error('💥 Esto es un error de prueba para Slack');
});

export default router;
