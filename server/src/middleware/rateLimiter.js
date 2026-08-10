import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { getRedisClient } from "../config/redis.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
function createLimiter(options) {
  let store = void 0;
  if (process.env.NODE_ENV !== "test") {
    try {
      const redis = getRedisClient();
      store = new RedisStore({
        // Using ioredis sendCommand method
        sendCommand: (...args) => redis.call(args[0], ...args.slice(1)),
        prefix: `rl:${options.keyPrefix}:`
      });
    } catch {
      logger.warn(
        { keyPrefix: options.keyPrefix },
        "Redis not available for rate limiter \u2014 using in-memory store"
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
        code: "RATE_LIMIT_EXCEEDED",
        message: options.message
      }
    },
    keyGenerator: options.keyGenerator
  });
}
const authLimiter = createLimiter({
  windowMs: env.RATE_LIMIT_AUTH_WINDOW_MS,
  max: env.RATE_LIMIT_AUTH_MAX,
  keyPrefix: "auth",
  message: "Too many authentication attempts. Please try again later."
});
const claimLimiter = createLimiter({
  windowMs: env.RATE_LIMIT_CLAIM_WINDOW_MS,
  max: env.RATE_LIMIT_CLAIM_MAX,
  keyPrefix: "claim",
  message: "Too many claim attempts. Please slow down.",
  keyGenerator: (req) => req.user?.userId || req.ip
});
const generalLimiter = createLimiter({
  windowMs: env.RATE_LIMIT_GENERAL_WINDOW_MS,
  max: env.RATE_LIMIT_GENERAL_MAX,
  keyPrefix: "general",
  message: "Too many requests. Please try again later."
});
const tokenVerifyLimiter = createLimiter({
  windowMs: 6e4,
  max: 5,
  keyPrefix: "token-verify",
  message: "Too many verification attempts. Please try again later.",
  keyGenerator: (req) => req.user?.userId || req.ip
});
export {
  authLimiter,
  claimLimiter,
  generalLimiter,
  tokenVerifyLimiter
};
