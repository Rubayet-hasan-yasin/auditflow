import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Request Workflow (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let buyerToken: string;
  let factoryToken: string;
  let factory2Token: string;
  let buyerId: string;
  let factoryId: string;
  let evidenceId: string;
  let versionId: string;
  let requestId: string;
  let itemId: string;

  const timestamp = Date.now();
  const buyerEmail = `buyer-${timestamp}@example.com`;
  const factory1Email = `factory1-${timestamp}@example.com`;
  const factory2Email = `factory2-${timestamp}@example.com`;

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
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  describe('Setup - Register Users', () => {
    it('should register a buyer', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: buyerEmail,
          password: 'Password123!',
          firstName: 'John',
          lastName: 'Buyer',
          role: 'buyer',
        })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user.role).toBe('buyer');
      buyerToken = response.body.accessToken;
      buyerId = response.body.user.id;
    });

    it('should register factory F001', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: factory1Email,
          password: 'Password123!',
          firstName: 'Jane',
          lastName: 'Factory',
          role: 'factory',
          factoryId: 'F001',
        })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user.role).toBe('factory');
      expect(response.body.user.factoryId).toBe('F001');
      factoryToken = response.body.accessToken;
      factoryId = response.body.user.id;
    });

    it('should register factory F002', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: factory2Email,
          password: 'Password123!',
          firstName: 'Bob',
          lastName: 'Factory2',
          role: 'factory',
          factoryId: 'F002',
        })
        .expect(201);

      factory2Token = response.body.accessToken;
    });
  });

  describe('Setup - Create Evidence', () => {
    it('should create evidence for factory F001', async () => {
      const response = await request(app.getHttpServer())
        .post('/evidence')
        .set('Authorization', `Bearer ${factoryToken}`)
        .send({
          name: 'ISO 9001 Certificate',
          docType: 'Certificate',
          expiry: '2026-12-31',
          notes: 'Test certificate',
        })
        .expect(201);

      expect(response.body).toHaveProperty('evidenceId');
      expect(response.body).toHaveProperty('versionId');
      evidenceId = response.body.evidenceId;
      versionId = response.body.versionId;
    });
  });

  describe('POST /requests - Create Request', () => {
    it('should allow buyer to create a request', async () => {
      const response = await request(app.getHttpServer())
        .post('/requests')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          factoryId: 'F001',
          title: 'Q1 2025 Compliance Evidence',
          items: [
            { docType: 'Certificate' },
            { docType: 'Test Report' },
          ],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.buyerId).toBe(buyerId);
      expect(response.body.factoryId).toBe('F001');
      expect(response.body.title).toBe('Q1 2025 Compliance Evidence');
      expect(response.body.status).toBe('OPEN');
      expect(response.body.items).toHaveLength(2);
      expect(response.body.items[0].status).toBe('PENDING');
      expect(response.body.items[1].status).toBe('PENDING');

      requestId = response.body.id;
      itemId = response.body.items[0].id;
    });

    it('should reject request without authentication', async () => {
      await request(app.getHttpServer())
        .post('/requests')
        .send({
          factoryId: 'F001',
          title: 'Test',
          items: [{ docType: 'Certificate' }],
        })
        .expect(401);
    });

    it('should reject request from factory role', async () => {
      await request(app.getHttpServer())
        .post('/requests')
        .set('Authorization', `Bearer ${factoryToken}`)
        .send({
          factoryId: 'F001',
          title: 'Test',
          items: [{ docType: 'Certificate' }],
        })
        .expect(403);
    });

    it('should validate request data', async () => {
      await request(app.getHttpServer())
        .post('/requests')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          factoryId: 'F001',
          // Missing title
          items: [{ docType: 'Certificate' }],
        })
        .expect(400);
    });

    it('should require at least one item', async () => {
      await request(app.getHttpServer())
        .post('/requests')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          factoryId: 'F001',
          title: 'Test',
          items: [], // Empty items array
        })
        .expect(400);
    });
  });

  describe('GET /requests - Buyer Views Requests', () => {
    it('should allow buyer to view their own requests', async () => {
      const response = await request(app.getHttpServer())
        .get('/requests')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('items');
      expect(response.body[0].buyerId).toBe(buyerId);
    });

    it('should reject request without authentication', async () => {
      await request(app.getHttpServer()).get('/requests').expect(401);
    });

    it('should reject request from factory role', async () => {
      await request(app.getHttpServer())
        .get('/requests')
        .set('Authorization', `Bearer ${factoryToken}`)
        .expect(403);
    });
  });

  describe('GET /factory/requests - Factory Views Requests', () => {
    it('should allow factory to view their assigned requests', async () => {
      const response = await request(app.getHttpServer())
        .get('/factory/requests')
        .set('Authorization', `Bearer ${factoryToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].factoryId).toBe('F001');
      expect(response.body[0]).toHaveProperty('items');
    });

    it('should only show requests for factory F001', async () => {
      const response = await request(app.getHttpServer())
        .get('/factory/requests')
        .set('Authorization', `Bearer ${factory2Token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // Factory F002 should not see F001's requests
      const hasF001Requests = response.body.some((req) => req.factoryId === 'F001');
      expect(hasF001Requests).toBe(false);
    });

    it('should reject request without authentication', async () => {
      await request(app.getHttpServer()).get('/factory/requests').expect(401);
    });

    it('should reject request from buyer role', async () => {
      await request(app.getHttpServer())
        .get('/factory/requests')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(403);
    });
  });

  describe('POST /requests/:requestId/items/:itemId/fulfill - Fulfill Item', () => {
    it('should allow factory to fulfill an item', async () => {
      const response = await request(app.getHttpServer())
        .post(`/requests/${requestId}/items/${itemId}/fulfill`)
        .set('Authorization', `Bearer ${factoryToken}`)
        .send({
          evidenceId: evidenceId,
          versionId: versionId,
        })
        .expect(201);

      expect(response.body).toHaveProperty('request');
      expect(response.body).toHaveProperty('item');
      expect(response.body.item.status).toBe('FULFILLED');
      expect(response.body.item.evidenceId).toBe(evidenceId);
      expect(response.body.item.versionId).toBe(versionId);
      // Request should still be OPEN since there's another pending item
      expect(response.body.request.status).toBe('OPEN');
    });

    it('should reject if factory does not own the request', async () => {
      // Factory F002 trying to fulfill F001's request
      await request(app.getHttpServer())
        .post(`/requests/${requestId}/items/${itemId}/fulfill`)
        .set('Authorization', `Bearer ${factory2Token}`)
        .send({
          evidenceId: evidenceId,
          versionId: versionId,
        })
        .expect(403);
    });

    it('should reject if evidence does not belong to factory', async () => {
      // Get a request item that's still pending
      const requestsResponse = await request(app.getHttpServer())
        .get('/factory/requests')
        .set('Authorization', `Bearer ${factoryToken}`)
        .expect(200);

      const pendingItem = requestsResponse.body[0].items.find(
        (item) => item.status === 'PENDING',
      );

      if (pendingItem) {
        // Try to use evidence from another factory or non-existent (will be 403 Forbidden)
        await request(app.getHttpServer())
          .post(`/requests/${requestId}/items/${pendingItem.id}/fulfill`)
          .set('Authorization', `Bearer ${factoryToken}`)
          .send({
            evidenceId: 'non-existent-evidence',
            versionId: 'non-existent-version',
          })
          .expect(403);
      }
    });

    it('should complete request when all items are fulfilled', async () => {
      // Get the remaining pending item
      const requestsResponse = await request(app.getHttpServer())
        .get('/factory/requests')
        .set('Authorization', `Bearer ${factoryToken}`)
        .expect(200);

      const pendingItem = requestsResponse.body[0].items.find(
        (item) => item.status === 'PENDING',
      );

      expect(pendingItem).toBeDefined();

      // Fulfill the last item
      const response = await request(app.getHttpServer())
        .post(`/requests/${requestId}/items/${pendingItem.id}/fulfill`)
        .set('Authorization', `Bearer ${factoryToken}`)
        .send({
          evidenceId: evidenceId,
          versionId: versionId,
        })
        .expect(201);

      expect(response.body.item.status).toBe('FULFILLED');
      // Now request should be COMPLETED
      expect(response.body.request.status).toBe('COMPLETED');
    });

    it('should reject request without authentication', async () => {
      await request(app.getHttpServer())
        .post(`/requests/${requestId}/items/${itemId}/fulfill`)
        .send({
          evidenceId: evidenceId,
          versionId: versionId,
        })
        .expect(401);
    });

    it('should reject request from buyer role', async () => {
      await request(app.getHttpServer())
        .post(`/requests/${requestId}/items/${itemId}/fulfill`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          evidenceId: evidenceId,
          versionId: versionId,
        })
        .expect(403);
    });

    it('should validate fulfill data', async () => {
      await request(app.getHttpServer())
        .post(`/requests/${requestId}/items/${itemId}/fulfill`)
        .set('Authorization', `Bearer ${factoryToken}`)
        .send({
          // Missing evidenceId and versionId
        })
        .expect(400);
    });
  });

  describe('Audit Logging', () => {
    it('should log CREATE_REQUEST action', async () => {
      const response = await request(app.getHttpServer())
        .get('/audit')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      const createRequestLogs = response.body.filter(
        (log) => log.action === 'CREATE_REQUEST',
      );
      expect(createRequestLogs.length).toBeGreaterThan(0);
      expect(createRequestLogs[0].actorUserId).toBe(buyerId);
      expect(createRequestLogs[0].objectType).toBe('Request');
    });

    it('should log VIEW_REQUESTS action', async () => {
      const response = await request(app.getHttpServer())
        .get('/audit')
        .set('Authorization', `Bearer ${factoryToken}`)
        .expect(200);

      const viewRequestsLogs = response.body.filter(
        (log) => log.action === 'VIEW_REQUESTS',
      );
      expect(viewRequestsLogs.length).toBeGreaterThan(0);
      expect(viewRequestsLogs[0].actorUserId).toBe(factoryId);
    });

    it('should log FULFILL_ITEM action', async () => {
      const response = await request(app.getHttpServer())
        .get('/audit')
        .set('Authorization', `Bearer ${factoryToken}`)
        .expect(200);

      const fulfillItemLogs = response.body.filter(
        (log) => log.action === 'FULFILL_ITEM',
      );
      expect(fulfillItemLogs.length).toBeGreaterThan(0);
      expect(fulfillItemLogs[0].actorUserId).toBe(factoryId);
      expect(fulfillItemLogs[0].objectType).toBe('RequestItem');
      expect(fulfillItemLogs[0].metadata).toHaveProperty('evidenceId');
      expect(fulfillItemLogs[0].metadata).toHaveProperty('previousStatus');
      expect(fulfillItemLogs[0].metadata).toHaveProperty('newStatus');
    });
  });
});


