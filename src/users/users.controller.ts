import { Controller, Get, Post, Body, Patch, Param, Delete, NotFoundException, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEventsService } from '../events/user-events.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly userEventsService: UserEventsService
  ) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const newUser = await this.usersService.create(createUserDto);
    
    
    this.userEventsService.emitUserJoined(newUser);
    
    return newUser;
  }

  @Post('login-or-register')
  async loginOrRegister(@Body() createUserDto: CreateUserDto) {
    const existingUser = await this.usersService.findByUsername(createUserDto.username);
    const isNewUser = !existingUser;
    
    const user = await this.usersService.loginOrRegister(createUserDto);
    
    
    if (isNewUser) {
      this.userEventsService.emitUserJoined(user);
    }
    
    return user;
  }

  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10'
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    return this.usersService.findAllPaginated(pageNum, limitNum);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.update(id, updateUserDto);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const success = await this.usersService.remove(id);
    if (!success) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return { success: true, message: `User with ID ${id} deleted successfully` };
  }
}