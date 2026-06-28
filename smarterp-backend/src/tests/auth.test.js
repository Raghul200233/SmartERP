const request = require('supertest');
const app = require('../src/app');

describe('Authentication API', () => {
    let authToken;
    let refreshToken;
    let userId;

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
        expect(res.body.data).toHaveProperty('refreshToken');
        expect(res.body.data.user).toHaveProperty('email', 'test@example.com');
        
        userId = res.body.data.user.id;
        authToken = res.body.data.accessToken;
        refreshToken = res.body.data.refreshToken;
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
        expect(res.body.data).toHaveProperty('refreshToken');
        expect(res.body.data.user).toHaveProperty('email', 'test@example.com');
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
        expect(res.body.message).toBe('Invalid credentials');
    });

    test('Should get current user with valid token', async () => {
        const res = await request(app)
            .get('/api/v1/auth/me')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.user).toHaveProperty('email', 'test@example.com');
    });

    test('Should refresh token', async () => {
        const res = await request(app)
            .post('/api/v1/auth/refresh-token')
            .send({
                refreshToken: refreshToken
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('accessToken');
        expect(res.body.data).toHaveProperty('refreshToken');
    });

    test('Should change password', async () => {
        const res = await request(app)
            .post('/api/v1/auth/change-password')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                currentPassword: 'Test123456!',
                newPassword: 'NewPassword123!'
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('Password changed successfully');
    });

    test('Should logout', async () => {
        const res = await request(app)
            .post('/api/v1/auth/logout')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('Logout successful');
    });

    test('Should fail to get user after logout', async () => {
        const res = await request(app)
            .get('/api/v1/auth/me')
            .set('Authorization', `Bearer ${authToken}`);

        // This might succeed if token is still valid, but should fail after logout implementation
        // The test should be updated when token blacklisting is implemented
        expect(res.status).toBe(401);
    });
});