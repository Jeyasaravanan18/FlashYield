import { setupTestDB, clearTestDB, teardownTestDB } from "../fixtures/testDb.js";
import { testFactory } from "../fixtures/factories.js";
import { Listing } from "../../src/models/Listing.js";
import { Claim } from "../../src/models/Claim.js";
jest.mock("../../src/config/redis", () => ({
  getRedisClient: () => ({
    set: jest.fn().mockResolvedValue("OK"),
    del: jest.fn().mockResolvedValue(1),
    ping: jest.fn().mockResolvedValue("PONG")
  }),
  getRedisPub: jest.fn(),
  getRedisSub: jest.fn(),
  connectRedis: jest.fn(),
  disconnectRedis: jest.fn()
}));
jest.mock("../../src/socket/emitter", () => ({
  emitListingUpdate: jest.fn(),
  emitListingExpired: jest.fn()
}));
jest.mock("../../src/services/auditService", () => ({
  auditService: {
    log: jest.fn().mockResolvedValue(void 0),
    query: jest.fn()
  }
}));
import { claimService } from "../../src/services/claimService.js";
describe("Claims Engine", () => {
  beforeAll(async () => {
    await setupTestDB();
  });
  afterEach(async () => {
    await clearTestDB();
  });
  afterAll(async () => {
    await teardownTestDB();
  });
  describe("createClaim", () => {
    it("should successfully claim and decrement quantity by 1", async () => {
      const customer = await testFactory.createCustomer();
      const merchantUser = await testFactory.createMerchantUser();
      const merchant = await testFactory.createMerchantProfile(merchantUser._id);
      const listing = await testFactory.createListing(merchant._id, {
        quantityAvailable: 5,
        quantityTotal: 5
      });
      const result = await claimService.createClaim(
        customer._id.toString(),
        listing._id.toString(),
        "idempotency-key-1"
      );
      expect(result.claim).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.token).toHaveLength(64);
      expect(result.claim.status).toBe("reserved");
      expect(result.claim.listingId.toString()).toBe(listing._id.toString());
      expect(result.claim.customerId.toString()).toBe(customer._id.toString());
      const updatedListing = await Listing.findById(listing._id);
      expect(updatedListing.quantityAvailable).toBe(4);
      expect(updatedListing.status).toBe("active");
    });
    it("should reject claim on sold-out listing", async () => {
      const customer = await testFactory.createCustomer();
      const merchantUser = await testFactory.createMerchantUser();
      const merchant = await testFactory.createMerchantProfile(merchantUser._id);
      const listing = await testFactory.createListing(merchant._id, {
        quantityAvailable: 0,
        quantityTotal: 5,
        status: "sold_out"
      });
      await expect(
        claimService.createClaim(
          customer._id.toString(),
          listing._id.toString(),
          "idempotency-key-sold-out"
        )
      ).rejects.toThrow();
    });
    it("should reject claim on expired listing", async () => {
      const customer = await testFactory.createCustomer();
      const merchantUser = await testFactory.createMerchantUser();
      const merchant = await testFactory.createMerchantProfile(merchantUser._id);
      const listing = await testFactory.createListing(merchant._id, {
        claimWindowStart: new Date(Date.now() - 5e3),
        claimWindowEnd: new Date(Date.now() - 1e3),
        // Already expired
        status: "expired"
      });
      await expect(
        claimService.createClaim(
          customer._id.toString(),
          listing._id.toString(),
          "idempotency-key-expired"
        )
      ).rejects.toThrow();
    });
    it("should reject claim on cancelled listing", async () => {
      const customer = await testFactory.createCustomer();
      const merchantUser = await testFactory.createMerchantUser();
      const merchant = await testFactory.createMerchantProfile(merchantUser._id);
      const listing = await testFactory.createListing(merchant._id, {
        status: "cancelled"
      });
      await expect(
        claimService.createClaim(
          customer._id.toString(),
          listing._id.toString(),
          "idempotency-key-cancelled"
        )
      ).rejects.toThrow();
    });
    it("should return existing claim for duplicate idempotency key (no double-allocation)", async () => {
      const customer = await testFactory.createCustomer();
      const merchantUser = await testFactory.createMerchantUser();
      const merchant = await testFactory.createMerchantProfile(merchantUser._id);
      const listing = await testFactory.createListing(merchant._id, {
        quantityAvailable: 5
      });
      const idempotencyKey = "idempotency-duplicate-test";
      const first = await claimService.createClaim(
        customer._id.toString(),
        listing._id.toString(),
        idempotencyKey
      );
      const second = await claimService.createClaim(
        customer._id.toString(),
        listing._id.toString(),
        idempotencyKey
      );
      expect(second.claim._id.toString()).toBe(first.claim._id.toString());
      const updatedListing = await Listing.findById(listing._id);
      expect(updatedListing.quantityAvailable).toBe(4);
    });
    it("should generate cryptographically random token (not sequential)", async () => {
      const customer = await testFactory.createCustomer();
      const merchantUser = await testFactory.createMerchantUser();
      const merchant = await testFactory.createMerchantProfile(merchantUser._id);
      const listing = await testFactory.createListing(merchant._id, {
        quantityAvailable: 3
      });
      const tokens = [];
      for (let i = 0; i < 3; i++) {
        const result = await claimService.createClaim(
          customer._id.toString(),
          listing._id.toString(),
          `token-uniqueness-${i}`
        );
        tokens.push(result.token);
      }
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(3);
      for (const token of tokens) {
        expect(token).toMatch(/^[a-f0-9]{64}$/);
      }
    });
    it("should set listing to sold_out when last item is claimed", async () => {
      const customer = await testFactory.createCustomer();
      const merchantUser = await testFactory.createMerchantUser();
      const merchant = await testFactory.createMerchantProfile(merchantUser._id);
      const listing = await testFactory.createListing(merchant._id, {
        quantityAvailable: 1,
        quantityTotal: 1
      });
      await claimService.createClaim(
        customer._id.toString(),
        listing._id.toString(),
        "last-item-key"
      );
      const updatedListing = await Listing.findById(listing._id);
      expect(updatedListing.quantityAvailable).toBe(0);
      expect(updatedListing.status).toBe("sold_out");
    });
    it("should handle 10 concurrent claims on quantity=5 \u2014 exactly 5 succeed", async () => {
      const merchantUser = await testFactory.createMerchantUser();
      const merchant = await testFactory.createMerchantProfile(merchantUser._id);
      const listing = await testFactory.createListing(merchant._id, {
        quantityAvailable: 5,
        quantityTotal: 5
      });
      const customers = await Promise.all(
        Array.from({ length: 10 }, () => testFactory.createCustomer())
      );
      const results = await Promise.allSettled(
        customers.map(
          (customer, i) => claimService.createClaim(
            customer._id.toString(),
            listing._id.toString(),
            `concurrent-claim-${i}`
          )
        )
      );
      const successes = results.filter((r) => r.status === "fulfilled");
      const failures = results.filter((r) => r.status === "rejected");
      expect(successes).toHaveLength(5);
      expect(failures).toHaveLength(5);
      const finalListing = await Listing.findById(listing._id);
      expect(finalListing.quantityAvailable).toBe(0);
      expect(finalListing.status).toBe("sold_out");
      const claimCount = await Claim.countDocuments({ listingId: listing._id });
      expect(claimCount).toBe(5);
    });
    it("should set claim expiry to match listing claim window end", async () => {
      const customer = await testFactory.createCustomer();
      const merchantUser = await testFactory.createMerchantUser();
      const merchant = await testFactory.createMerchantProfile(merchantUser._id);
      const claimWindowEnd = new Date(Date.now() + 3 * 60 * 60 * 1e3);
      const listing = await testFactory.createListing(merchant._id, {
        claimWindowEnd
      });
      const result = await claimService.createClaim(
        customer._id.toString(),
        listing._id.toString(),
        "expiry-test-key"
      );
      expect(result.claim.expiresAt.getTime()).toBe(claimWindowEnd.getTime());
    });
  });
  describe("cancelClaim", () => {
    it("should restore listing quantity when claim is cancelled", async () => {
      const customer = await testFactory.createCustomer();
      const merchantUser = await testFactory.createMerchantUser();
      const merchant = await testFactory.createMerchantProfile(merchantUser._id);
      const listing = await testFactory.createListing(merchant._id, {
        quantityAvailable: 5
      });
      const result = await claimService.createClaim(
        customer._id.toString(),
        listing._id.toString(),
        "cancel-test-key"
      );
      let updatedListing = await Listing.findById(listing._id);
      expect(updatedListing.quantityAvailable).toBe(4);
      const cancelled = await claimService.cancelClaim(
        result.claim._id.toString(),
        customer._id.toString()
      );
      expect(cancelled.status).toBe("cancelled");
      updatedListing = await Listing.findById(listing._id);
      expect(updatedListing.quantityAvailable).toBe(5);
    });
  });
  describe("verifyToken", () => {
    it("should mark claim as collected on valid token", async () => {
      const customer = await testFactory.createCustomer();
      const merchantUser = await testFactory.createMerchantUser();
      const merchant = await testFactory.createMerchantProfile(merchantUser._id);
      const listing = await testFactory.createListing(merchant._id);
      const result = await claimService.createClaim(
        customer._id.toString(),
        listing._id.toString(),
        "verify-test-key"
      );
      const verified = await claimService.verifyToken(
        result.token,
        merchantUser._id.toString()
      );
      expect(verified.status).toBe("collected");
      expect(verified.collectedAt).toBeDefined();
    });
    it("should reject invalid token", async () => {
      const merchantUser = await testFactory.createMerchantUser();
      await testFactory.createMerchantProfile(merchantUser._id);
      await expect(
        claimService.verifyToken("invalid-token", merchantUser._id.toString())
      ).rejects.toThrow("Invalid token");
    });
    it("should reject already-collected token (single-use)", async () => {
      const customer = await testFactory.createCustomer();
      const merchantUser = await testFactory.createMerchantUser();
      const merchant = await testFactory.createMerchantProfile(merchantUser._id);
      const listing = await testFactory.createListing(merchant._id);
      const result = await claimService.createClaim(
        customer._id.toString(),
        listing._id.toString(),
        "single-use-test"
      );
      await claimService.verifyToken(result.token, merchantUser._id.toString());
      await expect(
        claimService.verifyToken(result.token, merchantUser._id.toString())
      ).rejects.toThrow("already been used");
    });
  });
});
