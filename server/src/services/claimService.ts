import crypto from 'crypto';
import mongoose from 'mongoose';
import { Listing } from '../models/Listing';
import { Claim, IClaim } from '../models/Claim';
import { MerchantProfile } from '../models/MerchantProfile';
import { getRedisClient } from '../config/redis';
import { logger } from '../utils/logger';
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
  GoneError,
} from '../utils/errors';
import { auditService } from './auditService';
import { emitListingUpdate } from '../socket/emitter';
import { PaginatedResponse } from '../types';

const CLAIM_LOCK_TTL_SECONDS = 5;

/**
 * Acquire a short-lived distributed lock in Redis.
 * Returns true if lock was acquired, false otherwise.
 */
async function acquireLock(key: string, ttlSeconds: number): Promise<boolean> {
  try {
    const redis = getRedisClient();
    const result = await redis.set(key, '1', 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  } catch {
    // If Redis is unavailable, proceed without lock (Mongo atomicity is the primary safeguard)
    logger.warn({ key }, 'Redis lock unavailable — proceeding without distributed lock');
    return true;
  }
}

async function releaseLock(key: string): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.del(key);
  } catch {
    // Non-critical — lock will expire via TTL
  }
}

export const claimService = {
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
  async createClaim(
    customerId: string,
    listingId: string,
    idempotencyKey: string,
  ): Promise<{ claim: IClaim; token: string }> {
    // 1. Idempotency check
    const existingClaim = await Claim.findOne({ idempotencyKey });
    if (existingClaim) {
      logger.info({ idempotencyKey, claimId: existingClaim._id }, 'Idempotent claim returned');
      return { claim: existingClaim, token: existingClaim.token };
    }

    // Validate listingId
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      throw new BadRequestError('Invalid listing ID');
    }

    const lockKey = `claim:lock:${listingId}`;
    let lockAcquired = false;

    try {
      // 2. Acquire distributed lock
      lockAcquired = await acquireLock(lockKey, CLAIM_LOCK_TTL_SECONDS);
      if (!lockAcquired) {
        throw new ConflictError(
          'This listing is being claimed by someone else. Please try again in a moment.',
        );
      }

      // 3. Atomic decrement with guard condition
      const listing = await Listing.findOneAndUpdate(
        {
          _id: listingId,
          status: 'active',
          quantityAvailable: { $gt: 0 },
          claimWindowEnd: { $gt: new Date() },
        },
        {
          $inc: { quantityAvailable: -1 },
        },
        { new: true },
      );

      if (!listing) {
        // Determine the reason for failure
        const original = await Listing.findById(listingId);
        if (!original) {
          throw new NotFoundError('Listing not found');
        }
        if (original.status === 'expired' || original.claimWindowEnd <= new Date()) {
          throw new GoneError('This listing has expired');
        }
        if (original.status === 'cancelled') {
          throw new GoneError('This listing has been cancelled');
        }
        if (original.quantityAvailable <= 0 || original.status === 'sold_out') {
          throw new GoneError('This listing is sold out');
        }
        throw new BadRequestError('Unable to claim this listing');
      }

      // Check if now sold out, update status
      if (listing.quantityAvailable === 0) {
        listing.status = 'sold_out';
        await listing.save();
      }

      // 4. Generate cryptographically random token
      const token = crypto.randomBytes(32).toString('hex');

      // 5. Create claim document
      const claim = await Claim.create({
        listingId: listing._id,
        customerId,
        token,
        status: 'reserved',
        idempotencyKey,
        claimedAt: new Date(),
        expiresAt: listing.claimWindowEnd,
      });

      // Audit
      await auditService.log({
        action: 'claim_created',
        actorId: customerId,
        actorRole: 'customer',
        targetType: 'Claim',
        targetId: claim._id,
        metadata: {
          listingId: listing._id.toString(),
          quantityRemaining: listing.quantityAvailable,
        },
      });

      logger.info(
        {
          claimId: claim._id,
          listingId: listing._id,
          quantityRemaining: listing.quantityAvailable,
          event: 'claim_attempt',
          success: true,
        },
        'Claim created successfully',
      );

      // 7. Emit real-time update
      emitListingUpdate(listing._id.toString(), {
        quantityAvailable: listing.quantityAvailable,
        status: listing.status,
      });

      return { claim, token };
    } finally {
      // 6. Release lock
      if (lockAcquired) {
        await releaseLock(lockKey);
      }
    }
  },

  /**
   * Cancel a claim. Restores the listing quantity atomically.
   */
  async cancelClaim(claimId: string, customerId: string): Promise<IClaim> {
    const claim = await Claim.findOne({
      _id: claimId,
      customerId,
      status: 'reserved',
    });

    if (!claim) {
      throw new NotFoundError('Claim not found, not yours, or already collected/cancelled');
    }

    // Restore stock only when the pickup window is still open. A cancellation
    // must never bring an expired or merchant-cancelled offer back to life.
    const listing = await Listing.findOneAndUpdate(
      {
        _id: claim.listingId,
        status: { $in: ['active', 'sold_out'] },
        claimWindowEnd: { $gt: new Date() },
      },
      { $inc: { quantityAvailable: 1 }, $set: { status: 'active' } },
      { new: true },
    );

    claim.status = 'cancelled';
    await claim.save();

    await auditService.log({
      action: 'claim_cancelled',
      actorId: customerId,
      actorRole: 'customer',
      targetType: 'Claim',
      targetId: claim._id,
      metadata: { listingId: claim.listingId.toString() },
    });

    // Emit update
    if (listing) {
      emitListingUpdate(listing._id.toString(), {
        quantityAvailable: listing.quantityAvailable,
        status: listing.status,
      });
    }

    logger.info({ claimId, listingId: claim.listingId }, 'Claim cancelled');

    return claim;
  },

  /**
   * Get a customer's claims with pagination.
   */
  async getCustomerClaims(
    customerId: string,
    params: { page: number; limit: number; status?: string },
  ): Promise<PaginatedResponse<IClaim>> {
    const query: any = { customerId };
    if (params.status) {
      query.status = params.status;
    }

    const total = await Claim.countDocuments(query);
    const data = await Claim.find(query)
      .populate({
        path: 'listingId',
        select: 'title imageUrl discountedPrice originalPrice claimWindowEnd merchantId',
        populate: {
          path: 'merchantId',
          select: 'businessName address location',
        },
      })
      .sort({ claimedAt: -1 })
      .skip((params.page - 1) * params.limit)
      .limit(params.limit)
      .lean();

    return {
      data: data as unknown as IClaim[],
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    };
  },

  /**
   * Verify a pickup token. Merchant-authenticated, rate-limited.
   * Marks the claim as collected. Single-use.
   */
  async verifyToken(
    token: string,
    merchantUserId: string,
    ipAddress?: string,
  ): Promise<IClaim> {
    // Find claim by token
    const claim = await Claim.findOne({ token }).populate('listingId');

    if (!claim) {
      await auditService.log({
        action: 'token_verification_failure',
        actorId: merchantUserId,
        actorRole: 'merchant',
        targetType: 'Claim',
        metadata: { reason: 'token_not_found', tokenPrefix: token.substring(0, 8) },
        ipAddress,
      });
      throw new NotFoundError('Invalid token');
    }

    // Verify the listing belongs to this merchant
    const merchant = await MerchantProfile.findOne({ userId: merchantUserId });
    if (!merchant) {
      throw new NotFoundError('Merchant profile not found');
    }

    const listing = claim.listingId as any;
    if (listing.merchantId.toString() !== merchant._id.toString()) {
      await auditService.log({
        action: 'token_verification_failure',
        actorId: merchantUserId,
        actorRole: 'merchant',
        targetType: 'Claim',
        targetId: claim._id,
        metadata: { reason: 'wrong_merchant' },
        ipAddress,
      });
      throw new ForbiddenError('This token does not belong to your store');
    }

    // Check claim status
    if (claim.status === 'collected') {
      await auditService.log({
        action: 'token_verification_failure',
        actorId: merchantUserId,
        actorRole: 'merchant',
        targetType: 'Claim',
        targetId: claim._id,
        metadata: { reason: 'already_collected' },
        ipAddress,
      });
      throw new ConflictError('This token has already been used');
    }

    if (claim.status === 'expired' || claim.expiresAt <= new Date()) {
      await auditService.log({
        action: 'token_verification_failure',
        actorId: merchantUserId,
        actorRole: 'merchant',
        targetType: 'Claim',
        targetId: claim._id,
        metadata: { reason: 'expired' },
        ipAddress,
      });
      throw new GoneError('This token has expired');
    }

    if (claim.status === 'cancelled') {
      await auditService.log({
        action: 'token_verification_failure',
        actorId: merchantUserId,
        actorRole: 'merchant',
        targetType: 'Claim',
        targetId: claim._id,
        metadata: { reason: 'cancelled' },
        ipAddress,
      });
      throw new GoneError('This claim has been cancelled');
    }

    // Mark as collected
    claim.status = 'collected';
    claim.collectedAt = new Date();
    await claim.save();

    await auditService.log({
      action: 'token_verification_success',
      actorId: merchantUserId,
      actorRole: 'merchant',
      targetType: 'Claim',
      targetId: claim._id,
      metadata: {
        customerId: claim.customerId.toString(),
        listingId: claim.listingId.toString(),
      },
      ipAddress,
    });

    logger.info(
      { claimId: claim._id, merchantId: merchant._id },
      'Token verified — pickup collected',
    );

    return claim;
  },
};
