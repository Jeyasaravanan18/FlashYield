import mongoose, { Schema } from "mongoose";
import { CLAIM_STATUSES } from "../types.js";
const claimSchema = new Schema(
  {
    listingId: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
      index: true
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
      default: 1
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    status: {
      type: String,
      enum: {
        values: CLAIM_STATUSES,
        message: "Status must be one of: reserved, collected, expired, cancelled"
      },
      default: "reserved",
      index: true
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    claimedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    collectedAt: {
      type: Date,
      default: null
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const obj = ret;
        delete obj.__v;
        return obj;
      }
    }
  }
);
claimSchema.index({ listingId: 1, customerId: 1 });
claimSchema.index({ customerId: 1, status: 1 });
const Claim = mongoose.model("Claim", claimSchema);
export {
  Claim
};
