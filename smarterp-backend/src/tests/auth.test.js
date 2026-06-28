const request = require('supertest');
const app = require('../src/app');

describe('Authentication API', () => {
    test('Should register a new user', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({
                email: 'test@example.com',
                password: 'Test123456!',
                full_name: 'Test User'
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('accessToken');
        expect(res.body.data.user).toHaveProperty('email', 'test@example.com');
    });

    test('Should login with valid credentials', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: 'test@example.com',
                password: 'Test123456!'
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('accessToken');
    });

    test('Should fail login with invalid credentials', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: 'test@example.com',
                password: 'WrongPassword'
            });

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
    });
});