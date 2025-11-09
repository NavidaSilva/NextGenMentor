const request = require('supertest');
const app = require('../app');
///$ npm test
//Simulates a GET request to /auth/google with no role query param.
describe('GET /auth/google', () => {
  it('should return 400 if role is missing', async () => {
    const res = await request(app).get('/auth/google');
    expect(res.status).toBe(400);
    expect(res.text).toBe('Invalid role');
  });

//Simulates a GET request to /auth/google?role=admin (an unsupported role).
  it('should return 400 if role is invalid', async () => {
    const res = await request(app).get('/auth/google?role=admin');
    expect(res.status).toBe(400);
    expect(res.text).toBe('Invalid role');
  });

  //Simulates GET request with role=mentee.
  it('should redirect to Google for mentee role', async () => {
    const res = await request(app).get('/auth/google?role=mentee');
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('https://accounts.google.com');
  });

  //Simulates GET request with role=mentor.
  it('should redirect to Google for mentor role', async () => {
    const res = await request(app).get('/auth/google?role=mentor');
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('https://accounts.google.com');
  });
});

describe('GET /auth/google-login', () => {
    //Tests that calling /auth/google-login redirects to Google OAuth
  it('should redirect to Google with login state', async () => {
    const res = await request(app).get('/auth/google-login');
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('https://accounts.google.com');
    expect(res.headers.location).toContain('state=login');
  });
});
