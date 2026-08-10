import mongoose, { Schema } from "mongoose";
import { AUDIT_ACTIONS } from "../types.js";
const auditLogSchema = new Schema(
  {
    action: {
      type: String,
      enum: {
        values: AUDIT_ACTIONS,
        message: "Invalid audit action"
      },
      required: true,
      index: true
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    actorRole: {
      type: String,
      required: true
    },
    targetType: {
      type: String,
      required: true
    },
    targetId: {
      type: Schema.Types.ObjectId,
      default: null
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    ipAddress: {
      type: String,
      default: null
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    // No timestamps — we use our own 'timestamp' field
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ actorId: 1, timestamp: -1 });
auditLogSchema.index({ targetId: 1, action: 1 });
const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export {
  AuditLog
};
