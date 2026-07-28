import mongoose from 'mongoose';
import { AuditLog } from '../models/AuditLog';
import { AuditAction } from '../types';
import { logger } from '../utils/logger';

interface AuditLogInput {
  action: AuditAction;
  actorId: mongoose.Types.ObjectId | string;
  actorRole: string;
  targetType: string;
  targetId?: mongoose.Types.ObjectId | string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}

export const auditService = {
  /**
   * Create an audit log entry. Non-blocking — errors are logged but don't
   * propagate to the caller (audit logging should never fail a request).
   */
  async log(input: AuditLogInput): Promise<void> {
    try {
      await AuditLog.create({
        action: input.action,
        actorId: input.actorId,
        actorRole: input.actorRole,
        targetType: input.targetType,
        targetId: input.targetId || null,
        metadata: input.metadata || {},
        ipAddress: input.ipAddress || null,
        timestamp: new Date(),
      });
    } catch (err) {
      // Audit logging failure should never crash the request
      logger.error({ err, input }, 'Failed to write audit log');
    }
  },

  /**
   * Query audit logs with pagination and optional filters.
   */
  async query(filters: {
    action?: string;
    actorId?: string;
    page: number;
    limit: number;
  }) {
    const query: Record<string, unknown> = {};

    if (filters.action) {
      query.action = filters.action;
    }
    if (filters.actorId) {
      query.actorId = filters.actorId;
    }

    const total = await AuditLog.countDocuments(query);
    const data = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip((filters.page - 1) * filters.limit)
      .limit(filters.limit)
      .lean();

    return {
      data,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  },
};
