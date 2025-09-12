import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

export interface User {
  id: number;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UsersService {
  private users: User[] = [
    {
      id: 1,
      email: 'john@example.com',
      name: 'John Doe',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      email: 'jane@example.com',
      name: 'Jane Smith',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  create(createUserDto: CreateUserDto): User {
    const newUser: User = {
      id: this.users.length + 1,
      ...createUserDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(newUser);
    return newUser;
  }

  findAll(): User[] {
    return this.users;
  }

  findOne(id: number): User | undefined {
    return this.users.find(user => user.id === id);
  }

  update(id: number, updateUserDto: UpdateUserDto): User | undefined {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      return undefined;
    }
    
    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updateUserDto,
      updatedAt: new Date(),
    };
    
    return this.users[userIndex];
  }

  remove(id: number): boolean {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      return false;
    }
    
    this.users.splice(userIndex, 1);
    return true;
  }
}