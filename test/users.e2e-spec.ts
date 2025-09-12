import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ZodValidationPipe } from 'nestjs-zod';

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
    await app.close();
  });

  describe('/api/users (GET)', () => {
    it('should return an array of users', () => {
      return request(app.getHttpServer())
        .get('/api/users')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('email');
          expect(res.body[0]).toHaveProperty('name');
          expect(res.body[0]).toHaveProperty('createdAt');
          expect(res.body[0]).toHaveProperty('updatedAt');
        });
    });
  });

  describe('/api/users/:id (GET)', () => {
    it('should return a specific user', () => {
      return request(app.getHttpServer())
        .get('/api/users/1')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', 1);
          expect(res.body).toHaveProperty('email');
          expect(res.body).toHaveProperty('name');
        });
    });

    it('should return 404 for non-existent user', () => {
      return request(app.getHttpServer())
        .get('/api/users/999')
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toContain('User with ID 999 not found');
        });
    });
  });

  // describe('/api/users (POST)', () => {
  //   it('should create a new user with valid data', () => {
  //     const newUser = {
  //       email: 'test@example.com',
  //       name: 'Test User',
  //     };

  //     return request(app.getHttpServer())
  //       .post('/api/users')
  //       .send(newUser)
  //       .expect(201)
  //       .expect((res) => {
  //         expect(res.body).toHaveProperty('id');
  //         expect(res.body.email).toBe(newUser.email);
  //         expect(res.body.name).toBe(newUser.name);
  //         expect(res.body).toHaveProperty('createdAt');
  //         expect(res.body).toHaveProperty('updatedAt');
  //       });
  //   });

  //   it('should reject user with invalid email', () => {
  //     const invalidUser = {
  //       email: 'invalid-email',
  //       name: 'Test User',
  //     };

  //     return request(app.getHttpServer())
  //       .post('/api/users')
  //       .send(invalidUser)
  //       .expect(400)
  //       .expect((res) => {
  //         expect(res.body).toHaveProperty('message');
  //         expect(res.body.message).toContain('email');
  //       });
  //   });

  //   it('should reject user with missing name', () => {
  //     const invalidUser = {
  //       email: 'test@example.com',
  //     };

  //     return request(app.getHttpServer())
  //       .post('/api/users')
  //       .send(invalidUser)
  //       .expect(400);
  //   });

  //   it('should reject user with empty name', () => {
  //     const invalidUser = {
  //       email: 'test@example.com',
  //       name: '',
  //     };

  //     return request(app.getHttpServer())
  //       .post('/api/users')
  //       .send(invalidUser)
  //       .expect(400);
  //   });
  // });

  // describe('/api/users/:id (PATCH)', () => {
  //   it('should update an existing user', () => {
  //     const updateData = {
  //       name: 'Updated Name',
  //     };

  //     return request(app.getHttpServer())
  //       .patch('/api/users/1')
  //       .send(updateData)
  //       .expect(200)
  //       .expect((res) => {
  //         expect(res.body).toHaveProperty('id', 1);
  //         expect(res.body.name).toBe(updateData.name);
  //         expect(res.body).toHaveProperty('updatedAt');
  //       });
  //   });

  //   it('should update user email', () => {
  //     const updateData = {
  //       email: 'newemail@example.com',
  //     };

  //     return request(app.getHttpServer())
  //       .patch('/api/users/1')
  //       .send(updateData)
  //       .expect(200)
  //       .expect((res) => {
  //         expect(res.body.email).toBe(updateData.email);
  //       });
  //   });

  //   it('should reject invalid email format', () => {
  //     const updateData = {
  //       email: 'invalid-email',
  //     };

  //     return request(app.getHttpServer())
  //       .patch('/api/users/1')
  //       .send(updateData)
  //       .expect(400);
  //   });

  //   it('should return undefined for non-existent user', () => {
  //     const updateData = {
  //       name: 'Updated Name',
  //     };

  //     return request(app.getHttpServer())
  //       .patch('/api/users/999')
  //       .send(updateData)
  //       .expect(200)
  //       .expect((res) => {
  //         expect(res.body).toBeUndefined();
  //       });
  //   });
  // });

  // describe('/api/users/:id (DELETE)', () => {
  //   it('should delete an existing user', () => {
  //     return request(app.getHttpServer())
  //       .delete('/api/users/2') // Delete user with id 2
  //       .expect(200)
  //       .expect((res) => {
  //         expect(res.body).toBe(true);
  //       });
  //   });

  //   it('should return false for non-existent user', () => {
  //     return request(app.getHttpServer())
  //       .delete('/api/users/999')
  //       .expect(200)
  //       .expect((res) => {
  //         expect(res.body).toBe(false);
  //       });
  //   });
  // });

  // describe('Complete workflow', () => {
  //   it('should create, read, update, and delete a user', async () => {
  //     const newUser = {
  //       email: 'workflow@example.com',
  //       name: 'Workflow User',
  //     };

  //     // 1. Create user
  //     const createResponse = await request(app.getHttpServer())
  //       .post('/api/users')
  //       .send(newUser)
  //       .expect(201);

  //     const userId = createResponse.body.id;
  //     expect(userId).toBeDefined();

  //     // 2. Read user
  //     await request(app.getHttpServer())
  //       .get(`/api/users/${userId}`)
  //       .expect(200)
  //       .expect((res) => {
  //         expect(res.body.email).toBe(newUser.email);
  //         expect(res.body.name).toBe(newUser.name);
  //       });

  //     // 3. Update user
  //     const updateData = { name: 'Updated Workflow User' };
  //     await request(app.getHttpServer())
  //       .patch(`/api/users/${userId}`)
  //       .send(updateData)
  //       .expect(200)
  //       .expect((res) => {
  //         expect(res.body.name).toBe(updateData.name);
  //       });

  //     // 4. Delete user
  //     await request(app.getHttpServer())
  //       .delete(`/api/users/${userId}`)
  //       .expect(200)
  //       .expect((res) => {
  //         expect(res.body).toBe(true);
  //       });

  //     // 5. Verify deletion
  //     await request(app.getHttpServer())
  //       .get(`/api/users/${userId}`)
  //       .expect(200)
  //       .expect((res) => {
  //         expect(res.body).toBeUndefined();
  //       });
  //   });
  // });
});