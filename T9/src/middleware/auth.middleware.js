// src/middleware/auth.middleware.js
import { registerSchema, loginSchema, bookSchema, loanSchema, reviewSchema } from '../schemas/validation.js';
import { verifyAccessToken } from '../utils/handleJwt.js';
import { handleHttpError } from '../utils/handleError.js';
import { prisma } from '../config/prisma.js';

/**
 * Helper genérico para validar esquemas Zod
 */
const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            error: true,
            message: 'Error de validación',
            errors: result.error.issues
        });
    }
    req.body = result.data;
    next();
};

export const middlewareRegister = validate(registerSchema);
export const middlewareLogin = validate(loginSchema);
export const middlewareBook = validate(bookSchema);
export const middlewareLoan = validate(loanSchema);
export const middlewareReview = validate(reviewSchema);


/**
 * Middleware de autenticación
 * Verifica el token JWT y añade el usuario a req.user
 */
const authMiddleware = async (req, res, next) => {
    try {
        // Verificar que existe el header Authorization (es necesario porque si no existe no hay token)
        if (!req.headers.authorization) {
            handleHttpError(res, 'NOT_TOKEN', 401);
            return;
        }

        // Extraer token: "Bearer eyJhbG..." -> "eyJhbG..."
        const token = req.headers.authorization.split(' ').pop();

        // Verificar token
        const dataToken = await verifyAccessToken(token);

        if (!dataToken || !dataToken.user) {
            handleHttpError(res, 'ERROR_ID_TOKEN', 401);
            return;
        }

        // Buscar usuario y añadirlo a req (ahora usando dataToken.user)
        const user = await prisma.user.findUnique({ where: { id: dataToken.user } });

        if (!user) {
            handleHttpError(res, 'USER_NOT_FOUND', 401);
            return;
        }

        // Inyectar usuario en la petición
        req.user = user;

        next();
    } catch (err) {
        handleHttpError(res, 'NOT_SESSION', 401);
    }
};

export default authMiddleware;


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