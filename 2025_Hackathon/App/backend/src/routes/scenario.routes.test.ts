import request from 'supertest';
import express from 'express';
import { setupTestDB } from '../test/helpers/db';
import { scenarioRoutes } from './scenario.routes';


describe('Scenario Routes', () => {
  setupTestDB();

  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', scenarioRoutes);
  });

  describe('POST /api/scenarios', () => {
    it('should create a new scenario', async () => {
      const scenarioData = {
        name: 'Virtual Meeting',
        description: 'A virtual meeting room',
        mediaType: 'VR'
      };

      const response = await request(app)
        .post('/api/scenarios')
        .send(scenarioData)
        .expect(201);

      expect(response.body).toMatchObject({
        ...scenarioData,
        id: expect.any(String)
      });
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/scenarios')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/scenarios', () => {
    it('should return empty paginated response when no scenarios exist', async () => {
      const response = await request(app)
        .get('/api/scenarios')
        .expect(200);

      expect(response.body).toEqual({
        items: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0
      });
    });

    it('should return paginated scenarios with default settings', async () => {
      const scenarioData = {
        name: 'Virtual Meeting',
        description: 'A virtual meeting room',
        mediaType: 'VR'
      };

      await request(app)
        .post('/api/scenarios')
        .send(scenarioData);

      const response = await request(app)
        .get('/api/scenarios')
        .expect(200);

      expect(response.body).toMatchObject({
        items: [expect.objectContaining(scenarioData)],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1
      });
    });

    it('should filter scenarios by mediaType', async () => {
      // Create VR scenario
      await request(app)
        .post('/api/scenarios')
        .send({
          name: 'VR Meeting',
          description: 'A VR meeting room',
          mediaType: 'VR'
        });

      // Create web scenario
      await request(app)
        .post('/api/scenarios')
        .send({
          name: 'Web Meeting',
          description: 'A web meeting room',
          mediaType: 'web'
        });

      const response = await request(app)
        .get('/api/scenarios?mediaType=VR')
        .expect(200);

      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].mediaType).toBe('VR');
      expect(response.body.total).toBe(1);
    });

    it('should search scenarios by name', async () => {
      await request(app)
        .post('/api/scenarios')
        .send({
          name: 'VR Meeting',
          description: 'A meeting room',
          mediaType: 'VR'
        });

      await request(app)
        .post('/api/scenarios')
        .send({
          name: 'Web Conference',
          description: 'A conference room',
          mediaType: 'web'
        });

      const response = await request(app)
        .get('/api/scenarios?search=Conference')
        .expect(200);

      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].name).toBe('Web Conference');
    });
  });

  describe('GET /api/scenarios/:id', () => {
    it('should return 404 for non-existent scenario', async () => {
      await request(app)
        .get('/api/scenarios/non-existent-id')
        .expect(404);
    });

    it('should return scenario by id', async () => {
      const scenarioData = {
        name: 'Virtual Meeting',
        description: 'A virtual meeting room',
        mediaType: 'VR'
      };

      const createResponse = await request(app)
        .post('/api/scenarios')
        .send(scenarioData);

      const response = await request(app)
        .get(`/api/scenarios/${createResponse.body.id}`)
        .expect(200);

      expect(response.body).toMatchObject(scenarioData);
    });
  });
});
