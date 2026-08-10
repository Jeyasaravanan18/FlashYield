import { AuditLog } from "../models/AuditLog.js";
import { logger } from "../utils/logger.js";
const auditService = {
  /**
   * Create an audit log entry. Non-blocking — errors are logged but don't
   * propagate to the caller (audit logging should never fail a request).
   */
  async log(input) {
    try {
      await AuditLog.create({
        action: input.action,
        actorId: input.actorId,
        actorRole: input.actorRole,
        targetType: input.targetType,
        targetId: input.targetId || null,
        metadata: input.metadata || {},
        ipAddress: input.ipAddress || null,
        timestamp: /* @__PURE__ */ new Date()
      });
    } catch (err) {
      logger.error({ err, input }, "Failed to write audit log");
    }
  },
  /**
   * Query audit logs with pagination and optional filters.
   */
  async query(filters) {
    const query = {};
    if (filters.action) {
      query.action = filters.action;
    }
    if (filters.actorId) {
      query.actorId = filters.actorId;
    }
    const total = await AuditLog.countDocuments(query);
    const data = await AuditLog.find(query).sort({ timestamp: -1 }).skip((filters.page - 1) * filters.limit).limit(filters.limit).lean();
    return {
      data,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit)
      }
    };
  }
};
export {
  auditService
};
