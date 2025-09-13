import { Controller, Get, Post, Body, Patch, Param, Delete, NotFoundException, Query } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { FindOrCreateConversationDto } from './dto/find-or-create-conversation.dto';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  async create(@Body() createConversationDto: CreateConversationDto) {
    return this.conversationsService.create(createConversationDto);
  }

  @Post('find-or-create')
  async findOrCreate(@Body() findOrCreateDto: FindOrCreateConversationDto) {
    return this.conversationsService.findOrCreateConversation(findOrCreateDto);
  }

  @Get()
  async findAll() {
    return this.conversationsService.findAll();
  }

  @Get('user/:userId')
  async getUserConversations(@Param('userId') userId: string) {
    return this.conversationsService.getUserConversations(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const conversation = await this.conversationsService.findOne(id);
    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }
    return conversation;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateConversationDto: UpdateConversationDto) {
    const conversation = await this.conversationsService.update(id, updateConversationDto);
    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }
    return conversation;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const success = await this.conversationsService.remove(id);
    if (!success) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }
    return { success: true, message: `Conversation with ID ${id} deleted successfully` };
  }
}