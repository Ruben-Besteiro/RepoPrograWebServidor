// src/routes/storage.routes.js
import { Router } from 'express';
import uploadMiddleware from '../utils/handleStorage.js';
import { uploadFile, getFiles, getOneFile, deleteFile } from '../controllers/storage.controller.js';

const router = Router();

router.get('/', getFiles);
router.get('/:id', getOneFile);
router.post('/', uploadMiddleware.single('cover'), uploadFile);
router.delete('/:id', deleteFile);

export default router;