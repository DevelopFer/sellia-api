import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: (origin, callback) => {
      callback(null, true);
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
})




export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('SocketGateway');
  private userSockets = new Map<string, string>(); // userId -> socketId

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  /* Override the server with proper CORS configuration */
  afterInit(server: Server) {
    const corsOrigin = this.configService.get<string>('cors.origin');
    const defaultOrigins = [
      'http://localhost:3002',
      'http://localhost:3000',
      'https://sellia-client-3zqr5.ondigitalocean.app'
    ];
    
    const allowedOrigins = corsOrigin 
      ? corsOrigin.split(',').map(origin => origin.trim())
      : defaultOrigins;
      
    server.engine.opts.cors = {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    };
    
    this.logger.log('Socket.IO server initialized with CORS origins:', allowedOrigins);
  }

  
  
  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }


  
  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    /* Find user by socket ID and mark them offline */
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        await this.setUserOffline(userId);
        this.userSockets.delete(userId);
        break;
      }
    }
  }

  
  @SubscribeMessage('user:online')
  async handleUserOnline(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { userId } = data;
    
    try {
      this.userSockets.set(userId, client.id);
      await this.usersService.updateUserStatus(userId, true);
      this.server.emit('user:status_changed', {
        userId,
        isOnline: true,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(`User ${userId} is now online`);
      
      client.emit('user:online_confirmed', { userId, isOnline: true });
      
    } catch (error) {
      this.logger.error(`Error setting user ${userId} online:`, error);
      client.emit('user:error', { message: 'Failed to set user online' });
    }
  }



  @SubscribeMessage('user:offline')
  async handleUserOffline(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { userId } = data;
    
    try {
      await this.setUserOffline(userId);
      this.userSockets.delete(userId);
      this.logger.log(`User ${userId} is now offline`);
      client.emit('user:offline_confirmed', { userId, isOnline: false });
    } catch (error) {
      this.logger.error(`Error setting user ${userId} offline:`, error);
      client.emit('user:error', { message: 'Failed to set user offline' });
    }
  }



  @SubscribeMessage('conversation:join')
  async handleJoinConversation(
    @MessageBody() data: { conversationId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { conversationId, userId } = data;
    const roomName = `conversation:${conversationId}`;
    
    try {
      await client.join(roomName);
      
      // Get room info after joining
      const roomInfo = this.getRoomInfo(conversationId);
      this.logger.log(`User ${userId} (socket: ${client.id}) joined conversation ${conversationId}. Room now has ${roomInfo.clientCount} clients.`);

      // Notify other users in the conversation
      client.to(roomName).emit('conversation:user_joined', {
        conversationId,
        userId,
        timestamp: new Date().toISOString(),
      });
      
      // Confirm to the joining user
      client.emit('conversation:joined', { 
        conversationId,
        roomInfo: roomInfo
      });
      
    } catch (error) {
      this.logger.error(`Error joining conversation ${conversationId}:`, error);
      client.emit('conversation:error', { message: 'Failed to join conversation' });
    }
  }



  @SubscribeMessage('conversation:leave')
  async handleLeaveConversation(
    @MessageBody() data: { conversationId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { conversationId, userId } = data;
    const roomName = `conversation:${conversationId}`;
    
    try {
      await client.leave(roomName);
      
      // Get room info after leaving
      const roomInfo = this.getRoomInfo(conversationId);
      this.logger.log(`User ${userId} (socket: ${client.id}) left conversation ${conversationId}. Room now has ${roomInfo.clientCount} clients.`);
      
      // Notify remaining users in the conversation
      client.to(roomName).emit('conversation:user_left', {
        conversationId,
        userId,
        timestamp: new Date().toISOString(),
      });
      
    } catch (error) {
      this.logger.error(`Error leaving conversation ${conversationId}:`, error);
    }
  }



  private async setUserOffline(userId: string) {
    try {
      await this.usersService.updateUserStatus(userId, false);
      this.server.emit('user:status_changed', {
        userId,
        isOnline: false,
        timestamp: new Date().toISOString(),
      });
      
    } catch (error) {
      this.logger.error(`Error setting user ${userId} offline:`, error);
    }
  }



  public emitNewMessage(conversationId: string, message: any) {
    const roomName = `conversation:${conversationId}`;
    const room = this.server.sockets.adapter.rooms.get(roomName);
    
    if (!room || room.size === 0) {
      this.logger.warn(`No clients in conversation room: ${roomName}`);
      return;
    }
    
    this.logger.log(`Emitting message to ${room.size} clients in room: ${roomName}`);
    
    // Emit to specific conversation room only
    this.server.to(roomName).emit('message:new', {
      conversationId,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  public getOnlineUsersCount(): number {
    return this.userSockets.size;
  }

  public isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  public getRoomInfo(conversationId: string): { clientCount: number; socketIds: string[] } {
    const roomName = `conversation:${conversationId}`;
    const room = this.server.sockets.adapter.rooms.get(roomName);
    
    if (!room) {
      return { clientCount: 0, socketIds: [] };
    }
    
    return {
      clientCount: room.size,
      socketIds: Array.from(room)
    };
  }
}