import Redis from "ioredis";
import RedisMock from "ioredis-mock";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";
let redisClient = null;
let redisPub = null;
let redisSub = null;
function createRedisClient(name) {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    lazyConnect: true,
    retryStrategy(times) {
      if (times > 2) {
        return null;
      }
      return 200;
    }
  });
  client.on("connect", () => {
    logger.info({ name }, `Redis client [${name}] connected`);
  });
  client.on("error", (err) => {
    logger.warn({ name, err: err.message }, `Redis client [${name}] warning`);
  });
  client.on("close", () => {
    logger.warn({ name }, `Redis client [${name}] connection closed`);
  });
  return client;
}
async function connectRedis() {
  try {
    redisClient = createRedisClient("main");
    redisPub = createRedisClient("socketio-pub");
    redisSub = createRedisClient("socketio-sub");
    await Promise.all([
      redisClient.connect(),
      redisPub.connect(),
      redisSub.connect()
    ]);
    logger.info("\u2705 All Redis clients connected");
  } catch (err) {
    logger.warn("Real Redis connection failed. Falling back to in-memory RedisMock.");
    redisClient = new RedisMock();
    redisPub = new RedisMock();
    redisSub = new RedisMock();
    logger.info("\u2705 In-memory RedisMock clients initialized");
  }
}
function getRedisClient() {
  if (!redisClient) {
    throw new Error("Redis client not initialized \u2014 call connectRedis() first");
  }
  return redisClient;
}
function getRedisPub() {
  if (!redisPub) {
    throw new Error("Redis pub client not initialized");
  }
  return redisPub;
}
function getRedisSub() {
  if (!redisSub) {
    throw new Error("Redis sub client not initialized");
  }
  return redisSub;
}
async function disconnectRedis() {
  const clients = [redisClient, redisPub, redisSub].filter(Boolean);
  await Promise.all(clients.map((c) => {
    try {
      return c.quit();
    } catch {
      return Promise.resolve();
    }
  }));
  redisClient = null;
  redisPub = null;
  redisSub = null;
  logger.info("Redis clients disconnected gracefully");
}
export {
  connectRedis,
  disconnectRedis,
  getRedisClient,
  getRedisPub,
  getRedisSub
};
