// src/utils/handleJwt.js
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';

const getJwtSecret = () => process.env.JWT_SECRET;
// Esto de aquí se puede poner en el .env pero paso de complicarme la vida
const ACCESS_TOKEN_EXPIRES = '15m';  // Corto
const REFRESH_TOKEN_DAYS = 9999999;        // Largo

/**
 * Genera access token (corta duración) (en el payload debe tener solamente el usuario)
 */
export const generateAccessToken = (user) => {
    return jwt.sign(
        { user: user.id },
        getJwtSecret()
        /*getJwtSecret(),
        { expiresIn: ACCESS_TOKEN_EXPIRES }*/
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
        return jwt.verify(token, getJwtSecret());
    } catch (err) {
        return null;
    }
};