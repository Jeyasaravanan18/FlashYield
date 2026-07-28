import http from 'http';
import { app } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';
import { initializeSocketServer } from './socket/socketServer';
import { startCronJobs, stopCronJobs } from './jobs';
import { logger } from './utils/logger';

const server = http.createServer(app);

async function bootstrap(): Promise<void> {
  try {
    // 1. Connect to databases
    await connectDatabase();
    await connectRedis();

    // 2. Initialize Socket.IO with Redis adapter
    initializeSocketServer(server);

    // 3. Start cron jobs
    startCronJobs();

    // 4. Start HTTP server
    server.listen(env.PORT, () => {
      logger.info(
        { port: env.PORT, env: env.NODE_ENV },
        `🚀 Food Saver server running on port ${env.PORT} [${env.NODE_ENV}]`,
      );
    });
  } catch (err) {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }
}

// ── Graceful Shutdown ──
async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, `Received ${signal} — starting graceful shutdown`);

  // Stop accepting new connections
  server.close(() => {
    logger.info('HTTP server closed');
  });

  try {
    stopCronJobs();
    await disconnectDatabase();
    await disconnectRedis();
    logger.info('All connections closed — exiting');
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Error during shutdown');
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'Unhandled promise rejection');
  // Let the process manager restart us
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  process.exit(1);
});

bootstrap();
