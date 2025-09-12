import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto): import("./users.service").User;
    findAll(): import("./users.service").User[];
    findOne(id: string): import("./users.service").User;
    update(id: string, updateUserDto: UpdateUserDto): import("./users.service").User;
    remove(id: string): {
        success: boolean;
        message: string;
    };
}
