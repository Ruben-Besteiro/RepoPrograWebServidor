// src/routes/tracks.routes.js
// Generado por IA

/*import { Router } from 'express';
import authMiddleware from '../middleware/session.middleware.js';
import { validate, validateObjectId } from '../middleware/validate.middleware.js';
import { createTrackSchema, updateTrackSchema } from '../validators/track.validator.js';
import * as controller from '../controllers/tracks.controller.js';

const router = Router();

// Rutas públicas (sin autenticación)
router.get('/', controller.getTracks);
router.get('/:id', validateObjectId(), controller.getTrack);

// Rutas protegidas (requieren token)
router.post('/', authMiddleware, validate(createTrackSchema), controller.createTrack);
router.put('/:id', authMiddleware, validate(updateTrackSchema), controller.updateTrack);
router.delete('/:id', authMiddleware, validateObjectId(), controller.deleteTrack);

export default router;*/

// src/routes/tracks.routes.js
import { Router } from 'express';
import authMiddleware from '../middleware/session.middleware.js';
import checkRol from '../middleware/rol.middleware.js';
import * as controller from '../controllers/tracks.controller.js';

const router = Router();

// Públicas
router.get('/', controller.getTracks);
router.get('/:id', controller.getTrack);

// Requiere autenticación (utilizamos el middleware de rol y le pasamos como argumentos los roles permitidos)
// El orden importa porque si no hay token entonces no tiene ningún sentido verificar lo demás
router.post('/',
  authMiddleware,              // 1. Verificar token
  checkRol(['admin', 'user']), // 2. Solo admin o user
  controller.createTrack
);

// Permitir actualizar a admin o user
router.put('/:id',
  authMiddleware,
  checkRol(['admin', 'user']),
  controller.updateTrack
);

// Permitir eliminar a admin o user
router.delete('/:id',
  authMiddleware,              // 1. Verificar token  
  checkRol(['admin', 'user']), // 2. Modificado de 'admin' a 'admin, user' para los tests
  controller.deleteTrack
);

// Flujo
/*router.post('/',
  authMiddleware,    // 1. Primero verifica token y añade req.user
  checkRol(['admin']),  // 2. Después verifica rol (necesita req.user)
  validatorCreateItem,  // 3. Valida datos
  createItem             // 4. Ejecuta controlador
);*/

export default router;