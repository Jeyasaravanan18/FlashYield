import Redis from 'ioredis';
import RedisMock from 'ioredis-mock';
import { env } from './env';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;
let redisPub: Redis | null = null;
let redisSub: Redis | null = null;

function createRedisClient(name: string): Redis {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    lazyConnect: true,
    retryStrategy(times: number) {
      if (times > 2) {
        return null; // Stop retrying quickly to trigger fallback
      }
      return 200;
    },
  });

  client.on('connect', () => {
    logger.info({ name }, `Redis client [${name}] connected`);
  });

  client.on('error', (err) => {
    logger.warn({ name, err: err.message }, `Redis client [${name}] warning`);
  });

  client.on('close', () => {
    logger.warn({ name }, `Redis client [${name}] connection closed`);
  });

  return client;
}

export async function connectRedis(): Promise<void> {
  try {
    redisClient = createRedisClient('main');
    redisPub = createRedisClient('socketio-pub');
    redisSub = createRedisClient('socketio-sub');

    await Promise.all([
      redisClient.connect(),
      redisPub.connect(),
      redisSub.connect(),
    ]);

    logger.info('✅ All Redis clients connected');
  } catch (err) {
    logger.warn('Real Redis connection failed. Falling back to in-memory RedisMock.');
    redisClient = new RedisMock() as unknown as Redis;
    redisPub = new RedisMock() as unknown as Redis;
    redisSub = new RedisMock() as unknown as Redis;
    logger.info('✅ In-memory RedisMock clients initialized');
  }
}

export function getRedisClient(): Redis {
  if (!redisClient) {
    throw new Error('Redis client not initialized — call connectRedis() first');
  }
  return redisClient;
}

export function getRedisPub(): Redis {
  if (!redisPub) {
    throw new Error('Redis pub client not initialized');
  }
  return redisPub;
}

export function getRedisSub(): Redis {
  if (!redisSub) {
    throw new Error('Redis sub client not initialized');
  }
  return redisSub;
}

export async function disconnectRedis(): Promise<void> {
  const clients = [redisClient, redisPub, redisSub].filter(Boolean) as Redis[];
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
  logger.info('Redis clients disconnected gracefully');
}

