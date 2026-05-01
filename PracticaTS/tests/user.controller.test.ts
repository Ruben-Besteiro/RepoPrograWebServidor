import { jest, describe, expect, it, beforeEach } from '@jest/globals';
import { AppError } from '../src/utils/AppError.js';

jest.unstable_mockModule('../src/models/user.model.js', () => ({
    User: {
        create: jest.fn(),
        findOne: jest.fn(),
        findById: jest.fn(),
        findByIdAndUpdate: jest.fn(),
        find: jest.fn(),
        findByIdAndDelete: jest.fn(),
    }
}));

jest.unstable_mockModule('../src/models/company.model.js', () => ({
    Company: {
        findOne: jest.fn(),
        findById: jest.fn(),
        create: jest.fn()
    }
}));

jest.unstable_mockModule('../src/models/refreshToken.model.js', () => ({
    RefreshToken: {
        create: jest.fn(),
        findOne: jest.fn(),
        updateMany: jest.fn()
    }
}));

jest.unstable_mockModule('../src/utils/handleJwt.js', () => ({
    generateAccessToken: jest.fn().mockReturnValue('mockedAccessToken'),
    generateRefreshToken: jest.fn().mockReturnValue('mockedRefreshToken'),
    getRefreshTokenExpiry: jest.fn().mockReturnValue(new Date())
}));

jest.unstable_mockModule('../src/utils/handlePassword.js', () => ({
    encrypt: (jest.fn() as any).mockResolvedValue('hashedPassword'),
    compare: (jest.fn() as any).mockResolvedValue(true)
}));

jest.unstable_mockModule('../src/services/event.service.js', () => ({
    default: {
        emit: jest.fn()
    }
}));

const { registerUser, verifyUser, loginUser, updateUser, changePassword, getAllUsers, getMe, refreshTokenCtrl, logoutUser, revokeAllTokens, deleteUser, restoreUser, onboardUser, inviteUser } = await import('../src/controllers/user.controller.js');
const { User } = await import('../src/models/user.model.js');
const { RefreshToken } = await import('../src/models/refreshToken.model.js');
const { encrypt, compare } = await import('../src/utils/handlePassword.js');
const { Company } = await import('../src/models/company.model.js');
const { default: eventService } = await import('../src/services/event.service.js');

describe('User Controller', () => {
    let req: any;
    let res: any;

    beforeEach(() => {
        req = { body: {}, params: {}, query: {}, user: {} };
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        jest.clearAllMocks();
    });

    describe('registerUser', () => {
        it('debe abortar si el email ya existe', async () => {
            req.body = { email: 'test@test.com' };
            (User.findOne as any).mockResolvedValue({});
            try {
                await registerUser(req, res);
            } catch (e) {
                expect(e).toBeInstanceOf(AppError);
            }
        });

        it('debe registrar un usuario, hashear password y generar tokens', async () => {
            req.body = { email: 'new@test.com', password: '123' };
            (User.findOne as any).mockResolvedValue(null);
            const mockSavedUser = { _id: 'user1', email: 'new@test.com', password: 'hashed', toObject: () => ({ _id: 'user1' }) };
            (User.create as any).mockResolvedValue(mockSavedUser);
            (RefreshToken.create as any).mockResolvedValue({ _id: 'rt1' });

            await registerUser(req, res);

            expect(encrypt as jest.Mock).toHaveBeenCalledWith('123');
            expect(User.create as jest.Mock).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalled();
        });
    });

    describe('loginUser', () => {
        it('debe devolver tokens validando la password', async () => {
            req.body = { email: 'a@a.com', password: '123' };
            const mockUser = { _id: 'user1', password: 'hashed', toObject: () => ({ _id: 'user1' }) };
            (User.findOne as any).mockResolvedValue(mockUser);
            (compare as any).mockResolvedValue(true);
            (RefreshToken.create as any).mockResolvedValue({ _id: 'rt1' });

            await loginUser(req, res);

            expect(compare as jest.Mock).toHaveBeenCalledWith('123', 'hashed');
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('debe fallar si contraseña no coincide', async () => {
            req.body = { email: 'a@a.com', password: '123' };
            (User.findOne as any).mockResolvedValue({});
            (compare as any).mockResolvedValue(false);

            try {
                await loginUser(req, res);
            } catch (e) {
                expect(e).toBeInstanceOf(AppError);
            }
        });
    });

    describe('deleteUser', () => {
        it('debe hacer un soft delete', async () => {
            req.query = { soft: 'true' };
            req.body = { id: 'user1' };
            const mockUser = { _id: 'user1', deleted: false, save: jest.fn() };
            (User.findById as any).mockResolvedValue(mockUser);

            await deleteUser(req, res);

            expect(mockUser.deleted).toBe(true);
            expect(mockUser.save as jest.Mock).toHaveBeenCalled();
        });

        it('debe intentar hard delete', async () => {
            req.query = { soft: 'false' };
            req.body = { id: 'user1' };
            (User.findById as any).mockResolvedValue({});
            (User.findByIdAndDelete as any).mockResolvedValue({ _id: 'user1' });

            await deleteUser(req, res);

            expect(User.findByIdAndDelete as jest.Mock).toHaveBeenCalledWith('user1');
        });
    });

    describe('onboardUser', () => {
        it('debe vincular a compañía', async () => {
            req.body = { cif: 'comp1' };
            req.user = { _id: 'user1', save: jest.fn() };
            (Company.findOne as any).mockResolvedValue({ _id: 'comp1', isFreelance: false, owner: 'user1' });

            await onboardUser(req, res);

            expect(req.user.company).toBe('comp1');
            expect(req.user.role).toBe('guest');
        });

        it('debe crear compañía freelance', async () => {
            req.body = {};
            req.user = { _id: 'user1', save: jest.fn() };
            (Company.findById as any).mockResolvedValue(null);
            (Company.create as any).mockResolvedValue({ _id: 'newComp' });

            await onboardUser(req, res);

            expect(Company.create as jest.Mock).toHaveBeenCalled();
            expect(req.user.role).toBe('admin');
        });
    });

    describe('refreshTokenCtrl', () => {
        it('debe revocar y emitir tokens', async () => {
            req.body = { refreshToken: 'oldToken' };
            const storedToken: any = { token: 'oldToken', isActive: () => true, save: jest.fn(), user: { _id: 'u1' }, revoked: false };
            (RefreshToken.findOne as any).mockReturnValue({ populate: (jest.fn() as any).mockResolvedValue(storedToken) });
            (RefreshToken.create as any).mockResolvedValue({ _id: 'newId' });

            await refreshTokenCtrl(req, res);

            expect(storedToken.revoked).toBe(true);
        });

        it('debe fallar si el refreshToken no es válido', async () => {
            req.body = { refreshToken: 'invalidToken' };
            (RefreshToken.findOne as any).mockReturnValue({ populate: (jest.fn() as any).mockResolvedValue(null) });

            await expect(refreshTokenCtrl(req, res)).rejects.toThrow('INVALID_REFRESH_TOKEN');
        });
    });

    describe('getAllUsers', () => {
        it('devuelve todos exceptuando borrados', async () => {
            (User.find as any).mockReturnValue({ populate: (jest.fn() as any).mockReturnValue({ select: (jest.fn() as any).mockResolvedValue([{ name: 'Test' }]) }) });
            await getAllUsers(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('verifyUser', () => {
        it('falla si ya esta verificado', async () => {
            req.user = { status: 'verified' };
            try { await verifyUser(req, res); } catch (e) { expect(e).toBeInstanceOf(AppError); }
        });

        it('excede intentos y borra', async () => {
            req.user = { _id: 'user1', status: 'pending', verificationAttempts: 2, save: jest.fn() };
            (User.findByIdAndDelete as any).mockResolvedValue({});
            (eventService as any).emit.mockReturnValue(true);
            try { await verifyUser(req, res); } catch (e) { expect(e).toBeInstanceOf(AppError); }
        });

        it('verifica con éxito', async () => {
            req.body = { verificationCode: '123' };
            req.user = { _id: 'user1', verificationCode: '123', status: 'pending', verificationAttempts: 3, save: jest.fn() };
            await verifyUser(req, res);
            expect(req.user.status).toBe('verified');
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('getMe', () => {
        it('devuelve datos', async () => {
            req.user = { deleted: false, toObject: () => ({ name: 'test' }) };
            await getMe(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('falla si esta borrado soft', async () => {
            req.user = { deleted: true };
            try { await getMe(req, res); } catch (e) { expect(e).toBeInstanceOf(AppError); }
        });
    });

    describe('updateUser', () => {
        it('actualiza datos', async () => {
            req.body = { name: 'New' };
            req.user = { _id: 'u1' };
            const mockUpdateResult = { save: jest.fn(), populate: jest.fn(), toObject: () => ({}) };
            (User.findById as any).mockReturnValue({ populate: (jest.fn() as any).mockResolvedValue(mockUpdateResult) });
            await updateUser(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('changePassword', () => {
        it('cambia contraseña', async () => {
            req.body = { password: 'new', oldPassword: 'old' };
            req.user = { _id: 'u1' };
            (User.findById as any).mockResolvedValue({ password: 'oldHashed', save: jest.fn() });
            (compare as any).mockResolvedValue(true);
            await changePassword(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('logoutUser', () => {
        it('revoca token actual', async () => {
            req.body = { refreshToken: '123' };
            const mockToken = { revoked: false, save: jest.fn() };
            (RefreshToken.findOne as any).mockResolvedValue(mockToken);
            await logoutUser(req, res);
            expect(mockToken.revoked).toBe(true);
        });
    });

    describe('revokeAllTokens', () => {
        it('revoca todos', async () => {
            req.user = { _id: 'u1' };
            (RefreshToken.updateMany as any).mockResolvedValue({});
            await revokeAllTokens(req, res);
            expect(RefreshToken.updateMany as jest.Mock).toHaveBeenCalled();
        });
    });

    describe('restoreUser', () => {
        it('restaura usuario', async () => {
            req.body = { id: 'u1' };
            (User.findById as any).mockResolvedValue({ deleted: true, save: jest.fn() });
            await restoreUser(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('falla si ya está restaurado', async () => {
            req.body = { id: 'u1' };
            (User.findById as any).mockResolvedValue({ deleted: false });
            await expect(restoreUser(req, res)).rejects.toThrow('USER_ALREADY_RESTORED');
        });
    });

    describe('onboardUser', () => {
        it('falla si es freelance de otro', async () => {
            req.user = { _id: 'u1' };
            req.body = { cif: 'c1' };
            (Company.findOne as any).mockResolvedValue({ _id: 'c1', isFreelance: true, owner: 'u2' });
            await expect(onboardUser(req, res)).rejects.toThrow('COMPANY_IS_FREELANCE');
        });

        it('crea nueva compañía si no existe', async () => {
            req.user = { _id: 'u1', name: 'N', nif: '1', address: 'A', save: jest.fn() };
            req.body = {};
            (Company.create as any).mockResolvedValue({ _id: 'new' });
            await onboardUser(req, res);
            expect(Company.create).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('inviteUser', () => {
        it('invita nuevo usuario', async () => {
            req.user = { company: { _id: 'c1' } };
            req.body = { email: 'a@a' };
            (User.findOne as any).mockResolvedValue(null);
            (User.create as any).mockResolvedValue({});
            await inviteUser(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('falla si el admin no tiene compañía', async () => {
            req.user = { company: null };
            await expect(inviteUser(req, res)).rejects.toThrow('USER_HAS_NO_COMPANY');
        });

        it('invita usuario que ya existe', async () => {
            req.user = { company: { _id: 'c1' } };
            req.body = { email: 'exists@mail.com' };
            const existingUser = { _id: 'uEx', save: jest.fn() };
            (User.findOne as any).mockResolvedValue(existingUser);
            await inviteUser(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(existingUser.save).toHaveBeenCalled();
        });
    });
});
