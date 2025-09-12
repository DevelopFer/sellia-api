import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService, User } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { NotFoundException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsersService = {
    findAll: vi.fn(() => [mockUser]),
    findOne: vi.fn((id: number) => (id === 1 ? mockUser : undefined)),
    create: vi.fn((dto: CreateUserDto) => ({ ...mockUser, ...dto })),
    update: vi.fn((id: number, dto: UpdateUserDto) => 
      id === 1 ? { ...mockUser, ...dto } : undefined
    ),
    remove: vi.fn((id: number) => id === 1),
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
    it('should return an array of users', () => {
      const result = controller.findAll();
      
      expect(result).toEqual([mockUser]);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user when valid id is provided', () => {
      const result = controller.findOne('1');
      expect(result).toEqual(mockUser);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('should return undefined when invalid id is provided', () => {
      expect(()=>controller.findOne('999')).toThrowError(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new user', () => {
      const createUserDto: CreateUserDto = {
        email: 'new@example.com',
        name: 'New User',
      };

      const result = controller.create(createUserDto);

      expect(result).toEqual({ ...mockUser, ...createUserDto });
      expect(service.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('update', () => {
    it('should update an existing user', () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      const result = controller.update('1', updateUserDto);

      expect(result).toEqual({ ...mockUser, ...updateUserDto });
      expect(service.update).toHaveBeenCalledWith(1, updateUserDto);
    });

    it('should return undefined when updating non-existent user', () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      expect(()=>controller.update('999', updateUserDto)).toThrowError(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove an existing user', () => {
      const result = controller.remove('1');

      expect(result).toBeTypeOf('object');
      expect(service.remove).toHaveBeenCalledWith(1);
    });

    it('should return false when removing non-existent user', () => {
      expect(()=>controller.remove('999')).toThrowError(NotFoundException);
    });
  });
});