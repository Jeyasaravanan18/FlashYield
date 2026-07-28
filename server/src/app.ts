import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './utils/logger';
import { requestIdMiddleware } from './middleware/requestId';
import { globalErrorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';

// Route imports
import { authRouter } from './routes/authRoutes';
import { listingRouter } from './routes/listingRoutes';
import { claimRouter } from './routes/claimRoutes';
import { merchantRouter } from './routes/merchantRoutes';
import { adminRouter } from './routes/adminRoutes';
import { healthRouter } from './routes/healthRoutes';
import { statsRouter } from './routes/statsRoutes';

const app = express();

// ── Security middleware ──
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Idempotency-Key'],
  }),
);

// ── Request parsing ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Observability ──
app.use(requestIdMiddleware);
app.use(
  pinoHttp({
    logger,
    customProps: (req) => ({
      requestId: req.id,
    }),
    // Don't log health checks in production
    autoLogging: {
      ignore: (req) => req.url === '/api/v1/health',
    },
  }),
);

// ── Global rate limit ──
app.use(generalLimiter);

// ── API Routes ──
app.use('/api/v1/health', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/listings', listingRouter);
app.use('/api/v1/claims', claimRouter);
app.use('/api/v1/merchants', merchantRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/stats', statsRouter);

// ── 404 catch-all ──
app.use((_req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested endpoint does not exist',
    },
  });
});

// ── Global error handler (must be last) ──
app.use(globalErrorHandler);

export { app };
