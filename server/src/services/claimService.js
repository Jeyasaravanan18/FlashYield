import crypto from "crypto";
import mongoose from "mongoose";
import { Listing } from "../models/Listing.js";
import { Claim } from "../models/Claim.js";
import { MerchantProfile } from "../models/MerchantProfile.js";
import { getRedisClient } from "../config/redis.js";
import { logger } from "../utils/logger.js";
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
  GoneError
} from "../utils/errors.js";
import { auditService } from "./auditService.js";
import { emitListingUpdate } from "../socket/emitter.js";
import { Waitlist } from "../models/Waitlist.js";
const CLAIM_LOCK_TTL_SECONDS = 5;
const CLAIM_TOKEN_TTL_MINUTES = 30;
async function acquireLock(key, ttlSeconds) {
  try {
    const redis = getRedisClient();
    const result = await redis.set(key, "1", "EX", ttlSeconds, "NX");
    return result === "OK";
  } catch {
    logger.warn({ key }, "Redis lock unavailable \u2014 proceeding without distributed lock");
    return true;
  }
}
async function releaseLock(key) {
  try {
    const redis = getRedisClient();
    await redis.del(key);
  } catch {
  }
}
const claimService = {
  /**
   * Create a claim on a listing. This is the core concurrency-safe operation.
   *
   * 1. Check idempotency key — return existing claim if duplicate
   * 2. Acquire Redis distributed lock on the listing
   * 3. Atomic findOneAndUpdate with $gt: 0 check and $inc: -1
   * 4. Generate cryptographically random token
   * 5. Create Claim document
   * 6. Release lock
   * 7. Emit real-time update
   */
  async createClaim(customerId, listingId, quantity = 1, idempotencyKey) {
    const existingClaim = await Claim.findOne({ idempotencyKey });
    if (existingClaim) {
      logger.info({ idempotencyKey, claimId: existingClaim._id }, "Idempotent claim returned");
      return { claim: existingClaim, token: existingClaim.token };
    }
    const { User } = await import("../models/User.js");
    const user = await User.findById(customerId);
    if (!user) throw new NotFoundError("User not found");

    if (user.claimBannedUntil && user.claimBannedUntil > new Date()) {
      throw new ForbiddenError(
        "You are temporarily banned from claiming items due to a recent no-show. Try again later."
      );
    }

    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      throw new BadRequestError("Invalid listing ID");
    }
    const lockKey = `claim:lock:${listingId}`;
    let lockAcquired = false;
    try {
      lockAcquired = await acquireLock(lockKey, CLAIM_LOCK_TTL_SECONDS);
      if (!lockAcquired) {
        throw new ConflictError(
          "This listing is being claimed by someone else. Please try again in a moment."
        );
      }
      const listing = await Listing.findOneAndUpdate(
        {
          _id: listingId,
          status: "active",
          quantityAvailable: { $gte: quantity },
          claimWindowEnd: { $gt: /* @__PURE__ */ new Date() }
        },
        {
          $inc: { quantityAvailable: -quantity }
        },
        { new: true }
      );
      if (!listing) {
        const original = await Listing.findById(listingId);
        if (!original) {
          throw new NotFoundError("Listing not found");
        }
        if (original.status === "expired" || original.claimWindowEnd <= /* @__PURE__ */ new Date()) {
          throw new GoneError("This listing has expired");
        }
        if (original.status === "cancelled") {
          throw new GoneError("This listing has been cancelled");
        }
        if (original.quantityAvailable <= 0 || original.status === "sold_out") {
          throw new GoneError("This listing is sold out");
        }
        if (original.quantityAvailable < quantity) {
          throw new ConflictError(`Only ${original.quantityAvailable} item${original.quantityAvailable === 1 ? "" : "s"} left`);
        }
        throw new BadRequestError("Unable to claim this listing");
      }
      if (listing.quantityAvailable === 0) {
        listing.status = "sold_out";
        await listing.save();
      }
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + CLAIM_TOKEN_TTL_MINUTES * 60 * 1e3);
      const claim = await Claim.create({
        listingId: listing._id,
        customerId,
        quantity,
        token,
        status: "reserved",
        idempotencyKey,
        claimedAt: /* @__PURE__ */ new Date(),
        expiresAt
      });
      await auditService.log({
        action: "claim_created",
        actorId: customerId,
        actorRole: "customer",
        targetType: "Claim",
        targetId: claim._id,
        metadata: {
          listingId: listing._id.toString(),
          quantity,
          quantityRemaining: listing.quantityAvailable
        }
      });
      logger.info(
        {
          claimId: claim._id,
          listingId: listing._id,
          quantityRemaining: listing.quantityAvailable,
          event: "claim_attempt",
          success: true
        },
        "Claim created successfully"
      );
      emitListingUpdate(listing._id.toString(), {
        quantityAvailable: listing.quantityAvailable,
        status: listing.status
      });
      return { claim, token };
    } finally {
      if (lockAcquired) {
        await releaseLock(lockKey);
      }
    }
  },
  /**
   * Cancel a claim. Restores the listing quantity atomically.
   */
  async cancelClaim(claimId, customerId) {
    const claim = await Claim.findOne({
      _id: claimId,
      customerId,
      status: "reserved"
    });
    if (!claim) {
      throw new NotFoundError("Claim not found, not yours, or already collected/cancelled");
    }
    const listing = await Listing.findOneAndUpdate(
      {
        _id: claim.listingId,
        status: { $in: ["active", "sold_out"] },
        claimWindowEnd: { $gt: /* @__PURE__ */ new Date() }
      },
      { $inc: { quantityAvailable: claim.quantity || 1 }, $set: { status: "active" } },
      { new: true }
    );
    claim.status = "cancelled";
    await claim.save();
    await auditService.log({
      action: "claim_cancelled",
      actorId: customerId,
      actorRole: "customer",
      targetType: "Claim",
      targetId: claim._id,
      metadata: { listingId: claim.listingId.toString() }
    });
    if (listing) {
      await Waitlist.findOneAndUpdate(
        { listingId: listing._id, status: "waiting" },
        { status: "notified", notifiedAt: /* @__PURE__ */ new Date() },
        { sort: { createdAt: 1 } }
      );
      emitListingUpdate(listing._id.toString(), {
        quantityAvailable: listing.quantityAvailable,
        status: listing.status
      });
    }
    logger.info({ claimId, listingId: claim.listingId }, "Claim cancelled");
    return claim;
  },
  /**
   * Admin-only: Cancel any active claim and refund inventory.
   */
  async adminCancelClaim(claimId, adminId) {
    const claim = await Claim.findOne({
      _id: claimId,
      status: "reserved"
    });
    if (!claim) {
      throw new NotFoundError("Claim not found or not active");
    }
    const listing = await Listing.findOneAndUpdate(
      {
        _id: claim.listingId,
        status: { $in: ["active", "sold_out"] },
        claimWindowEnd: { $gt: new Date() }
      },
      { $inc: { quantityAvailable: claim.quantity || 1 }, $set: { status: "active" } },
      { new: true }
    );
    claim.status = "cancelled";
    await claim.save();
    await auditService.log({
      action: "admin_cancelled_claim",
      actorId: adminId,
      actorRole: "admin",
      targetType: "Claim",
      targetId: claim._id,
      metadata: { listingId: claim.listingId.toString(), customerId: claim.customerId.toString() }
    });
    if (listing) {
      await Waitlist.findOneAndUpdate(
        { listingId: listing._id, status: "waiting" },
        { status: "notified", notifiedAt: new Date() },
        { sort: { createdAt: 1 } }
      );
      emitListingUpdate(listing._id.toString(), {
        quantityAvailable: listing.quantityAvailable,
        status: listing.status
      });
    }
    logger.info({ claimId, listingId: claim.listingId, adminId }, "Claim cancelled by admin");
    return claim;
  },
  /**
   * Get a customer's claims with pagination.
   */
  async getCustomerClaims(customerId, params) {
    const query = { customerId };
    if (params.status) {
      query.status = params.status;
    }
    const total = await Claim.countDocuments(query);
    const data = await Claim.find(query).populate({
      path: "listingId",
      select: "title imageUrl discountedPrice originalPrice claimWindowEnd merchantId",
      populate: {
        path: "merchantId",
        select: "businessName address location"
      }
    }).sort({ claimedAt: -1 }).skip((params.page - 1) * params.limit).limit(params.limit).lean();
    return {
      data,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit)
      }
    };
  },
  /**
   * Verify a pickup token. Merchant-authenticated, rate-limited.
   * Marks the claim as collected. Single-use.
   */
  async verifyToken(token, merchantUserId, ipAddress) {
    const claim = await Claim.findOne({ token }).populate("listingId");
    if (!claim) {
      await auditService.log({
        action: "token_verification_failure",
        actorId: merchantUserId,
        actorRole: "merchant",
        targetType: "Claim",
        metadata: { reason: "token_not_found", tokenPrefix: token.substring(0, 8) },
        ipAddress
      });
      throw new NotFoundError("Invalid token");
    }
    const merchant = await MerchantProfile.findOne({ userId: merchantUserId });
    if (!merchant) {
      throw new NotFoundError("Merchant profile not found");
    }
    const listing = claim.listingId;
    if (listing.merchantId.toString() !== merchant._id.toString()) {
      await auditService.log({
        action: "token_verification_failure",
        actorId: merchantUserId,
        actorRole: "merchant",
        targetType: "Claim",
        targetId: claim._id,
        metadata: { reason: "wrong_merchant" },
        ipAddress
      });
      throw new ForbiddenError("This token does not belong to your store");
    }
    if (claim.status === "collected") {
      await auditService.log({
        action: "token_verification_failure",
        actorId: merchantUserId,
        actorRole: "merchant",
        targetType: "Claim",
        targetId: claim._id,
        metadata: { reason: "already_collected" },
        ipAddress
      });
      throw new ConflictError("This token has already been used");
    }
    if (claim.status === "expired" || claim.expiresAt <= /* @__PURE__ */ new Date()) {
      await auditService.log({
        action: "token_verification_failure",
        actorId: merchantUserId,
        actorRole: "merchant",
        targetType: "Claim",
        targetId: claim._id,
        metadata: { reason: "expired" },
        ipAddress
      });
      throw new GoneError("This token has expired");
    }
    if (claim.status === "cancelled") {
      await auditService.log({
        action: "token_verification_failure",
        actorId: merchantUserId,
        actorRole: "merchant",
        targetType: "Claim",
        targetId: claim._id,
        metadata: { reason: "cancelled" },
        ipAddress
      });
      throw new GoneError("This claim has been cancelled");
    }
    claim.status = "collected";
    claim.collectedAt = /* @__PURE__ */ new Date();
    await claim.save();
    await auditService.log({
      action: "token_verification_success",
      actorId: merchantUserId,
      actorRole: "merchant",
      targetType: "Claim",
      targetId: claim._id,
        metadata: {
          customerId: claim.customerId.toString(),
          listingId: claim.listingId.toString(),
          quantity: claim.quantity || 1
        },
        ipAddress
      });
    logger.info(
      { claimId: claim._id, merchantId: merchant._id },
      "Token verified \u2014 pickup collected"
    );
    return claim;
  }
};
export {
  claimService
};
