import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { UsersService } from '../users/users.service';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3003', 'http://localhost:3000'], // Allow frontend origins
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('SocketGateway');
  private userSockets = new Map<string, string>(); // userId -> socketId

  constructor(private readonly usersService: UsersService) {}

  // Handle new socket connections
  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  // Handle socket disconnections
  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Find user by socket ID and mark them offline
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        await this.setUserOffline(userId);
        this.userSockets.delete(userId);
        break;
      }
    }
  }

  // Handle user going online
  @SubscribeMessage('user:online')
  async handleUserOnline(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { userId } = data;
    
    try {
      // Store the socket connection for this user
      this.userSockets.set(userId, client.id);
      
      // Update user status in database
      await this.usersService.updateUserStatus(userId, true);
      
      // Broadcast to all clients that this user is online
      this.server.emit('user:status_changed', {
        userId,
        isOnline: true,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(`User ${userId} is now online`);
      
      // Send confirmation to the client
      client.emit('user:online_confirmed', { userId, isOnline: true });
      
    } catch (error) {
      this.logger.error(`Error setting user ${userId} online:`, error);
      client.emit('user:error', { message: 'Failed to set user online' });
    }
  }

  // Handle user going offline
  @SubscribeMessage('user:offline')
  async handleUserOffline(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { userId } = data;
    
    try {
      await this.setUserOffline(userId);
      
      // Remove socket connection
      this.userSockets.delete(userId);
      
      this.logger.log(`User ${userId} is now offline`);
      
      // Send confirmation to the client
      client.emit('user:offline_confirmed', { userId, isOnline: false });
      
    } catch (error) {
      this.logger.error(`Error setting user ${userId} offline:`, error);
      client.emit('user:error', { message: 'Failed to set user offline' });
    }
  }

  // Handle user joining a conversation room
  @SubscribeMessage('conversation:join')
  async handleJoinConversation(
    @MessageBody() data: { conversationId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { conversationId, userId } = data;
    
    try {
      // Join the conversation room
      await client.join(`conversation:${conversationId}`);
      
      this.logger.log(`User ${userId} joined conversation ${conversationId}`);
      
      // Notify others in the conversation
      client.to(`conversation:${conversationId}`).emit('conversation:user_joined', {
        conversationId,
        userId,
        timestamp: new Date().toISOString(),
      });
      
      // Confirm to the user
      client.emit('conversation:joined', { conversationId });
      
    } catch (error) {
      this.logger.error(`Error joining conversation ${conversationId}:`, error);
      client.emit('conversation:error', { message: 'Failed to join conversation' });
    }
  }

  // Handle user leaving a conversation room
  @SubscribeMessage('conversation:leave')
  async handleLeaveConversation(
    @MessageBody() data: { conversationId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { conversationId, userId } = data;
    
    try {
      // Leave the conversation room
      await client.leave(`conversation:${conversationId}`);
      
      this.logger.log(`User ${userId} left conversation ${conversationId}`);
      
      // Notify others in the conversation
      client.to(`conversation:${conversationId}`).emit('conversation:user_left', {
        conversationId,
        userId,
        timestamp: new Date().toISOString(),
      });
      
    } catch (error) {
      this.logger.error(`Error leaving conversation ${conversationId}:`, error);
    }
  }

  // Helper method to set user offline
  private async setUserOffline(userId: string) {
    try {
      // Update user status in database
      await this.usersService.updateUserStatus(userId, false);
      
      // Broadcast to all clients that this user is offline
      this.server.emit('user:status_changed', {
        userId,
        isOnline: false,
        timestamp: new Date().toISOString(),
      });
      
    } catch (error) {
      this.logger.error(`Error setting user ${userId} offline:`, error);
    }
  }

  // Method to emit new message to conversation participants
  public emitNewMessage(conversationId: string, message: any) {
    // Emit to all connected users - let the frontend handle filtering
    this.server.emit('message:new', {
      conversationId,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  // Method to get online users count
  public getOnlineUsersCount(): number {
    return this.userSockets.size;
  }

  // Method to check if user is online
  public isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }
}