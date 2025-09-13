import { Controller, Get, Post, Body, Patch, Param, Delete, NotFoundException } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  async create(@Body() createMessageDto: CreateMessageDto) {
    return this.messagesService.create(createMessageDto);
  }

  @Post('send')
  async sendMessage(@Body() createMessageDto: CreateMessageDto) {
    return this.messagesService.create(createMessageDto);
  }

  @Get()
  async findAll() {
    return this.messagesService.findAll();
  }

  @Get('conversation/:conversationId')
  async getConversationMessages(@Param('conversationId') conversationId: string) {
    return this.messagesService.getConversationMessages(conversationId);
  }

  @Get('user/:userId')
  async getUserMessages(@Param('userId') userId: string) {
    return this.messagesService.getUserMessages(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const message = await this.messagesService.findOne(id);
    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }
    return message;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateMessageDto: UpdateMessageDto) {
    const message = await this.messagesService.update(id, updateMessageDto);
    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }
    return message;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const success = await this.messagesService.remove(id);
    if (!success) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }
    return { success: true, message: `Message with ID ${id} deleted successfully` };
  }
}