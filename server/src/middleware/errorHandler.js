import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
function globalErrorHandler(err, req, res, _next) {
  const logContext = {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.userId
  };
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ ...logContext, err }, err.message);
    } else {
      logger.warn({ ...logContext, code: err.code }, err.message);
    }
    const body = {
      error: {
        code: err.code,
        message: err.message
      }
    };
    res.status(err.statusCode).json(body);
    return;
  }
  if (err.name === "ValidationError") {
    logger.warn({ ...logContext, err }, "Mongoose validation error");
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: err.message
      }
    });
    return;
  }
  if (err.code === 11e3) {
    logger.warn({ ...logContext, err }, "Duplicate key error");
    const keyPattern = err.keyPattern || {};
    const isAccountEmail = Object.prototype.hasOwnProperty.call(keyPattern, "email");
    res.status(409).json({
      error: {
        code: "DUPLICATE_KEY",
        message: isAccountEmail ? "An account with this email already exists for this role" : "A resource with this value already exists"
      }
    });
    return;
  }
  if (err.type === "entity.parse.failed") {
    res.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "Request body contains invalid JSON"
      }
    });
    return;
  }
  logger.error({ ...logContext, err }, "Unhandled error");
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: process.env.NODE_ENV === "production" ? "An unexpected error occurred" : err.message
    }
  });
}
export {
  globalErrorHandler
};
