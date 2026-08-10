import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";
async function connectDatabase() {
  const maxRetries = 5;
  let retries = 0;
  while (retries < maxRetries) {
    try {
      await mongoose.connect(env.MONGODB_URI, {
        // Mongoose 8 defaults are good; only override what's needed
        serverSelectionTimeoutMS: 5e3,
        heartbeatFrequencyMS: 1e4
      });
      logger.info("\u2705 MongoDB connected");
      mongoose.connection.on("error", (err) => {
        logger.error({ err }, "MongoDB connection error");
      });
      mongoose.connection.on("disconnected", () => {
        logger.warn("MongoDB disconnected \u2014 will attempt reconnection");
      });
      mongoose.connection.on("reconnected", () => {
        logger.info("MongoDB reconnected");
      });
      return;
    } catch (err) {
      retries++;
      logger.error(
        { err, attempt: retries, maxRetries },
        `MongoDB connection failed (attempt ${retries}/${maxRetries})`
      );
      if (retries >= maxRetries) {
        throw new Error(`Failed to connect to MongoDB after ${maxRetries} attempts`);
      }
      await new Promise((resolve) => setTimeout(resolve, 1e3 * Math.pow(2, retries - 1)));
    }
  }
}
async function disconnectDatabase() {
  await mongoose.disconnect();
  logger.info("MongoDB disconnected gracefully");
}
export {
  connectDatabase,
  disconnectDatabase
};
