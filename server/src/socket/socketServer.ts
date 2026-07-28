import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import jwt from 'jsonwebtoken';
import { getRedisPub, getRedisSub } from '../config/redis';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let io: Server | null = null;

/**
 * Initialize Socket.IO server with Redis adapter for multi-instance support.
 */
export function initializeSocketServer(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Attach Redis adapter for cross-instance event broadcasting
  try {
    const pubClient = getRedisPub();
    const subClient = getRedisSub();
    io.adapter(createAdapter(pubClient, subClient));
    logger.info('Socket.IO Redis adapter attached — multi-instance ready');
  } catch (err) {
    logger.warn({ err }, 'Socket.IO Redis adapter not available — running single-instance');
  }

  // Authentication middleware
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      next(new Error('Authentication required'));
      return;
    }

    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
        userId: string;
        role: string;
        email: string;
      };
      (socket as any).user = decoded;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  // Connection handler
  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    logger.debug({ userId: user.userId, socketId: socket.id }, 'Socket connected');

    // Join room for a specific listing (to receive quantity updates)
    socket.on('listing:subscribe', (listingId: string) => {
      if (typeof listingId === 'string' && /^[0-9a-fA-F]{24}$/.test(listingId)) {
        socket.join(`listing:${listingId}`);
        logger.debug({ userId: user.userId, listingId }, 'Subscribed to listing updates');
      }
    });

    // Leave a listing room
    socket.on('listing:unsubscribe', (listingId: string) => {
      if (typeof listingId === 'string') {
        socket.leave(`listing:${listingId}`);
      }
    });

    socket.on('disconnect', (reason) => {
      logger.debug({ userId: user.userId, reason }, 'Socket disconnected');
    });
  });

  logger.info('Socket.IO server initialized');
  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.IO server not initialized');
  }
  return io;
}
