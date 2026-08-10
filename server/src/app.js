import express from "express";
import helmet from "helmet";
import cors from "cors";
import pinoHttp from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { requestIdMiddleware } from "./middleware/requestId.js";
import { globalErrorHandler } from "./middleware/errorHandler.js";
import { generalLimiter } from "./middleware/rateLimiter.js";
import { authRouter } from "./routes/authRoutes.js";
import { listingRouter } from "./routes/listingRoutes.js";
import { claimRouter } from "./routes/claimRoutes.js";
import { merchantRouter } from "./routes/merchantRoutes.js";
import { adminRouter } from "./routes/adminRoutes.js";
import { healthRouter } from "./routes/healthRoutes.js";
import { statsRouter } from "./routes/statsRoutes.js";
import { reviewRouter } from "./routes/reviewRoutes.js";
import { analyticsRouter } from "./routes/analyticsRoutes.js";
import { waitlistRouter } from "./routes/waitlistRoutes.js";
import { merchantFeatureRouter } from "./routes/merchantFeatureRoutes.js";
import { uploadRouter } from "./routes/uploadRoutes.js";
const app = express();
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Idempotency-Key"]
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(requestIdMiddleware);
app.use(
  pinoHttp({
    logger,
    customProps: (req) => ({
      requestId: req.id
    }),
    // Don't log health checks in production
    autoLogging: {
      ignore: (req) => req.url === "/api/v1/health"
    }
  })
);
app.use(generalLimiter);
app.use("/api/v1/health", healthRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/listings", listingRouter);
app.use("/api/v1/claims", claimRouter);
app.use("/api/v1/merchants", merchantRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/stats", statsRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/analytics", analyticsRouter);
app.use("/api/v1/waitlist", waitlistRouter);
app.use("/api/v1/merchants/features", merchantFeatureRouter);
app.use("/api/v1/upload", uploadRouter);
app.use((_req, res) => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "The requested endpoint does not exist"
    }
  });
});
app.use(globalErrorHandler);
export {
  app
};
