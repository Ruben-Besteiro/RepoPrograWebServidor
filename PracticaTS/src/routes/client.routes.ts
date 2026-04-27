import { Router } from 'express';
import { createClient, updateClient, deleteClient, getAllClients, getClientById, restoreClient, getArchivedClients, archiveClient } from '../controllers/client.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware());

router.post('/', createClient);
router.get('/', getAllClients);
router.get('/archived', getArchivedClients);
router.get('/:id', getClientById);
router.patch('/:id', updateClient);
router.patch('/:id/archive', archiveClient);
router.patch('/:id/restore', restoreClient);
router.delete('/:id', deleteClient);

export default router;