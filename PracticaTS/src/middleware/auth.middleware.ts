import { verifyAccessToken } from '../utils/handleJwt.js';
import { User } from '../models/user.model.js';
import { AppError } from '../utils/AppError.js';
import { RefreshToken } from '../models/refreshToken.model.js';
import { NextFunction, Request, Response } from 'express';

// IMPORTANTE: La variable req no tiene campo user por defecto
// Se añade aquí, en la línea 58 y lo sacamos a partir del bearer token
// Como en muchos sitios necesitamos saber cosas del usuario, se lo inyectamos

/**
 * Middleware de autenticación y verificación (JWT)
 * @param {boolean} requireVerification - Si es true (por defecto), comprueba que el usuario esté verificado.
 * @returns {Function} Middleware de Express
 */
// Comprueba que el token es válido y que el usuario está verificado
// Pero si estamos usando el /verify, entonces nos saltamos la comprobación de verificación
export const authMiddleware = (requireVerification = true) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.headers.authorization) {
            throw AppError.unauthorized('NOT_AUTHENTICATED');

        }

        const token = req.headers.authorization.split(' ').pop(); // Bearer <TOKEN>
        const dataToken = verifyAccessToken(token as string);

        if (!dataToken) {
            throw AppError.unauthorized('INVALID_TOKEN');

        }

        // Verificar vinculación estricta a RefreshToken
        // Aquí buscamos el refresh token por el sessionId que viene en el access token
        if (dataToken.sessionId) {
            const session = await RefreshToken.findById(dataToken.sessionId);
            if (!session || !session.isActive()) {
                throw AppError.unauthorized('SESSION_REVOKED');

            }
        }

        // Buscar el usuario por el ID del token
        const user = await User.findById(dataToken._id).populate('company');

        if (!user) {
            throw AppError.notFound('USER_NOT_FOUND');

        }

        // Si se requiere verificación y el usuario está pendiente, bloqueamos
        if (requireVerification && user.status !== 'verified') {
            throw AppError.unauthorized('NOT_VERIFIED');

        }

        // Añadir el usuario a la request para que esté disponible en los controladores
        req.user = user;

        next();
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw AppError.internal('ERROR_AUTH_MIDDLEWARE');
    }
};

export default authMiddleware;
