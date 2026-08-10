import bcrypt from "bcrypt";
import { User } from "../../src/models/User.js";
import { MerchantProfile } from "../../src/models/MerchantProfile.js";
import { Listing } from "../../src/models/Listing.js";
import jwt from "jsonwebtoken";
const TEST_JWT_SECRET = "test_access_secret_that_is_at_least_32_chars_long!!";
const testFactory = {
  async createCustomer(overrides = {}) {
    const passwordHash = await bcrypt.hash("TestPassword1", 4);
    return User.create({
      email: `customer-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`,
      passwordHash,
      role: "customer",
      emailVerified: true,
      ...overrides
    });
  },
  async createMerchantUser(overrides = {}) {
    const passwordHash = await bcrypt.hash("TestPassword1", 4);
    return User.create({
      email: `merchant-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`,
      passwordHash,
      role: "merchant",
      emailVerified: true,
      ...overrides
    });
  },
  async createAdminUser(overrides = {}) {
    const passwordHash = await bcrypt.hash("TestPassword1", 4);
    return User.create({
      email: `admin-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`,
      passwordHash,
      role: "admin",
      emailVerified: true,
      ...overrides
    });
  },
  async createMerchantProfile(userId, overrides = {}) {
    return MerchantProfile.create({
      userId,
      businessName: "Test Bakery",
      description: "A test bakery for unit tests",
      address: "123 Test Street",
      location: {
        type: "Point",
        coordinates: [77.5946, 12.9716]
        // Bangalore coordinates
      },
      phone: "+91-1234567890",
      verificationStatus: "approved",
      ...overrides
    });
  },
  async createListing(merchantProfileId, overrides = {}) {
    const now = /* @__PURE__ */ new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1e3);
    return Listing.create({
      merchantId: merchantProfileId,
      title: "End-of-Day Bread Bundle",
      description: "Assorted fresh breads",
      imageUrl: "https://example.com/bread.jpg",
      category: "bakery",
      originalPrice: 500,
      discountedPrice: 200,
      quantityTotal: 5,
      quantityAvailable: 5,
      claimWindowStart: now,
      claimWindowEnd: twoHoursLater,
      status: "active",
      ...overrides
    });
  },
  /**
   * Generate a JWT access token for testing.
   */
  generateTestToken(user) {
    return jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
        email: user.email
      },
      TEST_JWT_SECRET,
      { expiresIn: "15m" }
    );
  }
};
export {
  TEST_JWT_SECRET,
  testFactory
};
