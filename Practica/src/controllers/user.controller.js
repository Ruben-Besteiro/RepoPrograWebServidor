// src/controllers/user.controller.js
import { User } from '../models/user.model.js';
import { Company } from '../models/company.model.js';
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

        // Si el email ya existe, peta
        if (await User.findOne({ email: body.email })) {
            handleHttpError(res, 'EMAIL_ALREADY_EXISTS', 409);
            return;
        }

        // Cifrar contraseña
        const hashedPassword = await encrypt(password);

        // Crear usuario con contraseña cifrada
        const user = await User.create({ ...body, password: hashedPassword, verificationCode: Math.floor(100000 + Math.random() * 900000).toString(), verificationAttempts: 3, role: 'admin', status: 'pending', deleted: false });

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
 * Verificar usuario
 */
export const verifyUser = async (req, res) => {
    const { verificationCode } = req.body;
    const user = req.user;

    if (!user) {
        handleHttpError(res, 'USER_NOT_FOUND', 404);
        return;
    }

    // No se puede verificar 2 veces
    if (user.status === 'verified') {
        handleHttpError(res, 'USER_ALREADY_VERIFIED', 400);
        return;
    }

    // Esto se ejecuta a partir del 4º intento
    if (user.verificationAttempts <= 0) {
        handleHttpError(res, 'MAX_VERIFICATION_ATTEMPTS', 429);
        // Borrar el usuario
        await User.findByIdAndDelete(user._id);
        return;
    }

    // El código se guarda como string en la BD (aunque sea un número)
    if (user.verificationCode !== String(verificationCode)) {
        handleHttpError(res, 'INVALID_VERIFICATION_CODE', 401);
        user.verificationAttempts--;
        await user.save();
        return;
    }

    user.status = 'verified';
    user.verificationCode = null;
    user.verificationAttempts = 0;
    await user.save();

    res.status(200).json({ message: 'USER_VERIFIED' });
}

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
 * Actualizar usuario que tiene el token
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
export const updateUser = async (req, res) => {
    try {
        const { ...body } = req.body;
        const user = await User.findById(req.user._id).populate('company');
        if (!user) {
            handleHttpError(res, 'USER_NOT_FOUND', 404);
            return;
        }
        Object.assign(user, body);
        await user.save();

        // Volver a popular la compañía después de guardar para que la response sea correcta
        await user.populate('company');

        const userObj = user.toObject();
        delete userObj.password;
        delete userObj.verificationCode;
        delete userObj.verificationAttempts;
        delete userObj.deleted;
        res.status(200).json({ data: userObj });
    } catch (err) {
        handleHttpError(res, 'ERROR_UPDATE_USER', 500);
    }
}

/**
 * Obtener todos los usuarios (ruta protegida)
 */
export const getAllUsers = async (req, res) => {
    try {
        // Filtramos directamente en la consulta y excluimos campos sensibles
        const users = await User.find({ deleted: false })
            .populate('company')
            .select('-password -verificationCode -verificationAttempts -deleted');

        res.status(200).json({ data: users });
    } catch (err) {
        handleHttpError(res, 'ERROR_GET_USERS', 500);
    }
};

/**
 * Obtener los datos del usuario que tiene el token
 */
export const getMe = async (req, res) => {
    try {
        // El usuario ya viene del authMiddleware en req.user
        const user = req.user;

        if (user.deleted === true) {
            handleHttpError(res, 'USER_IS_SOFT_DELETED', 404);
            return;
        }

        // Convertimos a objeto plano y quitamos lo que no queremos
        const userObj = user.toObject();
        delete userObj.password;
        delete userObj.verificationCode;
        delete userObj.verificationAttempts;
        delete userObj.deleted;

        res.status(200).json({ data: userObj });
    } catch (err) {
        handleHttpError(res, 'ERROR_GET_ME', 500);
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

/**
 * Eliminar usuario (soft delete o hard delete)
 * @param {boolean} soft - true = soft delete, false = hard delete
 */
export const deleteUser = async (req, res) => {
    try {
        const { soft } = req.query;
        const { id } = req.body;

        const user = await User.findById(id);
        if (!user) {
            handleHttpError(res, 'USER_NOT_FOUND', 404);
            return;
        }

        if (soft === 'true') {
            // Comprobar si ya estaba marcado como borrado
            if (user.deleted === true) {
                handleHttpError(res, 'USER_ALREADY_SOFT_DELETED', 400);
                return;
            }

            // Soft delete
            user.deleted = true;
            await user.save();
            res.status(200).json({ message: 'USER_SOFT_DELETED' });
        } else {
            // Hard delete: intentamos borrarlo
            const result = await User.findByIdAndDelete(id);
            if (!result) {
                // Por si acaso alguien lo borró justo antes
                handleHttpError(res, 'USER_NOT_FOUND', 404);
                return;
            }
            res.status(200).json({ message: 'USER_HARD_DELETED' });
        }
    } catch (err) {
        handleHttpError(res, 'ERROR_DELETE_USER', 500);
    }
};

// Solamente sirve para deshacer el soft delete
export const restoreUser = async (req, res) => {
    try {
        const { id } = req.body;
        const user = await User.findById(id);

        if (!user) {
            handleHttpError(res, 'USER_NOT_FOUND', 404);
            return;
        }

        if (user.deleted === false) {
            handleHttpError(res, 'USER_ALREADY_RESTORED', 400);
            return;
        }

        user.deleted = false;
        await user.save();
        res.status(200).json({ message: 'USER_RESTORED' });
    } catch (err) {
        handleHttpError(res, 'ERROR_RESTORE_USER', 500);
    }
};

export const onboardUser = async (req, res) => {
    try {
        const { company: companyId } = req.body;
        const user = req.user;

        // Si la compañía existe, se la asignamos al usuario
        // Pero si no, la creamos con los datos del usuario
        let companyExists = null;
        if (companyId) {
            companyExists = await Company.findById(companyId);
        }

        if (companyExists) {
            user.company = companyExists._id;
            user.role = 'guest';
        } else {
            const newCompany = await Company.create({
                name: user.name,
                cif: user.nif,
                address: user.address,
                isFreelance: true,
                owner: user._id
            });
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
        handleHttpError(res, 'ERROR_ONBOARD_USER', 500);
    }
};

export const editLogo = async (req, res) => {
    try {
        const { logo } = req.body;
        const user = req.user;

        if (logo) user.company.logo = logo;

        await user.save();
        res.status(200).json({ message: 'LOGO_UPDATED' });
    } catch (err) {
        handleHttpError(res, 'ERROR_UPDATE_LOGO', 500);
    }
};
