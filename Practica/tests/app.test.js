import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer;
let app;

beforeAll(async () => {
    // Iniciar BD en memoria volátil 
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    process.env.DB_URI = mongoUri; 
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'supersecret';

    app = (await import('../src/app.js')).default;
    const dbConnect = (await import('../src/config/index.js')).default;
    await dbConnect(); // Conectar Mongoose explícitamente a la nueva URI en testing
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Integración y E2E Rutas', () => {
    it('debe responder 404 en rutas no definidas', async () => {
        const res = await request(app).get('/api/ruta-fantasma');
        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe('No se puede encontrar /api/ruta-fantasma en este servidor');
    });

    it('debe cargar el healthcheck OK', async () => {
        const res = await request(app).get('/health');
        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('ok');
    });

    // Pequeño flujo de Test E2E
    let accessToken;

    it('debe registrar un usuario real y enrutar a user.controller', async () => {
        const res = await request(app)
            .post('/api/user/register')
            .send({
                email: 'test@mail.com',
                password: 'password123',
                name: 'E2E',
                lastName: 'Test',
                nif: '12345678A'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.accessToken).toBeDefined();
        accessToken = res.body.accessToken;
    });

    it('debe denegar acceso si el token es falso', async () => {
        const res = await request(app)
            .get('/api/user/me')
            .set('Authorization', 'Bearer token_invalido_xd');

        expect(res.statusCode).toBe(401);
    });

    it('debe acceder al perfil protegido con el token válido tras verificar el usuario', async () => {
        // Obtenemos el code de la base de datos
        const dbUser = await mongoose.connection.collection('users').findOne({ email: 'test@mail.com' });
        
        await request(app)
            .put('/api/user/verify')
            .send({ verificationCode: dbUser.verificationCode })
            .set('Authorization', `Bearer ${accessToken}`);

        const res = await request(app)
            .get('/api/user/me')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.data.email).toBe('test@mail.com');
    });
    
    it('debe servir Swagger exitosamente', async () => {
        const res = await request(app).get('/api-docs/');
        expect(res.statusCode).toBe(200);
        expect(res.text).toContain('Swagger UI');
    });
});
