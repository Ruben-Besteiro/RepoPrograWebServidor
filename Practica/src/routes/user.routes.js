import { Router } from 'express';
import {
    getAllUsers,
    verifyUser,
    deleteUser,
    loginUser,
    registerUser,
    refreshTokenCtrl,
    logoutUser,
    revokeAllTokens,
    restoreUser,
    getMe,
    updateUser,
    onboardUser,
    changePassword,
    inviteUser
} from '../controllers/user.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { createUserSchema, loginUserSchema, updateUserSchema, updatePasswordSchema } from '../validators/user.validator.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { checkRole } from '../middleware/role.middleware.js';

const router = Router();

// Rutas Públicas (sin token)
router.post('/register', validate(createUserSchema), registerUser);
router.post('/login', validate(loginUserSchema), loginUser);
router.post('/refresh', refreshTokenCtrl);
router.put('/', authMiddleware(), validate(updateUserSchema), updateUser);
router.patch('/password', authMiddleware(), validate(updatePasswordSchema), changePassword);

// Ruta de Verificación (necesita token pero nos saltamos la comprobación de verificación)
router.put('/verify', authMiddleware(false), verifyUser);

// ???
router.patch('/company', authMiddleware(), onboardUser);

// Rutas Protegidas (necesitan token y estar verificado por defecto)
router.get('/', authMiddleware(), getAllUsers);
router.get('/me', authMiddleware(), getMe);
router.delete('/', authMiddleware(), deleteUser);
router.put('/restore', authMiddleware(), restoreUser);
router.post('/logout', authMiddleware(), logoutUser);
router.post('/logout-all', authMiddleware(), revokeAllTokens);
router.post('/invite', authMiddleware(), checkRole(['admin']), inviteUser);

export default router;