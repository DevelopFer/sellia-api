import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ZodValidationPipe } from 'nestjs-zod';
import { cleanupTestDatabase } from './test-db-setup';

describe('Users (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Apply the same global pipes as in main.ts
    app.useGlobalPipes(new ZodValidationPipe());
    app.setGlobalPrefix('api');
    
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
    // Skip cleanup for now to debug connection issues
    // await cleanupTestDatabase();
  });

  describe('/api/users (GET)', () => {
    it('should return an array of users', () => {
      return request(app.getHttpServer())
        .get('/api/users')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          // The array might be empty since we're using MongoDB/Prisma
          if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('id');
            expect(res.body[0]).toHaveProperty('username');
            expect(res.body[0]).toHaveProperty('name');
            expect(res.body[0]).toHaveProperty('createdAt');
            expect(res.body[0]).toHaveProperty('updatedAt');
          }
        });
    });
  });

  describe('/api/users (POST)', () => {
    it('should create a new user with valid data', () => {
      const newUser = {
        username: 'test_user',
        name: 'Test User',
      };

      return request(app.getHttpServer())
        .post('/api/users')
        .send(newUser)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.username).toBe(newUser.username);
          expect(res.body.name).toBe(newUser.name);
          expect(res.body).toHaveProperty('createdAt');
          expect(res.body).toHaveProperty('updatedAt');
        });
    });

    it('should reject user with missing username', () => {
      const invalidUser = {
        name: 'Test User',
      };

      return request(app.getHttpServer())
        .post('/api/users')
        .send(invalidUser)
        .expect(400);
    });

    it('should reject user with empty username', () => {
      const invalidUser = {
        username: '',
        name: 'Test User',
      };

      return request(app.getHttpServer())
        .post('/api/users')
        .send(invalidUser)
        .expect(400);
    });

    it('should reject user with missing name', () => {
      const invalidUser = {
        username: 'test_user',
      };

      return request(app.getHttpServer())
        .post('/api/users')
        .send(invalidUser)
        .expect(400);
    });

    it('should reject user with empty name', () => {
      const invalidUser = {
        username: 'test_user',
        name: '',
      };

      return request(app.getHttpServer())
        .post('/api/users')
        .send(invalidUser)
        .expect(400);
    });
  });

  describe('Complete workflow', () => {
    it('should create, read, update, and delete a user', async () => {
      const newUser = {
        username: 'workflow_user',
        name: 'Workflow User',
      };

      // 1. Create user
      const createResponse = await request(app.getHttpServer())
        .post('/api/users')
        .send(newUser)
        .expect(201);

      const userId = createResponse.body.id;
      expect(userId).toBeDefined();
      expect(typeof userId).toBe('string'); // MongoDB ObjectID is a string

      // 2. Read user
      await request(app.getHttpServer())
        .get(`/api/users/${userId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.username).toBe(newUser.username);
          expect(res.body.name).toBe(newUser.name);
        });

      // 3. Update user
      const updateData = { name: 'Updated Workflow User' };
      await request(app.getHttpServer())
        .patch(`/api/users/${userId}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe(updateData.name);
        });

      // 4. Delete user
      await request(app.getHttpServer())
        .delete(`/api/users/${userId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({ message: 'User deleted successfully' });
        });

      // 5. Verify deletion
      await request(app.getHttpServer())
        .get(`/api/users/${userId}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toContain('not found');
        });
    });
  });
});