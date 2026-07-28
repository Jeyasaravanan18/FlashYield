import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { getRedisClient } from '../config/redis';

const router = Router();

// GET /api/v1/health — health check endpoint
router.get('/', async (_req: Request, res: Response) => {
  const checks: Record<string, string> = {
    status: 'ok',
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString(),
    mongo: 'unknown',
    redis: 'unknown',
  };

  let healthy = true;

  // Check MongoDB
  try {
    const mongoState = mongoose.connection.readyState;
    checks.mongo = mongoState === 1 ? 'connected' : 'disconnected';
    if (mongoState !== 1) healthy = false;
  } catch {
    checks.mongo = 'error';
    healthy = false;
  }

  // Check Redis
  try {
    const redis = getRedisClient();
    const pong = await redis.ping();
    checks.redis = pong === 'PONG' ? 'connected' : 'error';
  } catch {
    checks.redis = 'error';
    healthy = false;
  }

  if (!healthy) {
    checks.status = 'degraded';
  }

  res.status(healthy ? 200 : 503).json(checks);
});

export { router as healthRouter };
