import { describe, it, expect, beforeEach } from 'vitest';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(() => {
    service = new UsersService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users', () => {
      const result = service.findAll();
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('email');
      expect(result[0]).toHaveProperty('name');
    });
  });

  describe('findOne', () => {
    it('should return a user when valid id is provided', () => {
      const result = service.findOne(1);
      expect(result).toBeDefined();
      expect(result?.id).toBe(1);
      expect(result?.email).toBe('john@example.com');
    });

    it('should return undefined when invalid id is provided', () => {
      const result = service.findOne(999);
      expect(result).toBeUndefined();
    });
  });

  describe('create', () => {
    it('should create a new user', () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const initialCount = service.findAll().length;
      const result = service.create(createUserDto);

      expect(result).toBeDefined();
      expect(result.email).toBe(createUserDto.email);
      expect(result.name).toBe(createUserDto.name);
      expect(result.id).toBeGreaterThan(0);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(service.findAll().length).toBe(initialCount + 1);
    });
  });

  describe('update', () => {
    it('should update an existing user', () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      const result = service.update(1, updateUserDto);

      expect(result).toBeDefined();
      expect(result?.name).toBe(updateUserDto.name);
      expect(result?.email).toBe('john@example.com'); // Should keep original email
      expect(result?.updatedAt).toBeInstanceOf(Date);
    });

    it('should return undefined when trying to update non-existent user', () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      const result = service.update(999, updateUserDto);
      expect(result).toBeUndefined();
    });
  });

  describe('remove', () => {
    it('should remove an existing user', () => {
      const initialCount = service.findAll().length;
      const result = service.remove(1);

      expect(result).toBe(true);
      expect(service.findAll().length).toBe(initialCount - 1);
      expect(service.findOne(1)).toBeUndefined();
    });

    it('should return false when trying to remove non-existent user', () => {
      const result = service.remove(999);
      expect(result).toBe(false);
    });
  });
});