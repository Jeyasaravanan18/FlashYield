import http from "http";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { connectRedis, disconnectRedis } from "./config/redis.js";
import { initializeSocketServer } from "./socket/socketServer.js";
import { startCronJobs, stopCronJobs } from "./jobs.js";
import { logger } from "./utils/logger.js";
const server = http.createServer(app);
async function bootstrap() {
  try {
    await connectDatabase();
    await connectRedis();
    initializeSocketServer(server);
    startCronJobs();
    server.listen(env.PORT, () => {
      logger.info(
        { port: env.PORT, env: env.NODE_ENV },
        `\u{1F680} Food Saver server running on port ${env.PORT} [${env.NODE_ENV}]`
      );
    });
  } catch (err) {
    logger.fatal({ err }, "Failed to start server");
    process.exit(1);
  }
}
async function shutdown(signal) {
  logger.info({ signal }, `Received ${signal} \u2014 starting graceful shutdown`);
  server.close(() => {
    logger.info("HTTP server closed");
  });
  try {
    stopCronJobs();
    await disconnectDatabase();
    await disconnectRedis();
    logger.info("All connections closed \u2014 exiting");
    process.exit(0);
  } catch (err) {
    logger.error({ err }, "Error during shutdown");
    process.exit(1);
  }
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  logger.fatal({ reason }, "Unhandled promise rejection");
  process.exit(1);
});
process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught exception");
  process.exit(1);
});
bootstrap();
