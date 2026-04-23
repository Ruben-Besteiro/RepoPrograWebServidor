// src/middleware/role.middleware.js
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';

// Esto se llamará cuando queramos usar un endpoint que requiera un rol específico
// Por ejemplo, para crear una peli, se necesita el rol 'admin'

/**
 * Middleware de autorización por rol
 * @param {string[]} roles - Array de roles permitidos
 */
export const checkRole = (roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
    try {
        // El usuario viene del middleware de autenticación (authMiddleware)
        const user = req.user;

        if (!user) {
            throw AppError.unauthorized('USER_NOT_FOUND');
        }

        // Obtener rol del usuario
        const userRol = user.role;

        // Verificar si el rol está en la lista de permitidos
        const checkValueRol = roles.includes(userRol);

        if (!checkValueRol) {
            throw AppError.forbidden('NOT_ALLOWED');
        }

        next();
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw AppError.forbidden('ERROR_PERMISSIONS');
    }
};