// src/controllers/user.controller.js
import { User } from '../models/user.model.js';
import RefreshToken from '../models/refreshToken.model.js';
import { generateAccessToken, generateRefreshToken, getRefreshTokenExpiry } from '../utils/handleJwt.js';
import { encrypt, compare } from '../utils/handlePassword.js';
import { handleHttpError } from '../utils/handleError.js';

/**
 * Registrar usuario
 * Cifra la contraseña y devuelve tokens
 */
export const registerUser = async (req, res) => {
    try {
        const { password, ...body } = req.body;

        // Cifrar contraseña
        const hashedPassword = await encrypt(password);

        // Crear usuario con contraseña cifrada
        const user = await User.create({ ...body, password: hashedPassword });

        // Generar tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken();

        // Guardar refresh token en BD
        await RefreshToken.create({
            token: refreshToken,
            user: user._id,
            expiresAt: getRefreshTokenExpiry(),
            createdByIp: req.ip
        });

        // No devolver la contraseña
        const userObj = user.toObject();
        delete userObj.password;

        res.status(201).json({
            data: userObj,
            accessToken,
            refreshToken
        });
    } catch (err) {
        handleHttpError(res, 'ERROR_REGISTER_USER', 500);
    }
};

/**
 * Login de usuario
 * Verifica credenciales y devuelve tokens
 */
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Buscar usuario
        const user = await User.findOne({ email });
        if (!user) {
            handleHttpError(res, 'USER_NOT_FOUND', 404);
            return;
        }

        // Comparar contraseña con hash
        const isMatch = await compare(password, user.password);
        if (!isMatch) {
            handleHttpError(res, 'INVALID_PASSWORD', 401);
            return;
        }

        // Generar tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken();

        // Guardar refresh token en BD
        await RefreshToken.create({
            token: refreshToken,
            user: user._id,
            expiresAt: getRefreshTokenExpiry(),
            createdByIp: req.ip
        });

        // No devolver la contraseña
        const userObj = user.toObject();
        delete userObj.password;

        res.status(200).json({
            data: userObj,
            accessToken,
            refreshToken
        });
    } catch (err) {
        handleHttpError(res, 'ERROR_LOGIN_USER', 500);
    }
};

/**
 * Obtener todos los usuarios (ruta protegida)
 */
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json({ data: users });
    } catch (err) {
        handleHttpError(res, 'ERROR_GET_USERS', 500);
    }
};

/**
 * Refresh token — genera nuevo access token
 */
export const refreshTokenCtrl = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            handleHttpError(res, 'REFRESH_TOKEN_REQUIRED', 400);
            return;
        }

        // Buscar en BD
        const storedToken = await RefreshToken.findOne({ token: refreshToken }).populate('user');

        if (!storedToken || !storedToken.isActive()) {
            handleHttpError(res, 'INVALID_REFRESH_TOKEN', 401);
            return;
        }

        // Generar nuevo access token
        const newAccessToken = generateAccessToken(storedToken.user);

        res.status(200).json({ accessToken: newAccessToken });
    } catch (err) {
        handleHttpError(res, 'ERROR_REFRESH_TOKEN', 500);
    }
};

/**
 * Logout — revoca un refresh token
 */
export const logoutUser = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            handleHttpError(res, 'REFRESH_TOKEN_REQUIRED', 400);
            return;
        }

        const storedToken = await RefreshToken.findOne({ token: refreshToken });

        if (!storedToken) {
            handleHttpError(res, 'TOKEN_NOT_FOUND', 404);
            return;
        }

        // Revocar
        storedToken.revokedAt = new Date();
        storedToken.revokedByIp = req.ip;
        await storedToken.save();

        res.status(200).json({ message: 'SESSION_CLOSED' });
    } catch (err) {
        handleHttpError(res, 'ERROR_LOGOUT', 500);
    }
};

/**
 * Cerrar todas las sesiones del usuario (requiere authMiddleware)
 */
export const revokeAllTokens = async (req, res) => {
    try {
        // req.user viene del authMiddleware
        await RefreshToken.updateMany(
            { user: req.user._id, revokedAt: null },
            { revokedAt: new Date(), revokedByIp: req.ip }
        );

        res.status(200).json({ message: 'ALL_SESSIONS_CLOSED' });
    } catch (err) {
        handleHttpError(res, 'ERROR_REVOKE_ALL', 500);
    }
};