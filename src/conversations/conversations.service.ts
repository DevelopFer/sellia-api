import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { FindOrCreateConversationDto } from './dto/find-or-create-conversation.dto';
import type { Conversation, UserConversation } from '../../generated/prisma';

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) {}

  async create(createConversationDto: CreateConversationDto): Promise<Conversation> {
    const { participantIds, ...conversationData } = createConversationDto;
    
    return this.prisma.conversation.create({
      data: {
        ...conversationData,
        participants: {
          create: participantIds.map(userId => ({
            userId,
            role: 'member'
          }))
        }
      },
      include: {
        participants: {
          include: {
            user: true
          }
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });
  }

  async findAll(): Promise<Conversation[]> {
    return this.prisma.conversation.findMany({
      include: {
        participants: {
          include: {
            user: true
          }
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });
  }

  async findOne(id: string): Promise<Conversation | null> {
    return this.prisma.conversation.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: true
          }
        },
        messages: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });
  }

  async findOrCreateConversation(data: FindOrCreateConversationDto): Promise<Conversation> {
    const { currentUserId, otherUserId } = data;
    
    // Find existing conversation between these two users
    const existingConversation = await this.prisma.conversation.findFirst({
      where: {
        isGroup: false,
        participants: {
          every: {
            userId: {
              in: [currentUserId, otherUserId]
            }
          }
        },
        // Make sure it's exactly 2 participants (not more)
        AND: [
          {
            participants: {
              some: {
                userId: currentUserId
              }
            }
          },
          {
            participants: {
              some: {
                userId: otherUserId
              }
            }
          }
        ]
      },
      include: {
        participants: {
          include: {
            user: true
          }
        },
        messages: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (existingConversation) {
      // Check if conversation has exactly 2 participants
      if (existingConversation.participants.length === 2) {
        return existingConversation;
      }
    }

    // Create new conversation if none exists
    return this.create({
      participantIds: [currentUserId, otherUserId],
      isGroup: false
    });
  }

  async update(id: string, updateConversationDto: UpdateConversationDto): Promise<Conversation | null> {
    try {
      return await this.prisma.conversation.update({
        where: { id },
        data: updateConversationDto,
        include: {
          participants: {
            include: {
              user: true
            }
          },
          messages: {
            take: 1,
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      });
    } catch (error) {
      return null;
    }
  }

  async remove(id: string): Promise<boolean> {
    try {
      await this.prisma.conversation.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async getUserConversations(userId: string): Promise<Conversation[]> {
    return this.prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId
          }
        }
      },
      include: {
        participants: {
          include: {
            user: true
          }
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
  }
}