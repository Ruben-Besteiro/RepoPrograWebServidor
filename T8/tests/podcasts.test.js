import request from 'supertest';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';

// Force test environment
process.env.DB_NAME = 't8_test';
process.env.NODE_ENV = 'test';
process.env.PORT = '0';

const { default: app } = await import('../src/app.js');
const { default: User } = await import('../src/models/user.model.js');
const { default: Podcast } = await import('../src/models/podcast.model.js');

describe('Podcasts Endpoints', () => {

    let adminToken, userToken, adminUser, normalUser;

    beforeAll(async () => {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.DB_URI, { dbName: 't8_test' });
        }

        // Cleanup
        await User.deleteMany({});
        await Podcast.deleteMany({});

        // Create Admin
        const adminData = {
            name: 'Admin User',
            email: 'admin@test.com',
            password: 'password123',
            age: 30,
            role: 'admin'
        };
        const regAdmin = await request(app).post('/api/auth/register').send(adminData);
        adminToken = regAdmin.body.token;
        adminUser = regAdmin.body.user;

        // Create Normal User
        const userData = {
            name: 'Normal User',
            email: 'user@test.com',
            password: 'password123',
            age: 25,
            role: 'user'
        };
        const regUser = await request(app).post('/api/auth/register').send(userData);
        userToken = regUser.body.token;
        normalUser = regUser.body.user;
    });

    afterAll(async () => {
        await User.deleteMany({});
        await Podcast.deleteMany({});
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        await Podcast.deleteMany({});
    });

    describe('GET /api/podcasts', () => {
        it('✓ GET /api/podcasts → 200 con array (solo publicados)', async () => {
            // Create one published and one unpublished
            await Podcast.create({
                title: 'Published Podcast',
                description: 'Content description for published',
                category: 'tech',
                duration: 120,
                published: true,
                author: normalUser._id
            });

            await Podcast.create({
                title: 'Draft Podcast',
                description: 'Content description for draft',
                category: 'news',
                duration: 180,
                published: false,
                author: normalUser._id
            });

            const res = await request(app).get('/api/podcasts');

            expect(res.statusCode).toBe(200);
            expect(res.body.docs).toBeDefined();
            expect(Array.isArray(res.body.docs)).toBe(true);
            expect(res.body.docs.length).toBe(1);
            expect(res.body.docs[0].title).toBe('Published Podcast');
            expect(res.body.totalDocs).toBe(1);
        });
    });

    describe('POST /api/podcasts', () => {
        const newPodcast = {
            title: 'New Podcast',
            description: 'This is a test podcast description',
            category: 'science',
            duration: 300
        };

        it('✓ POST /api/podcasts → 201 con podcast creado (requiere token)', async () => {
            const res = await request(app)
                .post('/api/podcasts')
                .set('Authorization', `Bearer ${userToken}`)
                .send(newPodcast);

            expect(res.statusCode).toBe(201);
            expect(res.body.title).toBe(newPodcast.title);
        });

        it('✓ POST /api/podcasts → 401 sin token', async () => {
            const res = await request(app)
                .post('/api/podcasts')
                .send(newPodcast);

            expect(res.statusCode).toBe(401);
        });
    });

    describe('DELETE /api/podcasts/:id', () => {
        it('✓ DELETE /api/podcasts/:id → 200 solo para admin', async () => {
            const podcast = await Podcast.create({
                title: 'To Delete',
                description: 'To be deleted by admin',
                category: 'comedy',
                duration: 600,
                author: normalUser._id
            });

            const res = await request(app)
                .delete(`/api/podcasts/${podcast._id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
        });

        it('✓ DELETE /api/podcasts/:id → 403 para user normal', async () => {
            const podcast = await Podcast.create({
                title: 'Stay Safe',
                description: 'User cannot delete this',
                category: 'history',
                duration: 600,
                author: adminUser._id
            });

            const res = await request(app)
                .delete(`/api/podcasts/${podcast._id}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(403);
        });
    });

    describe('GET /api/podcasts/admin/all', () => {
        it('✓ GET /api/podcasts/admin/all → 200 solo para admin', async () => {
            const res = await request(app)
                .get('/api/podcasts/admin/all')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
        });

        it('✓ GET /api/podcasts/admin/all → 403 para user normal', async () => {
            const res = await request(app)
                .get('/api/podcasts/admin/all')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(403);
        });
    });
});
