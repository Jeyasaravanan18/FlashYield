import mongoose, { Schema, Document } from 'mongoose';
import { ClaimStatus, CLAIM_STATUSES } from '../types';

export interface IClaim extends Document {
  _id: mongoose.Types.ObjectId;
  listingId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  token: string;
  status: ClaimStatus;
  idempotencyKey: string;
  claimedAt: Date;
  collectedAt: Date | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const claimSchema = new Schema<IClaim>(
  {
    listingId: {
      type: Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: CLAIM_STATUSES,
        message: 'Status must be one of: reserved, collected, expired, cancelled',
      },
      default: 'reserved',
      index: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    claimedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    collectedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const obj = ret as any;
        delete obj.__v;
        return obj;
      },
    },
  },
);

// Compound indexes for common queries
claimSchema.index({ listingId: 1, customerId: 1 });
claimSchema.index({ customerId: 1, status: 1 });

export const Claim = mongoose.model<IClaim>('Claim', claimSchema);
