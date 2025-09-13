import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// Mock PrismaService
const mockPrismaService = {
  user: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  beforeEach(() => {
    prisma = mockPrismaService as unknown as PrismaService;
    service = new UsersService(prisma);
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const mockUsers = [
        {
          id: '507f1f77bcf86cd799439011',
          username: 'john_doe',
          name: 'John Doe',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '507f1f77bcf86cd799439012',
          username: 'jane_smith',
          name: 'Jane Smith',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.findAll();
      
      expect(result).toEqual(mockUsers);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledOnce();
    });
  });

  describe('findOne', () => {
    it('should return a user when valid id is provided', async () => {
      const mockUser = {
        id: '507f1f77bcf86cd799439011',
        username: 'john_doe',
        name: 'John Doe',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne('507f1f77bcf86cd799439011');
      
      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: '507f1f77bcf86cd799439011' },
      });
    });

    it('should return null when invalid id is provided', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findOne('invalid_id');
      
      expect(result).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('should return a user when valid username is provided', async () => {
      const mockUser = {
        id: '507f1f77bcf86cd799439011',
        username: 'john_doe',
        name: 'John Doe',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByUsername('john_doe');
      
      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'john_doe' },
      });
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        username: 'test_user',
        name: 'Test User',
      };

      const mockCreatedUser = {
        id: '507f1f77bcf86cd799439013',
        ...createUserDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.create.mockResolvedValue(mockCreatedUser);

      const result = await service.create(createUserDto);

      expect(result).toEqual(mockCreatedUser);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: createUserDto,
      });
    });
  });

  describe('update', () => {
    it('should update an existing user', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      const mockUpdatedUser = {
        id: '507f1f77bcf86cd799439011',
        username: 'john_doe',
        name: 'Updated Name',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.update.mockResolvedValue(mockUpdatedUser);

      const result = await service.update('507f1f77bcf86cd799439011', updateUserDto);

      expect(result).toEqual(mockUpdatedUser);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: '507f1f77bcf86cd799439011' },
        data: updateUserDto,
      });
    });

    it('should return null when trying to update non-existent user', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      mockPrismaService.user.update.mockRejectedValue(new Error('User not found'));

      const result = await service.update('invalid_id', updateUserDto);
      
      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should remove an existing user', async () => {
      mockPrismaService.user.delete.mockResolvedValue({});

      const result = await service.remove('507f1f77bcf86cd799439011');

      expect(result).toBe(true);
      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
        where: { id: '507f1f77bcf86cd799439011' },
      });
    });

    it('should return false when trying to remove non-existent user', async () => {
      mockPrismaService.user.delete.mockRejectedValue(new Error('User not found'));

      const result = await service.remove('invalid_id');
      
      expect(result).toBe(false);
    });
  });
});