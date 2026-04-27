import { describe, expect, it, beforeAll } from '@jest/globals';
import { AppError } from '../src/utils/AppError.js';

describe('Utils: Password and JWT', () => {
    let encrypt: (password: string) => Promise<string>;
    let compare: (password: string, hash: string) => Promise<boolean>;
    let generateAccessToken: (user: any, activeToken: string) => string;
    let generateRefreshToken: () => string;
    let getRefreshTokenExpiry: () => Date;
    let verifyAccessToken: (token: string) => any;

    beforeAll(async () => {
        process.env.JWT_SECRET = 'test_secret';
        process.env.JWT_EXPIRATION = '1h';

        const pwdModule = await import('../src/utils/handlePassword.js');
        encrypt = pwdModule.encrypt;
        compare = pwdModule.compare;

        const jwtModule = await import('../src/utils/handleJwt.js');
        generateAccessToken = jwtModule.generateAccessToken;
        generateRefreshToken = jwtModule.generateRefreshToken;
        getRefreshTokenExpiry = jwtModule.getRefreshTokenExpiry;
        verifyAccessToken = jwtModule.verifyAccessToken;
    });

    describe('handlePassword.js', () => {
        it('debería encriptar la contraseña correctamente', async () => {
            const password = 'mySecretPassword123';
            const hash = await encrypt(password);
            expect(hash).toBeDefined();
            expect(hash).not.toBe(password);
            expect(typeof hash).toBe('string');
        });

        it('debería comparar correctamente el password y el hash', async () => {
            const password = 'mySecretPassword123';
            const hash = await encrypt(password);
            const isMatch = await compare(password, hash);
            expect(isMatch).toBe(true);
        });

        it('debería rechazar comparaciones erroneas', async () => {
            const hash = await encrypt('realPassword');
            const isMatch = await compare('wrongPassword', hash);
            expect(isMatch).toBe(false);
        });
    });

    describe('handleJwt.js', () => {
        it('generateAccessToken debería retornar un token válido', () => {
            const user = { _id: '123', email: 'test@a.com', role: 'admin' };
            const activeToken = 'fakeactive';
            const token = generateAccessToken(user, activeToken);

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.').length).toBe(3); // Header.Payload.Signature
        });

        it('generateRefreshToken debería retornar un hex aleatorio', () => {
            const token = generateRefreshToken();
            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
        });

        it('getRefreshTokenExpiry debería retornar una fecha futura', () => {
            const date = getRefreshTokenExpiry();
            expect(date).toBeInstanceOf(Date);
            expect(date.getTime()).toBeGreaterThan(Date.now());
        });

        it('verifyAccessToken debería procesar el token correctamente', () => {
            const user = { _id: '123', email: 'a@a.com', role: 'guest' };
            const token = generateAccessToken(user, 'activeSession123');

            const decoded = verifyAccessToken(token);
            expect(decoded._id).toBe('123');
            expect(decoded.sessionId).toBe('activeSession123');
        });

        it('verifyAccessToken debería lanzar error si es inválido', () => {
            const badToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature';
            expect(verifyAccessToken(badToken)).toBeNull();
        });
    });
});
