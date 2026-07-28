/**
 * Claims Engine Unit Tests — TDD
 *
 * These tests validate the core concurrency-sensitive claim logic:
 * - Successful claim decrements quantity
 * - Sold-out listing rejects cleanly
 * - Concurrent claims never over-allocate
 * - Idempotency key prevents double-allocation
 * - Expired/cancelled listings rejected
 * - Cryptographically random token generation
 */

import mongoose from 'mongoose';
import { setupTestDB, clearTestDB, teardownTestDB } from '../fixtures/testDb';
import { testFactory } from '../fixtures/factories';
import { Listing } from '../../src/models/Listing';
import { Claim } from '../../src/models/Claim';

// Mock Redis client (tests run without Redis)
jest.mock('../../src/config/redis', () => ({
  getRedisClient: () => ({
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    ping: jest.fn().mockResolvedValue('PONG'),
  }),
  getRedisPub: jest.fn(),
  getRedisSub: jest.fn(),
  connectRedis: jest.fn(),
  disconnectRedis: jest.fn(),
}));

// Mock Socket.IO emitter
jest.mock('../../src/socket/emitter', () => ({
  emitListingUpdate: jest.fn(),
  emitListingExpired: jest.fn(),
}));

// Mock audit service to avoid side effects
jest.mock('../../src/services/auditService', () => ({
  auditService: {
    log: jest.fn().mockResolvedValue(undefined),
    query: jest.fn(),
  },
}));

import { claimService } from '../../src/services/claimService';

describe('Claims Engine', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('createClaim', () => {
    it('should successfully claim and decrement quantity by 1', async () => {
      const customer = await testFactory.createCustomer();
      const merchantUser = await testFactory.createMerchantUser();
      const merchant = await testFactory.createMerchantProfile(merchantUser._id);
      const listing = await testFactory.createListing(merchant._id, {
        quantityAvailable: 5,
        quantityTotal: 5,
      });

      const result = await claimService.createClaim(
        customer._id.toString(),
        listing._id.toString(),
        'idempotency-key-1',
      );

      expect(result.claim).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.token).toHaveLength(64); // 32 bytes hex = 64 chars
      expect(result.claim.status).toBe('reserved');
      expect(result.claim.listingId.toString()).toBe(listing._id.toString());
      expect(result.claim.customerId.toString()).toBe(customer._id.toString());

      // Verify listing quantity decremented
      const updatedListing = await Listing.findById(listing._id);
      expect(updatedListing!.quantityAvailable).toBe(4);
      expect(updatedListing!.status).toBe('active');
    });

    it('should reject claim on sold-out listing', async () => {
      const customer = await testFactory.createCustomer();
      const merchantUser = await testFactory.createMerchantUser();
      const merchant = await testFactory.createMerchantProfile(merchantUser._id);
      const listing = await testFactory.createListing(merchant._id, {
        quantityAvailable: 0,
        quantityTotal: 5,
        status: 'sold_out',
      });

      await expect(
        claimService.createClaim(
          customer._id.toString(),
          listing._id.toString(),
          'idempotency-key-sold-out',
        ),
      ).rejects.toThrow();
    });

    it('should reject claim on expired listing', async () => {
      const customer = await testFactory.createCustomer();
      const merchantUser = await testFactory.createMerchantUser();
      const merchant = await testFactory.createMerchantProfile(merchantUser._id);
      const listing = await testFactory.createListing(merchant._id, {
        claimWindowStart: new Date(Date.now() - 5000),
        claimWindowEnd: new Date(Date.now() - 1000), // Already expired
        status: 'expired',
      });

      await expect(
        claimService.createClaim(
          customer._id.toString(),
          listing._id.toString(),
          'idempotency-key-expired',
        ),
      ).rejects.toThrow();
    });

    it('should reject claim on cancelled listing', async () => {
      const customer = await testFactory.createCustomer();
      const merchantUser = await testFactory.createMerchantUser();
      const merchant = await testFactory.createMerchantProfile(merchantUser._id);
      const listing = await testFactory.createListing(merchant._id, {
        status: 'cancelled',
      });

      await expect(
        claimService.createClaim(
          customer._id.toString(),
          listing._id.toString(),
          'idempotency-key-cancelled',
        ),
      ).rejects.toThrow();
    });

    it('should return existing claim for duplicate idempotency key (no double-allocation)', async () => {
      const customer = await testFactory.createCustomer();
      const merchantUser = await testFactory.createMerchantUser();
      const merchant = await testFactory.createMerchantProfile(merchantUser._id);
      const listing = await testFactory.createListing(merchant._id, {
        quantityAvailable: 5,
      });

      const idempotencyKey = 'idempotency-duplicate-test';

      // First claim
      const first = await claimService.createClaim(
        customer._id.toString(),
        listing._id.toString(),
        idempotencyKey,
      );

      // Second claim with same key — should return the same claim
      const second = await claimService.createClaim(
        customer._id.toString(),
        listing._id.toString(),
        idempotencyKey,
      );

      expect(second.claim._id.toString()).toBe(first.claim._id.toString());

      // Quantity should only have decremented once
      const updatedListing = await Listing.findById(listing._id);
      expect(updatedListing!.quantityAvailable).toBe(4);
    });

    it('should generate cryptographically random token (not sequential)', async () => {
      const customer = await testFactory.createCustomer();
      const merchantUser = await testFactory.createMerchantUser();
      const merchant = await testFactory.createMerchantProfile(merchantUser._id);
      const listing = await testFactory.createListing(merchant._id, {
        quantityAvailable: 3,
      });

      const tokens: string[] = [];
      for (let i = 0; i < 3; i++) {
        const result = await claimService.createClaim(
          customer._id.toString(),
          listing._id.toString(),
          `token-uniqueness-${i}`,
        );
        tokens.push(result.token);
      }

      // All tokens should be unique
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(3);

      // Tokens should be 64 hex characters (32 bytes)
      for (const token of tokens) {
        expect(token).toMatch(/^[a-f0-9]{64}$/);
      }
    });

    it('should set listing to sold_out when last item is claimed', async () => {
      const customer = await testFactory.createCustomer();
      const merchantUser = await testFactory.createMerchantUser();
      const merchant = await testFactory.createMerchantProfile(merchantUser._id);
      const listing = await testFactory.createListing(merchant._id, {
        quantityAvailable: 1,
        quantityTotal: 1,
      });

      await claimService.createClaim(
        customer._id.toString(),
        listing._id.toString(),
        'last-item-key',
      );

      const updatedListing = await Listing.findById(listing._id);
      expect(updatedListing!.quantityAvailable).toBe(0);
      expect(updatedListing!.status).toBe('sold_out');
    });

    it('should handle 10 concurrent claims on quantity=5 — exactly 5 succeed', async () => {
      const merchantUser = await testFactory.createMerchantUser();
      const merchant = await testFactory.createMerchantProfile(merchantUser._id);
      const listing = await testFactory.createListing(merchant._id, {
        quantityAvailable: 5,
        quantityTotal: 5,
      });

      // Create 10 customers
      const customers = await Promise.all(
        Array.from({ length: 10 }, () => testFactory.createCustomer()),
      );

      // Fire 10 concurrent claim requests
      const results = await Promise.allSettled(
        customers.map((customer, i) =>
          claimService.createClaim(
            customer._id.toString(),
            listing._id.toString(),
            `concurrent-claim-${i}`,
          ),
        ),
      );

      const successes = results.filter((r) => r.status === 'fulfilled');
      const failures = results.filter((r) => r.status === 'rejected');

      expect(successes).toHaveLength(5);
      expect(failures).toHaveLength(5);

      // Verify final state
      const finalListing = await Listing.findById(listing._id);
      expect(finalListing!.quantityAvailable).toBe(0);
      expect(finalListing!.status).toBe('sold_out');

      // Verify exactly 5 claims exist
      const claimCount = await Claim.countDocuments({ listingId: listing._id });
      expect(claimCount).toBe(5);
    });

    it('should set claim expiry to match listing claim window end', async () => {
      const customer = await testFactory.createCustomer();
      const merchantUser = await testFactory.createMerchantUser();
      const merchant = await testFactory.createMerchantProfile(merchantUser._id);
      const claimWindowEnd = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 hours
      const listing = await testFactory.createListing(merchant._id, {
        claimWindowEnd,
      });

      const result = await claimService.createClaim(
        customer._id.toString(),
        listing._id.toString(),
        'expiry-test-key',
      );

      expect(result.claim.expiresAt.getTime()).toBe(claimWindowEnd.getTime());
    });
  });

  describe('cancelClaim', () => {
    it('should restore listing quantity when claim is cancelled', async () => {
      const customer = await testFactory.createCustomer();
      const merchantUser = await testFactory.createMerchantUser();
      const merchant = await testFactory.createMerchantProfile(merchantUser._id);
      const listing = await testFactory.createListing(merchant._id, {
        quantityAvailable: 5,
      });

      const result = await claimService.createClaim(
        customer._id.toString(),
        listing._id.toString(),
        'cancel-test-key',
      );

      // Verify quantity decremented
      let updatedListing = await Listing.findById(listing._id);
      expect(updatedListing!.quantityAvailable).toBe(4);

      // Cancel the claim
      const cancelled = await claimService.cancelClaim(
        result.claim._id.toString(),
        customer._id.toString(),
      );

      expect(cancelled.status).toBe('cancelled');

      // Verify quantity restored
      updatedListing = await Listing.findById(listing._id);
      expect(updatedListing!.quantityAvailable).toBe(5);
    });
  });

  describe('verifyToken', () => {
    it('should mark claim as collected on valid token', async () => {
      const customer = await testFactory.createCustomer();
      const merchantUser = await testFactory.createMerchantUser();
      const merchant = await testFactory.createMerchantProfile(merchantUser._id);
      const listing = await testFactory.createListing(merchant._id);

      const result = await claimService.createClaim(
        customer._id.toString(),
        listing._id.toString(),
        'verify-test-key',
      );

      const verified = await claimService.verifyToken(
        result.token,
        merchantUser._id.toString(),
      );

      expect(verified.status).toBe('collected');
      expect(verified.collectedAt).toBeDefined();
    });

    it('should reject invalid token', async () => {
      const merchantUser = await testFactory.createMerchantUser();
      await testFactory.createMerchantProfile(merchantUser._id);

      await expect(
        claimService.verifyToken('invalid-token', merchantUser._id.toString()),
      ).rejects.toThrow('Invalid token');
    });

    it('should reject already-collected token (single-use)', async () => {
      const customer = await testFactory.createCustomer();
      const merchantUser = await testFactory.createMerchantUser();
      const merchant = await testFactory.createMerchantProfile(merchantUser._id);
      const listing = await testFactory.createListing(merchant._id);

      const result = await claimService.createClaim(
        customer._id.toString(),
        listing._id.toString(),
        'single-use-test',
      );

      // First verification — should succeed
      await claimService.verifyToken(result.token, merchantUser._id.toString());

      // Second verification — should fail
      await expect(
        claimService.verifyToken(result.token, merchantUser._id.toString()),
      ).rejects.toThrow('already been used');
    });
  });
});
