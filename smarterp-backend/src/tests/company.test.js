const request = require('supertest');
const app = require('../src/app');

describe('Company Management API', () => {
    let authToken;
    let companyId;
    let userId;

    beforeAll(async () => {
        // Register and login a user
        const registerRes = await request(app)
            .post('/api/v1/auth/register')
            .send({
                email: 'companytest@example.com',
                password: 'Test123456!',
                full_name: 'Company Test User'
            });

        authToken = registerRes.body.data.accessToken;
        userId = registerRes.body.data.user.id;
    });

    test('Should create a new company', async () => {
        const res = await request(app)
            .post('/api/v1/companies')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                name: 'Test Company',
                address: '123 Test Street, Test City',
                gst_number: '22AAAAA0000A1Z5',
                financial_year: '2024-2025',
                state: 'Test State',
                mobile: '9876543210',
                email: 'test@company.com',
                contact_person: 'John Doe'
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('id');
        expect(res.body.data.name).toBe('Test Company');
        
        companyId = res.body.data.id;
    });

    test('Should get all companies', async () => {
        const res = await request(app)
            .get('/api/v1/companies')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeInstanceOf(Array);
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    test('Should get company by ID', async () => {
        const res = await request(app)
            .get(`/api/v1/companies/${companyId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('id', companyId);
        expect(res.body.data.name).toBe('Test Company');
    });

    test('Should update company', async () => {
        const res = await request(app)
            .put(`/api/v1/companies/${companyId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                name: 'Updated Test Company',
                state: 'Updated State'
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe('Updated Test Company');
        expect(res.body.data.state).toBe('Updated State');
    });

    test('Should set default company', async () => {
        const res = await request(app)
            .post(`/api/v1/companies/${companyId}/default`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('id', companyId);
    });

    test('Should get default company', async () => {
        const res = await request(app)
            .get('/api/v1/companies/default')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('id', companyId);
    });

    test('Should search companies', async () => {
        const res = await request(app)
            .get('/api/v1/companies/search?q=Test')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeInstanceOf(Array);
    });

    test('Should get company stats', async () => {
        const res = await request(app)
            .get(`/api/v1/companies/${companyId}/stats`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('ledgers');
        expect(res.body.data).toHaveProperty('customers');
        expect(res.body.data).toHaveProperty('suppliers');
        expect(res.body.data).toHaveProperty('stockItems');
    });

    test('Should delete company', async () => {
        const res = await request(app)
            .delete(`/api/v1/companies/${companyId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('Company deleted successfully');
    });

    test('Should fail to get deleted company', async () => {
        const res = await request(app)
            .get(`/api/v1/companies/${companyId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
    });
});