// src/controllers/user.controller.js
import { Request, Response } from 'express';
import { User } from '../models/user.model.js';
import { Company } from '../models/company.model.js';
import { RefreshToken } from '../models/refreshToken.model.js';
import { generateAccessToken, generateRefreshToken, getRefreshTokenExpiry } from '../utils/handleJwt.js';
import { encrypt, compare } from '../utils/handlePassword.js';
import { AppError } from '../utils/AppError.js';
import eventService from '../services/event.service.js';

/**
 * Registrar usuario
 * Cifra la contraseña y devuelve tokens
 */
export const registerUser = async (req: Request, res: Response) => {
    try {
        const { password, ...body } = req.body;

        // Si el email ya existe, peta
        if (await User.findOne({ email: body.email })) {
            throw AppError.conflict('EMAIL_ALREADY_EXISTS');

        }

        // Cifrar contraseña
        const hashedPassword = await encrypt(password);

        // Crear usuario con contraseña cifrada
        const user = await User.create({ ...body, password: hashedPassword, verificationCode: Math.floor(100000 + Math.random() * 900000).toString(), verificationAttempts: 3, role: 'admin', status: 'pending', deleted: false });

        // Generar refresh token
        const refreshToken = generateRefreshToken();

        // Guardar refresh token en BD
        const storedRefreshToken = await RefreshToken.create({
            token: refreshToken,
            user: user._id,
            expiresAt: getRefreshTokenExpiry(),
            createdByIp: req.ip
        });

        // Generar access token vinculado a la sesión
        const accessToken = generateAccessToken(user, storedRefreshToken.id);

        // Emitir evento de registro
        eventService.emit('user:registered', user);

        // No devolver la contraseña
        const userObj: any = user.toObject();
        delete userObj.password;

        res.status(201).json({
            data: userObj,
            accessToken,
            refreshToken
        });
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw AppError.internal('ERROR_REGISTER_USER');
    }
};

/**
 * Verificar usuario
 */
export const verifyUser = async (req: Request, res: Response) => {
    const { verificationCode } = req.body;
    const user = req.user;

    if (!user) {
        throw AppError.notFound('USER_NOT_FOUND');

    }

    // No se puede verificar 2 veces
    if (user.status === 'verified') {
        throw AppError.badRequest('USER_ALREADY_VERIFIED');

    }

    // Esto se ejecuta a partir del 4º intento
    if (user.verificationAttempts <= 0) {
        // Borrar el usuario
        await User.findByIdAndDelete(user._id);

        // Emitir evento de borrado (por intentos fallidos)
        eventService.emit('user:deleted', { _id: user._id, email: user.email, fullName: user.fullName, reason: 'MAX_VERIFICATION_ATTEMPTS' });

        throw AppError.badRequest('MAX_VERIFICATION_ATTEMPTS');
    }

    // El código se guarda como string en la BD (aunque sea un número)
    if (user.verificationCode !== String(verificationCode)) {
        user.verificationAttempts--;
        await user.save();

        throw AppError.unauthorized('INVALID_VERIFICATION_CODE');
    }

    user.status = 'verified';
    user.verificationCode = null;
    user.verificationAttempts = 0;
    await user.save();

    // Emitir evento de verificación
    eventService.emit('user:verified', user);

    res.status(200).json({ message: 'USER_VERIFIED' });
}

/**
 * Login de usuario
 * Verifica credenciales y devuelve tokens
 */
export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Buscar usuario
        const user = await User.findOne({ email });
        if (!user) {
            throw AppError.notFound('USER_NOT_FOUND');

        }

        // Comparar contraseña con hash
        const isMatch = await compare(password, user.password as string);
        if (!isMatch) {
            throw AppError.unauthorized('INVALID_PASSWORD');
        }

        // Generar y guardar refresh token en BD primero
        const refreshToken = generateRefreshToken();
        const storedRefreshToken = await RefreshToken.create({
            token: refreshToken,
            user: user._id,
            expiresAt: getRefreshTokenExpiry(),
            createdByIp: req.ip
        });

        // Generar access token vinculado a la sesión
        const accessToken = generateAccessToken(user, storedRefreshToken.id);

        // No devolver la contraseña
        const userObj: any = user.toObject();
        delete userObj.password;

        res.status(200).json({
            data: userObj,
            accessToken,
            refreshToken
        });
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw AppError.internal('ERROR_LOGIN_USER');
    }
};

/**
 * Actualizar usuario que tiene el token
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
export const updateUser = async (req: Request, res: Response) => {
    try {
        const { ...body } = req.body;
        if (!req.user) throw AppError.unauthorized('USER_NOT_FOUND');
        const user = await User.findById(req.user._id).populate('company');
        if (!user) {
            throw AppError.notFound('USER_NOT_FOUND');
        }

        Object.assign(user, body);
        await user.save();

        // Volver a popular la compañía después de guardar para que la response sea correcta
        await user.populate('company');

        const userObj: any = user.toObject();
        delete userObj.password;
        delete userObj.verificationCode;
        delete userObj.verificationAttempts;
        delete userObj.deleted;
        res.status(200).json({ data: userObj });
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw AppError.internal('ERROR_UPDATE_USER');
    }
}

export const changePassword = async (req: Request, res: Response) => {
    try {
        const { password, oldPassword } = req.body;
        if (!req.user) throw AppError.unauthorized('USER_NOT_FOUND');
        const user = await User.findById(req.user._id);

        if (!user) {
            throw AppError.notFound('USER_NOT_FOUND');
        }

        const isMatch = await compare(oldPassword, user.password as string);
        if (!isMatch) {
            throw AppError.unauthorized('INVALID_PASSWORD');
        }

        const hashedPassword = await encrypt(password);
        user.password = hashedPassword;
        await user.save();
        res.status(200).json({ message: 'PASSWORD_CHANGED' });
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw AppError.internal('ERROR_CHANGE_PASSWORD');
    }
}

/**
 * Obtener todos los usuarios (ruta protegida)
 */
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        // Filtramos directamente en la consulta y excluimos campos sensibles
        const users = await User.find({ deleted: false })
            .populate('company')
            .select('-password -verificationCode -verificationAttempts -deleted');

        res.status(200).json({ data: users });
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw AppError.internal('ERROR_GET_USERS');
    }
};

/**
 * Obtener los datos del usuario que tiene el token
 */
export const getMe = async (req: Request, res: Response) => {
    try {
        // El usuario ya viene del authMiddleware en req.user
        const user = req.user;
        if (!user) {
            throw AppError.unauthorized('USER_NOT_FOUND');
        }

        if (user.deleted === true) {
            throw AppError.notFound('USER_IS_SOFT_DELETED');

        }

        // Convertimos a objeto plano y quitamos lo que no queremos
        const userObj: any = user.toObject();
        delete userObj.password;
        delete userObj.verificationCode;
        delete userObj.verificationAttempts;
        delete userObj.deleted;

        res.status(200).json({ data: userObj });
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw AppError.internal('ERROR_GET_ME');
    }
};

/**
 * Refresh token — genera nuevo access token
 */
export const refreshTokenCtrl = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            throw AppError.badRequest('REFRESH_TOKEN_REQUIRED');

        }

        // Buscar en BD
        const storedToken = await RefreshToken.findOne({ token: refreshToken }).populate('user');

        if (!storedToken || !storedToken.isActive()) {
            throw AppError.unauthorized('INVALID_REFRESH_TOKEN');

        }

        // Mandamos el token viejo a la mierda
        storedToken.revoked = true;
        await storedToken.save();

        // Generar nueva pareja de tokens vinculando sus IDs
        const newRefreshTokenStr = generateRefreshToken();
        const newSession = await RefreshToken.create({
            token: newRefreshTokenStr,
            user: storedToken.user._id,
            expiresAt: getRefreshTokenExpiry(),
            createdByIp: req.ip
        });

        const newAccessToken = generateAccessToken(storedToken.user, newSession.id);

        res.status(200).json({ accessToken: newAccessToken, refreshToken: newRefreshTokenStr });
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw AppError.internal('ERROR_REFRESH_TOKEN');
    }
};

/**
 * Logout — revoca los 2 tokens (en realidad solo mata al refresh token pero el access token depende de él para existir)
 */
export const logoutUser = async (req: Request, res: Response) => {
    try {
        const { refreshToken }: any = req.body;

        if (!refreshToken) {
            throw AppError.badRequest('REFRESH_TOKEN_REQUIRED');

        }

        const storedToken = await RefreshToken.findOne({ token: refreshToken });

        if (!storedToken) {
            throw AppError.notFound('TOKEN_NOT_FOUND');

        }

        // Revocar
        storedToken.revoked = true;
        await storedToken.save();

        res.status(200).json({ message: 'SESSION_CLOSED' });
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw AppError.internal('ERROR_LOGOUT');
    }
};

/**
 * Cerrar todas las sesiones activas
 */
export const revokeAllTokens = async (req: Request, res: Response) => {
    try {
        if (!req.user) throw AppError.unauthorized('USER_NOT_FOUND');
        // req.user viene del authMiddleware
        await RefreshToken.updateMany(
            { user: req.user._id, revoked: false },
            { revoked: true }
        );

        res.status(200).json({ message: 'ALL_SESSIONS_CLOSED' });
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw AppError.internal('ERROR_REVOKE_ALL');
    }
};

/**
 * Eliminar usuario (soft delete o hard delete)
 * @param {boolean} soft - true = soft delete, false = hard delete
 */
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { soft } = req.query;
        const { id } = req.body;

        const user = await User.findById(id);
        if (!user) {
            throw AppError.notFound('USER_NOT_FOUND');

        }

        if (soft === 'true') {
            // Comprobar si ya estaba marcado como borrado
            if (user.deleted === true) {
                throw AppError.badRequest('USER_ALREADY_SOFT_DELETED');

            }

            // Soft delete
            user.deleted = true;
            await user.save();

            // Emitir evento de borrado (soft)
            eventService.emit('user:deleted', { _id: user._id, email: user.email, fullName: user.fullName, type: 'soft' });
            res.status(200).json({ message: 'USER_SOFT_DELETED' });
        } else {
            // Hard delete: intentamos borrarlo
            const result = await User.findByIdAndDelete(id);
            if (!result) {
                // Por si acaso alguien lo borró justo antes
                throw AppError.notFound('USER_NOT_FOUND');

            }

            // Emitir evento de borrado (hard)
            eventService.emit('user:deleted', { _id: id, email: result.email, fullName: result.fullName, type: 'hard' });
            res.status(200).json({ message: 'USER_HARD_DELETED' });
        }
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw AppError.internal('ERROR_DELETE_USER');
    }
};

// Solamente sirve para deshacer el soft delete
export const restoreUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.body;
        const user = await User.findById(id);

        if (!user) {
            throw AppError.notFound('USER_NOT_FOUND');

        }

        if (user.deleted === false) {
            throw AppError.badRequest('USER_ALREADY_RESTORED');

        }

        user.deleted = false;
        await user.save();
        res.status(200).json({ message: 'USER_RESTORED' });
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw AppError.internal('ERROR_RESTORE_USER');
    }
};

export const onboardUser = async (req: Request, res: Response) => {
    try {
        const { company: companyId } = req.body;
        const user = req.user;
        if (!user) throw AppError.unauthorized('USER_NOT_FOUND');

        let companyExists = null;
        if (companyId) {
            companyExists = await Company.findById(companyId);
        }

        // Si la compañía existe, metemos al usuario en ella en calidad de guest
        if (companyExists) {
            // Pero no podemos meter a gente en compañías freelance que no son suyas
            if (companyExists.isFreelance && companyExists.owner.toString() !== user._id.toString()) {
                throw AppError.badRequest('COMPANY_IS_FREELANCE');

            }
            user.company = companyExists._id;
            user.role = 'guest';
        } else {
            // Pero si no existe, creamos una nueva y le ponemos como admin
            const newCompany = await Company.create({
                name: user.name,
                cif: user.nif,
                address: user.address,
                isFreelance: true,
                owner: user._id
            });
            user.role = 'admin';
            user.company = newCompany._id;
        }

        await user.save();
        res.status(200).json({
            message: 'USER_ONBOARDED',
            data: {
                companyCreated: !companyExists
            }
        });
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw AppError.internal('ERROR_ONBOARD_USER');
    }
};

export const inviteUser = async (req: Request, res: Response) => {
    try {
        const { email, name, lastName, nif, address } = req.body;
        const user = req.user;
        if (!user) throw AppError.unauthorized('USER_NOT_FOUND');

        // Comprobamos que el admin que invita tiene realmente una compañía
        if (!user.company) {
            throw AppError.badRequest('USER_HAS_NO_COMPANY');

        }

        // Si el usuario existe, simplemente lo metemos en la compañía del invitador
        const userExists = await User.findOne({ email });
        if (userExists) {
            userExists.company = user.company._id;
            userExists.role = 'guest';
            await userExists.save();

            // Emitir evento de invitación
            eventService.emit('user:invited', userExists);
            res.status(200).json({ message: 'USER_INVITED', data: userExists });
            return;
        }

        // Si no, lo creamos
        const newUser = await User.create({
            email,
            name,
            lastName,
            nif,
            address,
            company: user.company._id,
            role: 'guest'
        });

        // Emitir evento de invitación (y creación)
        eventService.emit('user:invited', newUser);

        res.status(200).json({ message: 'USER_INVITED_AND_CREATED', data: newUser });
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw AppError.internal('ERROR_INVITE_USER');
    }
};
