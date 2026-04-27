import { Router } from 'express';
import { createProject, updateProject, deleteProject, getAllProjects, getProjectById, restoreProject, archiveProject } from '../controllers/project.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authMiddleware());

router.post('/', createProject);
router.get('/', getAllProjects);
router.get('/:id', getProjectById);
router.patch('/:id', updateProject);
router.delete('/:id', deleteProject);
router.patch('/:id/archive', archiveProject);
router.patch('/:id/restore', restoreProject);

export default router;