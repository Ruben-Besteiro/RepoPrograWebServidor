import { handleHttpError } from '../utils/handleError.js';

/**
 * Middleware para verificar roles
 * @param {Array} roles - Lista de roles permitidos
 */
export const checkRole = (roles) => (req, res, next) => {
    try {
        const { user } = req;
        if (!user) {
            handleHttpError(res, 'NOT_AUTHORIZED', 401);
            return;
        }

        const rolesByUser = user.role; 

        if (roles.includes(rolesByUser)) {
            next();
        } else {
            handleHttpError(res, 'USER_NOT_PERMISSIONS', 403);
        }
    } catch (e) {
        handleHttpError(res, 'ERROR_PERMISSIONS', 403);
    }
}
