import { Router } from 'express';
import { deleteReviewCtrl } from '../controllers/reviews.controller.js';
import authMiddleware from '../middleware/session.middleware.js';
import { checkRole } from '../middleware/role.middleware.js';
const router = Router();

router.delete('/:id', authMiddleware, checkRole(['ADMIN']), deleteReviewCtrl);

export default router;