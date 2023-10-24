import request from 'supertest';
import { app } from '../../app';

it('Returns a 201 on succesful signup', async () => {
    return request(app)
        .post('/api/users/signup')
        .send({
            email: 'test@test.com',
            password: 'password',
        })
        .expect(201);
});

it('Returns a 400 with an invalid email', async () => {
    return request(app)
        .post('/api/users/signup')
        .send({
            email: 'dsadsddaf',
            password: 'password',
        })
        .expect(400);
});

it('Returns a 400 with an invalid password', async () => {
    return request(app)
        .post('/api/users/signup')
        .send({
            email: 'test@test.com',
            password: 'p',
        })
        .expect(400);
});

it('Returns a 400 with missing email and password', async () => {
    await request(app)
        .post('/api/users/signup')
        .send({
            email: "test@test.com"
        })
        .expect(400);

    await request(app)
        .post('/api/users/signup')
        .send({
            password: 'password'
        })
        .expect(400);

    return request(app)
        .post('/api/users/signup')
        .send({})
        .expect(400);
});

it('disallows duplicate email', async () => {
    await request(app)
        .post('/api/users/signup')
        .send({
            email: 'test@test.com',
            password: 'password',
        })
        .expect(201);

    return request(app)
        .post('/api/users/signup')
        .send({
            email: 'test@test.com',
            password: 'password',
        })
        .expect(400);
});

it('sets a cookie after succesful signup', async () => {
    const response = await request(app)
        .post('/api/users/signup')
        .send({
            email: 'test@test.com',
            password: 'password',
        })
        .expect(201);

    expect(response.get('Set-Cookie')).toBeDefined();
})