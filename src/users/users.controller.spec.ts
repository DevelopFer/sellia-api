import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { NotFoundException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUser = {
    id: '507f1f77bcf86cd799439011',
    username: 'test_user',
    name: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsersService = {
    findAll: vi.fn(() => Promise.resolve([mockUser])),
    findOne: vi.fn((id: string) => 
      Promise.resolve(id === '507f1f77bcf86cd799439011' ? mockUser : null)
    ),
    create: vi.fn((dto: CreateUserDto) => 
      Promise.resolve({ ...mockUser, ...dto })
    ),
    update: vi.fn((id: string, dto: UpdateUserDto) => 
      Promise.resolve(id === '507f1f77bcf86cd799439011' ? { ...mockUser, ...dto } : null)
    ),
    remove: vi.fn((id: string) => 
      Promise.resolve(id === '507f1f77bcf86cd799439011')
    ),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const result = await controller.findAll();
      
      expect(result).toEqual([mockUser]);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user when valid id is provided', async () => {
      const result = await controller.findOne('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockUser);
      expect(service.findOne).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw NotFoundException when invalid id is provided', async () => {
      await expect(() => controller.findOne('invalid_id')).rejects.toThrowError(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        username: 'new_user',
        name: 'New User',
      };

      const result = await controller.create(createUserDto);

      expect(result).toEqual({ ...mockUser, ...createUserDto });
      expect(service.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('update', () => {
    it('should update an existing user', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      const result = await controller.update('507f1f77bcf86cd799439011', updateUserDto);

      expect(result).toEqual({ ...mockUser, ...updateUserDto });
      expect(service.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', updateUserDto);
    });

    it('should throw NotFoundException when updating non-existent user', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      await expect(() => controller.update('invalid_id', updateUserDto)).rejects.toThrowError(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove an existing user', async () => {
      const result = await controller.remove('507f1f77bcf86cd799439011');

      expect(result).toBeTypeOf('object');
      expect(service.remove).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw NotFoundException when removing non-existent user', async () => {
      await expect(() => controller.remove('invalid_id')).rejects.toThrowError(NotFoundException);
    });
  });
});