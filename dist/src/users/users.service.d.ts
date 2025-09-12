import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export interface User {
    id: number;
    email: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class UsersService {
    private users;
    create(createUserDto: CreateUserDto): User;
    findAll(): User[];
    findOne(id: number): User | undefined;
    update(id: number, updateUserDto: UpdateUserDto): User | undefined;
    remove(id: number): boolean;
}
