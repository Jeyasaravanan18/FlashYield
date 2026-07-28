import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedisClient } from '../config/redis';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/**
 * Creates a Redis-backed rate limiter. Falls back to in-memory
 * if Redis is unavailable (dev/test only — logs a warning).
 */
function createLimiter(options: {
  windowMs: number;
  max: number;
  keyPrefix: string;
  message: string;
  keyGenerator?: (req: any) => string;
}) {
  let store: any = undefined;

  // Use Redis store in non-test environments
  if (process.env.NODE_ENV !== 'test') {
    try {
      const redis = getRedisClient();
      store = new RedisStore({
        // Using ioredis sendCommand method
        sendCommand: (...args: string[]) => redis.call(args[0], ...args.slice(1)) as any,
        prefix: `rl:${options.keyPrefix}:`,
      });
    } catch {
      logger.warn(
        { keyPrefix: options.keyPrefix },
        'Redis not available for rate limiter — using in-memory store',
      );
    }
  }

  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    store,
    message: {
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: options.message,
      },
    },
    keyGenerator: options.keyGenerator,
  });
}

/**
 * Auth rate limiter: 5 req/min per IP (login/register).
 * Stricter to prevent brute-force attacks.
 */
export const authLimiter = createLimiter({
  windowMs: env.RATE_LIMIT_AUTH_WINDOW_MS,
  max: env.RATE_LIMIT_AUTH_MAX,
  keyPrefix: 'auth',
  message: 'Too many authentication attempts. Please try again later.',
});

/**
 * Claim rate limiter: 10 req/min per user.
 * Prevents scripted mass-claiming.
 */
export const claimLimiter = createLimiter({
  windowMs: env.RATE_LIMIT_CLAIM_WINDOW_MS,
  max: env.RATE_LIMIT_CLAIM_MAX,
  keyPrefix: 'claim',
  message: 'Too many claim attempts. Please slow down.',
  keyGenerator: (req: any) => req.user?.userId || req.ip,
});

/**
 * General API rate limiter: 100 req/min per IP.
 * Applied globally to all endpoints.
 */
export const generalLimiter = createLimiter({
  windowMs: env.RATE_LIMIT_GENERAL_WINDOW_MS,
  max: env.RATE_LIMIT_GENERAL_MAX,
  keyPrefix: 'general',
  message: 'Too many requests. Please try again later.',
});

/**
 * Token verification rate limiter: 5 req/min per merchant.
 * Prevents brute-forcing token codes.
 */
export const tokenVerifyLimiter = createLimiter({
  windowMs: 60000,
  max: 5,
  keyPrefix: 'token-verify',
  message: 'Too many verification attempts. Please try again later.',
  keyGenerator: (req: any) => req.user?.userId || req.ip,
});
