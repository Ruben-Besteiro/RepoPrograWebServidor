// src/routes/tareas.routes.js
import { Router } from 'express';
import * as tareasController from '../controllers/tareas.controller.js';        // Debemos importar las funciones del controlador para poder llamarlas
import { validate } from '../middleware/validateRequest.js';
import { createTareaSchema, updateTareaSchema } from '../schemas/tareas.schema.js';

const router = Router();

// Esto son los endpoints que se llaman cuando el cliente mete /api/tareas
// Para /api/cursos/cualquier otra cosa habría que crear un objeto nuevo que correspondería a un controlador nuevo
router.get('/', tareasController.getAll);
router.get('/:id', tareasController.getById);
router.post('/', validate(createTareaSchema), tareasController.create);
router.put('/:id', validate(updateTareaSchema), tareasController.update);
router.patch('/:id', validate(updateTareaSchema), tareasController.partialUpdate);
router.delete('/:id', tareasController.remove);

export default router;