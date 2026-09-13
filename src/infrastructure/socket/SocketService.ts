import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { ITokenService } from '../security';
import { ILogger } from '../logging/ILogger';

export interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
    organizationId: string;
    roles?: string[];
  };
}

export interface ISocketService {
  initialize(httpServer: HttpServer): void;
  emitToUser(userId: string, event: string, payload: unknown): void;
  emitToChannel(channelId: string, event: string, payload: unknown): void;
  emitToOrg(orgId: string, event: string, payload: unknown): void;
  isUserOnline(userId: string): boolean;
  getOnlineUsers(orgId: string): string[];
  close(): Promise<void>;
}

export class SocketService implements ISocketService {
  private io: SocketIOServer | null = null;
  /** userId -> Set of socketIds */
  private readonly activeSockets = new Map<string, Set<string>>();
  /** orgId -> Set of online userIds */
  private readonly orgOnlineUsers = new Map<string, Set<string>>();

  constructor(
    private readonly tokenService: ITokenService,
    private readonly logger?: ILogger,
  ) {}

  public initialize(httpServer: HttpServer): void {
    if (this.io) {
      this.logger?.warn('[socket] Socket.IO server already initialized.');
      return;
    }

    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PATCH', 'DELETE'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 30000,
      pingInterval: 25000,
    });

    // ── Authentication Middleware ──────────────────────────────────────────
    this.io.use((socket, next) => {
      try {
        const authHeader = socket.handshake.headers?.authorization;
        const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
        const token =
          socket.handshake.auth?.token ||
          socket.handshake.query?.token ||
          bearerToken;

        if (!token || typeof token !== 'string') {
          return next(new Error('Authentication failed: Missing token'));
        }

        const decoded = this.tokenService.verifyToken(token);
        if (!decoded || !decoded.userId || !decoded.organizationId) {
          return next(new Error('Authentication failed: Invalid token payload'));
        }

        socket.data = {
          userId: decoded.userId,
          organizationId: decoded.organizationId,
          roles: decoded.roles,
        };

        next();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Invalid token';
        next(new Error(`Authentication failed: ${msg}`));
      }
    });

    // ── Connection & Event Routing ──────────────────────────────────────────
    this.io.on('connection', (rawSocket) => {
      const socket = rawSocket as AuthenticatedSocket;
      const { userId, organizationId } = socket.data;

      this.registerSocket(userId, organizationId, socket.id);
      this.logger?.info(`[socket] Client connected: user=${userId}, org=${organizationId}, socketId=${socket.id}`);

      // Auto-join personal room and organization room
      socket.join(`user:${userId}`);
      socket.join(`org:${organizationId}`);

      // Broadcast presence to organization
      socket.to(`org:${organizationId}`).emit('user_online', { userId });

      // Channel Membership: Join Channel Room
      socket.on('join_channel', (data: { channelId: string }) => {
        if (data?.channelId) {
          socket.join(`channel:${data.channelId}`);
          this.logger?.debug?.(`[socket] User ${userId} joined channel:${data.channelId}`);
        }
      });

      // Channel Membership: Leave Channel Room
      socket.on('leave_channel', (data: { channelId: string }) => {
        if (data?.channelId) {
          socket.leave(`channel:${data.channelId}`);
          this.logger?.debug?.(`[socket] User ${userId} left channel:${data.channelId}`);
        }
      });

      // Typing indicators
      socket.on('typing_start', (data: { channelId: string }) => {
        if (data?.channelId) {
          socket.to(`channel:${data.channelId}`).emit('user_typing', {
            channelId: data.channelId,
            userId,
          });
        }
      });

      socket.on('typing_stop', (data: { channelId: string }) => {
        if (data?.channelId) {
          socket.to(`channel:${data.channelId}`).emit('user_stop_typing', {
            channelId: data.channelId,
            userId,
          });
        }
      });

      // Message read receipt broadcast
      socket.on('message_read', (data: { channelId: string; messageId: string }) => {
        if (data?.channelId && data?.messageId) {
          socket.to(`channel:${data.channelId}`).emit('message_read_receipt', {
            channelId: data.channelId,
            messageId: data.messageId,
            userId,
          });
        }
      });

      // Disconnect handling
      socket.on('disconnect', () => {
        this.unregisterSocket(userId, organizationId, socket.id);
        this.logger?.info(`[socket] Client disconnected: user=${userId}, socketId=${socket.id}`);

        if (!this.isUserOnline(userId)) {
          this.io?.to(`org:${organizationId}`).emit('user_offline', { userId });
        }
      });
    });

    this.logger?.info('[socket] Real-time Socket.IO server initialized successfully.');
  }

  public emitToUser(userId: string, event: string, payload: unknown): void {
    this.io?.to(`user:${userId}`).emit(event, payload);
  }

  public emitToChannel(channelId: string, event: string, payload: unknown): void {
    this.io?.to(`channel:${channelId}`).emit(event, payload);
  }

  public emitToOrg(orgId: string, event: string, payload: unknown): void {
    this.io?.to(`org:${orgId}`).emit(event, payload);
  }

  public isUserOnline(userId: string): boolean {
    const sockets = this.activeSockets.get(userId);
    return !!(sockets && sockets.size > 0);
  }

  public getOnlineUsers(orgId: string): string[] {
    const orgUsers = this.orgOnlineUsers.get(orgId);
    return orgUsers ? Array.from(orgUsers) : [];
  }

  public async close(): Promise<void> {
    if (this.io) {
      await new Promise<void>((resolve) => {
        this.io?.close(() => resolve());
      });
      this.io = null;
      this.activeSockets.clear();
      this.orgOnlineUsers.clear();
    }
  }

  private registerSocket(userId: string, orgId: string, socketId: string): void {
    let userSockets = this.activeSockets.get(userId);
    if (!userSockets) {
      userSockets = new Set();
      this.activeSockets.set(userId, userSockets);
    }
    userSockets.add(socketId);

    let orgUsers = this.orgOnlineUsers.get(orgId);
    if (!orgUsers) {
      orgUsers = new Set();
      this.orgOnlineUsers.set(orgId, orgUsers);
    }
    orgUsers.add(userId);
  }

  private unregisterSocket(userId: string, orgId: string, socketId: string): void {
    const userSockets = this.activeSockets.get(userId);
    if (userSockets) {
      userSockets.delete(socketId);
      if (userSockets.size === 0) {
        this.activeSockets.delete(userId);

        const orgUsers = this.orgOnlineUsers.get(orgId);
        if (orgUsers) {
          orgUsers.delete(userId);
          if (orgUsers.size === 0) {
            this.orgOnlineUsers.delete(orgId);
          }
        }
      }
    }
  }
}
