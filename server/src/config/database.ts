import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

export async function connectDatabase(): Promise<void> {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await mongoose.connect(env.MONGODB_URI, {
        // Mongoose 8 defaults are good; only override what's needed
        serverSelectionTimeoutMS: 5000,
        heartbeatFrequencyMS: 10000,
      });

      logger.info('✅ MongoDB connected');

      mongoose.connection.on('error', (err) => {
        logger.error({ err }, 'MongoDB connection error');
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected — will attempt reconnection');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
      });

      return;
    } catch (err) {
      retries++;
      logger.error(
        { err, attempt: retries, maxRetries },
        `MongoDB connection failed (attempt ${retries}/${maxRetries})`,
      );
      if (retries >= maxRetries) {
        throw new Error(`Failed to connect to MongoDB after ${maxRetries} attempts`);
      }
      // Exponential backoff: 1s, 2s, 4s, 8s, 16s
      await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retries - 1)));
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected gracefully');
}
