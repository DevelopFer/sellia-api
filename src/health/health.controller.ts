import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    };
  }

  @Get('db')
  async checkDatabase() {
    try {
      // Try to connect and count users
      const userCount = await this.prisma.user.count();
      const conversationCount = await this.prisma.conversation.count();
      const messageCount = await this.prisma.message.count();

      return {
        status: 'connected',
        database: {
          userCount,
          conversationCount,
          messageCount,
        },
        connection: {
          url: process.env.DATABASE_URL ? 'configured' : 'missing',
          provider: 'mongodb',
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        error: {
          message: error.message,
          code: error.code,
          name: error.name,
        },
        connection: {
          url: process.env.DATABASE_URL ? 'configured' : 'missing',
          provider: 'mongodb',
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('env')
  async checkEnvironment() {
    return {
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT,
      databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing',
      openaiKey: process.env.OPENAI_API_KEY ? 'configured' : 'missing',
      corsOrigin: process.env.CORS_ORIGIN,
      timestamp: new Date().toISOString(),
    };
  }
}