// src/routes/users.routes.js
import { Router } from 'express';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/users.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { createUserSchema, updateUserSchema } from '../schemas/user.schema.js';

const router = Router();

router.get('/', getUsers);		// Se llama a esto cuando se mete /api/users
router.get('/:id', /*validateObjectId(),*/ getUser);
router.post('/', validate(createUserSchema), createUser);
router.put('/:id', validate(updateUserSchema), updateUser);
router.delete('/:id', /*validateObjectId(),*/ deleteUser);

export default router;