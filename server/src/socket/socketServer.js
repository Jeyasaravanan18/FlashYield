import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import jwt from "jsonwebtoken";
import { getRedisPub, getRedisSub } from "../config/redis.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
let io = null;
function initializeSocketServer(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ["GET", "POST"],
      credentials: true
    },
    pingTimeout: 6e4,
    pingInterval: 25e3
  });
  try {
    const pubClient = getRedisPub();
    const subClient = getRedisSub();
    io.adapter(createAdapter(pubClient, subClient));
    logger.info("Socket.IO Redis adapter attached \u2014 multi-instance ready");
  } catch (err) {
    logger.warn({ err }, "Socket.IO Redis adapter not available \u2014 running single-instance");
  }
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      next(new Error("Authentication required"));
      return;
    }
    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
      socket.user = decoded;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });
  io.on("connection", (socket) => {
    const user = socket.user;
    logger.debug({ userId: user.userId, socketId: socket.id }, "Socket connected");
    socket.on("listing:subscribe", (listingId) => {
      if (typeof listingId === "string" && /^[0-9a-fA-F]{24}$/.test(listingId)) {
        socket.join(`listing:${listingId}`);
        logger.debug({ userId: user.userId, listingId }, "Subscribed to listing updates");
      }
    });
    socket.on("listing:unsubscribe", (listingId) => {
      if (typeof listingId === "string") {
        socket.leave(`listing:${listingId}`);
      }
    });
    socket.on("disconnect", (reason) => {
      logger.debug({ userId: user.userId, reason }, "Socket disconnected");
    });
  });
  logger.info("Socket.IO server initialized");
  return io;
}
function getIO() {
  if (!io) {
    throw new Error("Socket.IO server not initialized");
  }
  return io;
}
export {
  getIO,
  initializeSocketServer
};
