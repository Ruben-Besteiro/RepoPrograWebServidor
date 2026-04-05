import { verifyAccessToken } from '../utils/handleJwt.js';
import { User } from '../models/user.model.js';
import { handleHttpError } from '../utils/handleError.js';
import RefreshToken from '../models/refreshToken.model.js';

/**
 * Middleware de autenticación y verificación (JWT)
 * @param {boolean} requireVerification - Si es true (por defecto), comprueba que el usuario esté verificado.
 * @returns {Function} Middleware de Express
 */
// Comprueba que el token es válido y que el usuario está verificado
// Pero si estamos usando el /verify, entonces nos saltamos la comprobación de verificación
export const authMiddleware = (requireVerification = true) => async (req, res, next) => {
    try {
        if (!req.headers.authorization) {
            handleHttpError(res, 'NOT_AUTHENTICATED', 401);
            return;
        }

        const token = req.headers.authorization.split(' ').pop(); // Bearer <TOKEN>
        const dataToken = verifyAccessToken(token);

        if (!dataToken) {
            handleHttpError(res, 'INVALID_TOKEN', 401);
            return;
        }

        // Verificar vinculación estricta a RefreshToken
        // Aquí buscamos el refresh token por el sessionId que viene en el access token
        if (dataToken.sessionId) {
            const session = await RefreshToken.findById(dataToken.sessionId);
            if (!session || !session.isActive()) {
                handleHttpError(res, 'SESSION_REVOKED', 401);
                return;
            }
        }

        // Buscar el usuario por el ID del token
        const user = await User.findById(dataToken._id).populate('company');

        if (!user) {
            handleHttpError(res, 'USER_NOT_FOUND', 404);
            return;
        }

        // Si se requiere verificación y el usuario está pendiente, bloqueamos
        if (requireVerification && user.status !== 'verified') {
            handleHttpError(res, 'NOT_VERIFIED', 401);
            return;
        }

        // Añadir el usuario a la request para que esté disponible en los controladores
        req.user = user;

        next();
    } catch (err) {
        handleHttpError(res, 'ERROR_AUTH_MIDDLEWARE', 500);
    }
};

export default authMiddleware;
