import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SocketGateway } from '../socket/socket.gateway';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import type { Message } from '@prisma/client';
import { UserconversationsService } from 'src/userconversations/userconversations.service';
import UserBot from 'src/openAI/userbot';
import { ChatbotService } from 'src/openAI/chatbot';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private socketGateway: SocketGateway,
    private userConversationsService: UserconversationsService,
    private chatbotService: ChatbotService
  ) {}

  async create(createMessageDto: CreateMessageDto): Promise<Message> {
    
    const message = await this.prisma.message.create({
      data: createMessageDto,
      include: {
        sender: true,
        conversation: true
      }
    });

    await this.prisma.conversation.update({
      where: { id: createMessageDto.conversationId },
      data: { updatedAt: new Date() }
    });

    this.socketGateway.emitNewMessage(createMessageDto.conversationId, message);
    
    const userbot = new UserBot(createMessageDto, this.userConversationsService, this.prisma, this.socketGateway, this.chatbotService);
    userbot.replyToMessage();

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

  async searchMessages(query: string): Promise<any[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchTerm = query.trim();
    
    /**
     * Search messages by content using case-insensitive matching.
     */
    const messages = await this.prisma.message.findMany({
      where: {
        content: {
          contains: searchTerm,
          mode: 'insensitive'
        }
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            name: true
          }
        },
        conversation: {
          select: {
            id: true,
            title: true,
            isGroup: true,
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    /**
     * Here we map the messages to include highlighted content and conversation context.
     */
    return messages.map(message => ({
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      sender: message.sender,
      conversation: {
        id: message.conversation.id,
        title: message.conversation.title,
        isGroup: message.conversation.isGroup,
        participants: message.conversation.participants.map(p => p.user)
      },
      
      highlightedContent: this.highlightSearchTerm(message.content, searchTerm)
    }));
  }

  private highlightSearchTerm(content: string, searchTerm: string): string {
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return content.replace(regex, '<mark>$1</mark>');
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