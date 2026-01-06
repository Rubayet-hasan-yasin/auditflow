import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { UserRole } from './../src/user/entities/user.entity';

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    const uniqueEmail = `test-${Date.now()}@example.com`;

    it('should register a new buyer user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: uniqueEmail,
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          role: UserRole.BUYER,
        })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(uniqueEmail);
      expect(response.body.user.role).toBe(UserRole.BUYER);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should register a factory user with factoryId', async () => {
      const factoryEmail = `factory-${Date.now()}@example.com`;

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: factoryEmail,
          password: 'password123',
          firstName: 'Factory',
          lastName: 'User',
          role: UserRole.FACTORY,
          factoryId: 'F001',
        })
        .expect(201);

      expect(response.body.user.role).toBe(UserRole.FACTORY);
      expect(response.body.user.factoryId).toBe('F001');
    });

    it('should fail with duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: uniqueEmail,
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          role: UserRole.BUYER,
        })
        .expect(409);
    });

    it('should fail with invalid email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          role: UserRole.BUYER,
        })
        .expect(400);
    });

    it('should fail with short password', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'short@example.com',
          password: '123',
          firstName: 'Test',
          lastName: 'User',
          role: UserRole.BUYER,
        })
        .expect(400);
    });

    it('should fail for factory without factoryId', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `factory-no-id-${Date.now()}@example.com`,
          password: 'password123',
          firstName: 'Factory',
          lastName: 'User',
          role: UserRole.FACTORY,
        })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    const loginEmail = `login-test-${Date.now()}@example.com`;
    const loginPassword = 'password123';

    beforeAll(async () => {
      // Register a user to test login
      await request(app.getHttpServer()).post('/auth/register').send({
        email: loginEmail,
        password: loginPassword,
        firstName: 'Login',
        lastName: 'Test',
        role: UserRole.BUYER,
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: loginEmail,
          password: loginPassword,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(loginEmail);
    });

    it('should fail with invalid email', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: loginPassword,
        })
        .expect(401);
    });

    it('should fail with invalid password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: loginEmail,
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });

  describe('GET /auth/profile', () => {
    let accessToken: string;

    beforeAll(async () => {
      const profileEmail = `profile-${Date.now()}@example.com`;

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: profileEmail,
          password: 'password123',
          firstName: 'Profile',
          lastName: 'Test',
          role: UserRole.BUYER,
        });

      accessToken = response.body.accessToken;
    });

    it('should return user profile with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('firstName');
      expect(response.body).toHaveProperty('lastName');
      expect(response.body).toHaveProperty('role');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should fail without token', async () => {
      await request(app.getHttpServer()).get('/auth/profile').expect(401);
    });

    it('should fail with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
