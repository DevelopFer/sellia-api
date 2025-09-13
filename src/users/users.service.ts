import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    return this.prisma.user.create({
      data: createUserDto,
    });
  }

  async loginOrRegister(createUserDto: CreateUserDto): Promise<User> {
    
    const existingUser = await this.findByUsername(createUserDto.username);
    
    if (existingUser) {
      if (createUserDto.name && createUserDto.name !== existingUser.name) {
        return this.prisma.user.update({
          where: { id: existingUser.id },
          data: { name: createUserDto.name },
        });
      }
      return existingUser;
    }
    
    return this.create(createUserDto);
  }

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async findAllPaginated(page: number, limit: number): Promise<{
    users: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    }
  }> {
    const skip = (page - 1) * limit;
    
    // Get total count for pagination metadata
    const total = await this.prisma.user.count();
    
    // Get paginated users
    const users = await this.prisma.user.findMany({
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    });

    const totalPages = Math.ceil(total / limit);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  async findOne(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: updateUserDto,
      });
    } catch (error) {
      // Handle case where user doesn't exist
      return null;
    }
  }

  async remove(id: string): Promise<boolean> {
    try {
      await this.prisma.user.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      // Handle case where user doesn't exist
      return false;
    }
  }
}