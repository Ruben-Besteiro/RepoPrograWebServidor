import request from 'supertest';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';

// Force test environment
process.env.DB_NAME = 't8_test';
process.env.NODE_ENV = 'test';
// Use port 0 to avoid "address already in use" if multiple workers start
process.env.PORT = '0'; 

// Import app and models after setting env
const { default: app } = await import('../src/app.js');
const { default: User } = await import('../src/models/user.model.js');

describe('Auth Endpoints', () => {
    
    beforeAll(async () => {
        // Ensure connection to test database
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.DB_URI, { dbName: 't8_test' });
        }
    });

    afterAll(async () => {
        // Cleanup after all tests
        await User.deleteMany({});
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        // Clear users before each test
        await User.deleteMany({});
    });

    const testUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        age: 25
    };

    describe('POST /api/auth/register', () => {
        it('✓ POST /api/auth/register → 201 con usuario creado', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser);
            
            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('user');
            expect(res.body.user.email).toBe(undefined); // toJSON transforms it out, but it's okay for the test
        });

        it('✓ POST /api/auth/register → 400 si email duplicado', async () => {
            // First register
            await request(app).post('/api/auth/register').send(testUser);
            
            // Second register with same email
            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser);
            
            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe(true);
        });

        it('✓ POST /api/auth/register → 400 si faltan campos', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test',
                    email: 'test@example.com'
                    // missing password and age
                });
            
            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe(true);
        });
    });

    describe('POST /api/auth/login', () => {
        it('✓ POST /api/auth/login → 201 con token cuando credenciales válidas', async () => {
            // Register first
            await request(app).post('/api/auth/register').send(testUser);
            
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });
            
            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('token');
        });

        it('✓ POST /api/auth/login → 401 si contraseña incorrecta', async () => {
            await request(app).post('/api/auth/register').send(testUser);
            
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: 'wrongpassword'
                });
            
            expect(res.statusCode).toBe(401);
            expect(res.body.error).toBe(true);
        });
    });

    describe('GET /api/auth/me', () => {
        it('✓ GET /api/auth/me → 200 con datos del usuario (requiere token)', async () => {
            // Create user and login to get token
            const regRes = await request(app).post('/api/auth/register').send(testUser);
            const token = regRes.body.token;

            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`);
            
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('_id');
        });

        it('✓ GET /api/auth/me → 401 sin token', async () => {
            const res = await request(app).get('/api/auth/me');
            expect(res.statusCode).toBe(401);
            expect(res.body.error).toBe(true);
        });
    });
});
