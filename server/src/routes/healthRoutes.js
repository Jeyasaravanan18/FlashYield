import { Router } from "express";
import mongoose from "mongoose";
import { getRedisClient } from "../config/redis.js";
const router = Router();
router.get("/", async (_req, res) => {
  const checks = {
    status: "ok",
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    mongo: "unknown",
    redis: "unknown"
  };
  let healthy = true;
  try {
    const mongoState = mongoose.connection.readyState;
    checks.mongo = mongoState === 1 ? "connected" : "disconnected";
    if (mongoState !== 1) healthy = false;
  } catch {
    checks.mongo = "error";
    healthy = false;
  }
  try {
    const redis = getRedisClient();
    const pong = await redis.ping();
    checks.redis = pong === "PONG" ? "connected" : "error";
  } catch {
    checks.redis = "error";
    healthy = false;
  }
  if (!healthy) {
    checks.status = "degraded";
  }
  res.status(healthy ? 200 : 503).json(checks);
});
export {
  router as healthRouter
};
