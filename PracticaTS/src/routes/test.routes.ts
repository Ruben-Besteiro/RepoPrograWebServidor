
import { Router } from 'express';

const router = Router();

// Esta ruta solo sirve para probar que Slack funciona
router.get('/bug', (req, res) => {
    throw new Error('💥 Esto es un error de prueba para Slack');
});

export default router;
