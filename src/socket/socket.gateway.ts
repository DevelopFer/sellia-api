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
import { UserEventsService } from '../events/user-events.service';

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
  private userSockets = new Map<string, string>();
  private socketUsers = new Map<string, string>();
  private disconnectTimeouts = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly userEventsService: UserEventsService,
  ) {}

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
    
    this.startPeriodicStatusSync();
    
    // Listen for user events
    this.userEventsService.on('user:joined', (user) => {
      this.broadcastUserJoined(user);
    });
  }

  private startPeriodicStatusSync() {
    
    setInterval(async () => {
      try {
        await this.syncStatusConsistency();
      } catch (error) {
        this.logger.error('Error in periodic status sync:', error);
      }
    }, 30000);
  }

  private async syncStatusConsistency() {
    const socketUserIds = Array.from(this.userSockets.keys());
    const dbOnlineUsers = await this.usersService.findAllOnline();
    const dbOnlineUserIds = dbOnlineUsers.filter(user => !user.isBot).map(user => user.id);
    
    
    const dbOnlineNotSocket = dbOnlineUserIds.filter(userId => !socketUserIds.includes(userId));
    
    
    const socketNotDbOnline = socketUserIds.filter(userId => !dbOnlineUserIds.includes(userId));
    
    if (dbOnlineNotSocket.length > 0) {
      this.logger.warn(`Users marked online in DB but no socket: ${dbOnlineNotSocket.join(', ')}`);
    
      for (const userId of dbOnlineNotSocket) {
        await this.usersService.updateUserStatus(userId, false);
        this.server.emit('user:status_changed', {
          userId,
          isOnline: false,
          timestamp: new Date().toISOString(),
        });
      }
    }
    
    if (socketNotDbOnline.length > 0) {
      this.logger.warn(`Users with sockets but not marked online in DB: ${socketNotDbOnline.join(', ')}`);
    
      for (const userId of socketNotDbOnline) {
        const user = await this.usersService.findOne(userId);
        if (user && !user.isBot) {
          await this.usersService.updateUserStatus(userId, true);
          this.server.emit('user:status_changed', {
            userId,
            isOnline: true,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }
  }

  
  
  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }


  
  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    const userId = this.socketUsers.get(client.id);
    if (userId) {
      this.logger.log(`User ${userId} socket ${client.id} disconnected`);
      
      this.userSockets.delete(userId);
      this.socketUsers.delete(client.id);
      
      const timeout = setTimeout(async () => {
        if (!this.userSockets.has(userId)) {
          this.logger.log(`User ${userId} still offline after grace period, marking offline`);
          await this.setUserOffline(userId);
        } else {
          this.logger.log(`User ${userId} reconnected during grace period, keeping online`);
        }
        this.disconnectTimeouts.delete(userId);
      }, 5000);
      
      this.disconnectTimeouts.set(userId, timeout);
    }
  }

  
  @SubscribeMessage('user:online')
  async handleUserOnline(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { userId } = data;
    
    try {
      const user = await this.usersService.findOne(userId);
      if (!user) {
        client.emit('user:error', { message: 'User not found' });
        return;
      }

      const existingTimeout = this.disconnectTimeouts.get(userId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        this.disconnectTimeouts.delete(userId);
        this.logger.log(`Cleared disconnect timeout for user ${userId} - reconnected`);
      }

      this.userSockets.set(userId, client.id);
      this.socketUsers.set(client.id, userId);
      
      if (!user.isBot) {
        await this.usersService.updateUserStatus(userId, true);
        client.broadcast.emit('user:status_changed', {
          userId,
          isOnline: true,
          timestamp: new Date().toISOString(),
        });
      }

      this.logger.log(`User ${userId} (${user.isBot ? 'bot' : 'human'}) is now online`);
      
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
      this.userSockets.delete(userId);
      this.socketUsers.delete(client.id);
      
      const existingTimeout = this.disconnectTimeouts.get(userId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        this.disconnectTimeouts.delete(userId);
      }
      
      await this.setUserOffline(userId);
      
      this.logger.log(`User ${userId} explicitly set offline`);
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
      
      const roomInfo = this.getRoomInfo(conversationId);
      this.logger.log(`User ${userId} (socket: ${client.id}) joined conversation ${conversationId}. Room now has ${roomInfo.clientCount} clients.`);

      client.to(roomName).emit('conversation:user_joined', {
        conversationId,
        userId,
        timestamp: new Date().toISOString(),
      });
      
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
      
      const roomInfo = this.getRoomInfo(conversationId);
      this.logger.log(`User ${userId} (socket: ${client.id}) left conversation ${conversationId}. Room now has ${roomInfo.clientCount} clients.`);

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
      const user = await this.usersService.findOne(userId);
      if (!user) {
        this.logger.warn(`User ${userId} not found when setting offline`);
        return;
      }

      if (!user.isBot) {
        await this.usersService.updateUserStatus(userId, false);
        this.server.emit('user:status_changed', {
          userId,
          isOnline: false,
          timestamp: new Date().toISOString(),
        });
      }
      
      this.logger.log(`User ${userId} (${user.isBot ? 'bot' : 'human'}) is now offline`);
      
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
    
    this.server.to(roomName).emit('message:new', {
      conversationId,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  public broadcastUserJoined(user: any) {
    this.logger.log(`Broadcasting new user joined: ${user.username} (${user.id})`);
    
    this.server.emit('user:joined', {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        isOnline: user.isOnline || false,
        isBot: user.isBot || false,
        avatar: user.avatar,
      },
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

  private cleanupTimeouts() {
    for (const [userId, timeout] of this.disconnectTimeouts.entries()) {
      clearTimeout(timeout);
    }
    this.disconnectTimeouts.clear();
  }

  @SubscribeMessage('request:online_users')
  async handleRequestOnlineUsers(
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const socketOnlineUserIds = Array.from(this.userSockets.keys());
      
      const dbOnlineUsers = await this.usersService.findAllOnline();
      const dbOnlineUserIds = dbOnlineUsers
        .filter(user => !user.isBot)
        .map(user => user.id);
      
      const allOnlineUserIds = Array.from(new Set([...socketOnlineUserIds, ...dbOnlineUserIds]));
      
      client.emit('online_users:current', {
        userIds: allOnlineUserIds,
        socketConnected: socketOnlineUserIds,
        dbOnline: dbOnlineUserIds,
        timestamp: new Date().toISOString(),
      });
      
      this.logger.log(`Sent online users - Socket: ${socketOnlineUserIds.length}, DB: ${dbOnlineUserIds.length}, Total: ${allOnlineUserIds.length}`);
      
    } catch (error) {
      this.logger.error('Error sending online users:', error);
      client.emit('user:error', { message: 'Failed to get online users' });
    }
  }
}