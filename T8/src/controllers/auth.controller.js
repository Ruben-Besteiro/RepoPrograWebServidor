// src/controllers/auth.controller.js
import User from '../models/user.model.js';
//import RefreshToken from '../models/refreshToken.model.js';
import { encrypt, compare } from '../utils/handlePassword.js';
import { handleHttpError } from '../utils/handleError.js';
import {
    generateAccessToken,
    generateRefreshToken,
    getRefreshTokenExpiry
} from '../utils/handleJwt.js';
import { sendSlackMessage } from '../utils/handleSlack.js';

/**
 * Registrar nuevo usuario
 * POST /api/auth/register
 */
export const registerCtrl = async (req, res) => {
    try {
        // Validar datos básicos
        if (!req.body.email || !req.body.password) {
            handleHttpError(res, 'MISSING_DATA', 400);
            return;
        }

        // Verificar si el email ya existe
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            handleHttpError(res, 'EMAIL_ALREADY_EXISTS', 400);
            return;
        }

        // Cifrar contraseña
        const password = await encrypt(req.body.password);

        // Crear usuario con password cifrada
        const body = { ...req.body, password };
        const dataUser = await User.create(body);

        // Ocultar password en la respuesta
        dataUser.set('password', undefined, { strict: false });

        // Generar token
        const data = {
            token: generateAccessToken(dataUser),
            user: dataUser
        };

        // Si es admin, enviar notificación Slack (en segundo plano)
        if (dataUser.role === 'admin') {
            sendSlackMessage(`*Nuevo admin registrado*\n\n*Nombre:* ${dataUser.name}\n*Email:* ${dataUser.email}\n*Edad:* ${dataUser.age}\n*ID:* ${dataUser._id}`);
        }

        res.status(201).send(data);
    } catch (err) {
        console.log(err);
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return handleHttpError(res, `VALIDATION_ERROR: ${messages.join(', ')}`, 400);
        }
        handleHttpError(res, 'ERROR_REGISTER_USER');
    }
};

/**
 * Login - genera solo el access token
 */
export const loginCtrl = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        return res.status(404).json({ error: true, message: 'Usuario no existe' });
    }
    if (!(await compare(password, user.password))) {
        return res.status(401).json({ error: true, message: 'Credenciales inválidas' });
    }

    // Generar tokens
    const accessToken = generateAccessToken(user);
    //const refreshToken = generateRefreshToken();

    // Guardar refresh token en BD
    /*await RefreshToken.create({
        token: refreshToken,
        user: user._id,
        expiresAt: getRefreshTokenExpiry(),
        createdByIp: req.ip
    });*/

    // Ocultar password
    user.password = undefined;

    res.status(201).json({
        token: accessToken, // Alias para compatibilidad con el test
        accessToken,
        //refreshToken,
        user
    });
};

/**
 * Refresh - obtener nuevo access token
 */
export const refreshCtrl = async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ error: true, message: 'Refresh token requerido' });
    }

    // Buscar token en BD
    const storedToken = await RefreshToken.findOne({ token: refreshToken }).populate('user');

    if (!storedToken || !storedToken.isActive()) {
        return res.status(401).json({ error: true, message: 'Refresh token inválido o expirado' });
    }

    // Generar nuevo access token
    const accessToken = generateAccessToken(storedToken.user);

    res.json({ accessToken });
};

/**
 * Logout - revocar refresh token
 */
export const logoutCtrl = async (req, res) => {
    /*const { refreshToken } = req.body;

    if (refreshToken) {
        await RefreshToken.findOneAndUpdate(
            { token: refreshToken },
            { revokedAt: new Date(), revokedByIp: req.ip }
        );
    }*/

    res.json({ message: 'Sesión cerrada' });
};

/**
 * Revocar todos los tokens de un usuario (logout global)
 */
export const revokeAllTokensCtrl = async (req, res) => {
    /*await RefreshToken.updateMany(
        { user: req.user._id, revokedAt: null },
        { revokedAt: new Date(), revokedByIp: req.ip }
    );*/

    res.json({ message: 'Todas las sesiones cerradas' });
};

/**
 * Obtener usuario logueado
 */
export const getMeCtrl = async (req, res) => {
    res.json(req.user);
};