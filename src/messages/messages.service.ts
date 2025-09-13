import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import type { Message } from '../../generated/prisma';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async create(createMessageDto: CreateMessageDto): Promise<Message> {
    const message = await this.prisma.message.create({
      data: createMessageDto,
      include: {
        sender: true,
        conversation: true
      }
    });

    // Update conversation's updatedAt timestamp
    await this.prisma.conversation.update({
      where: { id: createMessageDto.conversationId },
      data: { updatedAt: new Date() }
    });

    return message;
  }

  async findAll(): Promise<Message[]> {
    return this.prisma.message.findMany({
      include: {
        sender: true,
        conversation: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async findOne(id: string): Promise<Message | null> {
    return this.prisma.message.findUnique({
      where: { id },
      include: {
        sender: true,
        conversation: true
      }
    });
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: {
        conversationId
      },
      include: {
        sender: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
  }

  async getUserMessages(userId: string): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          {
            conversation: {
              participants: {
                some: {
                  userId
                }
              }
            }
          }
        ]
      },
      include: {
        sender: true,
        conversation: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async update(id: string, updateMessageDto: UpdateMessageDto): Promise<Message | null> {
    try {
      return await this.prisma.message.update({
        where: { id },
        data: updateMessageDto,
        include: {
          sender: true,
          conversation: true
        }
      });
    } catch (error) {
      return null;
    }
  }

  async remove(id: string): Promise<boolean> {
    try {
      await this.prisma.message.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}