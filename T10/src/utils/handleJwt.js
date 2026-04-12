// src/utils/handleJwt.js
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';

const getJwtSecret = () => process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

/**
 * Genera access token (corta duración) (en el payload debe tener solamente el usuario)
 * Alias: generateToken
 */
export const generateAccessToken = (payload) => {
    // Si el payload es un objeto con id (como se usaba en jwt.js)
    return jwt.sign(
        payload,
        getJwtSecret(),
        { expiresIn: JWT_EXPIRES_IN }
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
    const REFRESH_TOKEN_DAYS = 9999999;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + REFRESH_TOKEN_DAYS);
    return expiry;
};

/**
 * Verifica access token
 * Alias: verifyToken
 */
export const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, getJwtSecret());
    } catch (err) {
        return null;
    }
};

// Aliases para compatibilidad con el código nuevo
export const generateToken = generateAccessToken;
export const verifyToken = verifyAccessToken;