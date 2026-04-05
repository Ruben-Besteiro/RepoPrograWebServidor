// src/utils/handleJwt.js
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';

const JWT_SECRET = process.env.JWT_SECRET;
// Esto de aquí se puede poner en el .env pero paso de complicarme la vida
const ACCESS_TOKEN_EXPIRES = '15m';  // Corto
const REFRESH_TOKEN_DAYS = 9999999;        // Largo

/**
 * Genera access token (corta duración)
 */
// Cuando generamos el access token en el user controller, le pasamos el id del refresh token que creamos anteriormente
// Al incluirlo aquí lo que se hace es que el access token dependa del refresh token
// Por lo tanto en el logout solo es necesario revocar el refresh token
// La comprobación de que el refresh token es válido se hace en el auth.middleware.js
export const generateAccessToken = (user, refreshTokenId) => {
    return jwt.sign(
        { _id: user._id, sessionId: refreshTokenId },
        JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRES }
    );
};

/**
 * Genera refresh token (larga duración)
 * Usa crypto para token opaco (no JWT)
 */
export const generateRefreshToken = () => {
    return crypto.randomBytes(64).toString('hex');
};

/**
 * Calcula fecha de expiración del refresh token
 */
export const getRefreshTokenExpiry = () => {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + REFRESH_TOKEN_DAYS);
    return expiry;
};

/**
 * Verifica access token
 */
export const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return null;
    }
};