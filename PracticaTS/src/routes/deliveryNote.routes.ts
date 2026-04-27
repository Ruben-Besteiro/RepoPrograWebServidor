import { Router } from 'express';
import { createDeliveryNote, signDeliveryNote, deleteDeliveryNote, getAllDeliveryNotes, getDeliveryNoteById } from '../controllers/deliveryNote.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authMiddleware());

router.post('/', createDeliveryNote);
router.patch('/:id', signDeliveryNote);
router.delete('/:id', deleteDeliveryNote);
router.get('/', getAllDeliveryNotes);
router.get('/:id', getDeliveryNoteById);

export default router;