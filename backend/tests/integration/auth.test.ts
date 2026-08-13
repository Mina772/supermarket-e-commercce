import request from 'supertest';
import { createApp } from '../../src/app';

const app = createApp();

describe('Auth flow (integration)', () => {
  const user = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test.user@example.com',
    password: 'StrongPass1',
  };

  it('registers a new user and returns tokens', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(user);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe(user.email);
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('rejects duplicate registration', async () => {
    await request(app).post('/api/v1/auth/register').send(user);
    const res = await request(app).post('/api/v1/auth/register').send(user);
    expect(res.status).toBe(409);
  });

  it('logs in with valid credentials and rejects invalid ones', async () => {
    await request(app).post('/api/v1/auth/register').send(user);
    const good = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: user.password });
    expect(good.status).toBe(200);

    const bad = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: 'wrongpass' });
    expect(bad.status).toBe(401);
  });

  it('returns the current user with a bearer token', async () => {
    const reg = await request(app).post('/api/v1/auth/register').send(user);
    const token = reg.body.data.accessToken as string;
    const me = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe(user.email);
  });

  it('rejects protected route without token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});
