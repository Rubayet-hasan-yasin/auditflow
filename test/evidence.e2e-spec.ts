import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('Evidence API (e2e)', () => {
  let app: INestApplication<App>;
  let factoryToken: string;
  let factory2Token: string;
  let buyerToken: string;
  let evidenceId: string;

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

    // Login as factory1
    const factory1Response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'factory1@auditflow.com',
        password: 'factory123',
      });
    factoryToken = factory1Response.body.accessToken;

    // Login as factory2
    const factory2Response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'factory2@auditflow.com',
        password: 'factory123',
      });
    factory2Token = factory2Response.body.accessToken;

    // Login as buyer
    const buyerResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'buyer@auditflow.com',
        password: 'buyer123',
      });
    buyerToken = buyerResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /evidence', () => {
    it('should create evidence as factory user', async () => {
      const response = await request(app.getHttpServer())
        .post('/evidence')
        .set('Authorization', `Bearer ${factoryToken}`)
        .send({
          name: 'ISO 9001 Certificate',
          docType: 'Certificate',
          expiry: '2026-12-31',
          notes: 'Initial certification',
        })
        .expect(201);

      expect(response.body).toHaveProperty('evidenceId');
      expect(response.body).toHaveProperty('versionId');
      evidenceId = response.body.evidenceId;
    });

    it('should reject evidence creation from buyer', async () => {
      await request(app.getHttpServer())
        .post('/evidence')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          name: 'Test Certificate',
          docType: 'Certificate',
          expiry: '2026-12-31',
        })
        .expect(403);
    });

    it('should reject evidence creation without auth', async () => {
      await request(app.getHttpServer())
        .post('/evidence')
        .send({
          name: 'Test Certificate',
          docType: 'Certificate',
          expiry: '2026-12-31',
        })
        .expect(401);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/evidence')
        .set('Authorization', `Bearer ${factoryToken}`)
        .send({
          name: 'Test Certificate',
          // Missing docType and expiry
        })
        .expect(400);
    });
  });

  describe('GET /evidence', () => {
    it('should return all evidence for factory', async () => {
      const response = await request(app.getHttpServer())
        .get('/evidence')
        .set('Authorization', `Bearer ${factoryToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should not allow buyer to access evidence list', async () => {
      await request(app.getHttpServer())
        .get('/evidence')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(403);
    });

    it('should only show factory-specific evidence', async () => {
      // Factory 1 should have evidence
      const factory1Response = await request(app.getHttpServer())
        .get('/evidence')
        .set('Authorization', `Bearer ${factoryToken}`)
        .expect(200);

      // Factory 2 might not have evidence yet
      const factory2Response = await request(app.getHttpServer())
        .get('/evidence')
        .set('Authorization', `Bearer ${factory2Token}`)
        .expect(200);

      // Ensure factories see different data
      const factory1Ids = factory1Response.body.map((e: any) => e.id);
      const factory2Ids = factory2Response.body.map((e: any) => e.id);

      // No overlap in evidence IDs
      const overlap = factory1Ids.filter((id: string) =>
        factory2Ids.includes(id),
      );
      expect(overlap.length).toBe(0);
    });
  });

  describe('POST /evidence/:evidenceId/versions', () => {
    it('should add new version to evidence', async () => {
      const response = await request(app.getHttpServer())
        .post(`/evidence/${evidenceId}/versions`)
        .set('Authorization', `Bearer ${factoryToken}`)
        .send({
          notes: 'Renewed certification',
          expiry: '2027-12-31',
        })
        .expect(201);

      expect(response.body).toHaveProperty('versionId');
      expect(response.body).toHaveProperty('versionNumber');
      expect(response.body.versionNumber).toBe(2);
    });

    it('should reject version creation from another factory', async () => {
      await request(app.getHttpServer())
        .post(`/evidence/${evidenceId}/versions`)
        .set('Authorization', `Bearer ${factory2Token}`)
        .send({
          notes: 'Attempt from wrong factory',
          expiry: '2027-12-31',
        })
        .expect(403);
    });

    it('should validate version data', async () => {
      await request(app.getHttpServer())
        .post(`/evidence/${evidenceId}/versions`)
        .set('Authorization', `Bearer ${factoryToken}`)
        .send({
          // Missing notes and expiry
        })
        .expect(400);
    });
  });

  describe('GET /evidence/:evidenceId', () => {
    it('should get specific evidence with versions', async () => {
      const response = await request(app.getHttpServer())
        .get(`/evidence/${evidenceId}`)
        .set('Authorization', `Bearer ${factoryToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', evidenceId);
      expect(response.body).toHaveProperty('versions');
      expect(Array.isArray(response.body.versions)).toBe(true);
      expect(response.body.versions.length).toBeGreaterThanOrEqual(2);
    });

    it('should reject access from another factory', async () => {
      await request(app.getHttpServer())
        .get(`/evidence/${evidenceId}`)
        .set('Authorization', `Bearer ${factory2Token}`)
        .expect(403);
    });
  });

  describe('DELETE /evidence/:evidenceId', () => {
    it('should delete evidence', async () => {
      await request(app.getHttpServer())
        .delete(`/evidence/${evidenceId}`)
        .set('Authorization', `Bearer ${factoryToken}`)
        .expect(200);

      // Verify it's deleted
      await request(app.getHttpServer())
        .get(`/evidence/${evidenceId}`)
        .set('Authorization', `Bearer ${factoryToken}`)
        .expect(403);
    });

    it('should not allow deletion from another factory', async () => {
      // Create evidence first
      const createResponse = await request(app.getHttpServer())
        .post('/evidence')
        .set('Authorization', `Bearer ${factoryToken}`)
        .send({
          name: 'Test Evidence',
          docType: 'Certificate',
          expiry: '2026-12-31',
        });

      const newEvidenceId = createResponse.body.evidenceId;

      // Try to delete from wrong factory
      await request(app.getHttpServer())
        .delete(`/evidence/${newEvidenceId}`)
        .set('Authorization', `Bearer ${factory2Token}`)
        .expect(403);
    });
  });
});
