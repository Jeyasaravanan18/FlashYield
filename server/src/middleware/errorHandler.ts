import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { ApiErrorResponse } from '../types';

/**
 * Global error handler — must be registered last in the middleware chain.
 * Formats all errors into a consistent { error: { code, message } } shape.
 */
export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Log the error with request context
  const logContext = {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.userId,
  };

  if (err instanceof AppError) {
    // Operational error — expected, log at warn level
    if (err.statusCode >= 500) {
      logger.error({ ...logContext, err }, err.message);
    } else {
      logger.warn({ ...logContext, code: err.code }, err.message);
    }

    const body: ApiErrorResponse = {
      error: {
        code: err.code,
        message: err.message,
      },
    };

    res.status(err.statusCode).json(body);
    return;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    logger.warn({ ...logContext, err }, 'Mongoose validation error');
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message,
      },
    });
    return;
  }

  // Mongoose duplicate key error
  if ((err as any).code === 11000) {
    logger.warn({ ...logContext, err }, 'Duplicate key error');
    res.status(409).json({
      error: {
        code: 'DUPLICATE_KEY',
        message: 'A resource with this value already exists',
      },
    });
    return;
  }

  // JSON parse error (malformed body)
  if ((err as { type?: string }).type === 'entity.parse.failed') {
    res.status(400).json({
      error: {
        code: 'INVALID_JSON',
        message: 'Request body contains invalid JSON',
      },
    });
    return;
  }

  // Unknown / programmer error — log at error level, don't leak details
  logger.error({ ...logContext, err }, 'Unhandled error');

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message:
        process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : err.message,
    },
  });
}
