import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from '../../src/models/User';
import { MerchantProfile } from '../../src/models/MerchantProfile';
import { Listing } from '../../src/models/Listing';
import jwt from 'jsonwebtoken';

const TEST_JWT_SECRET = 'test_access_secret_that_is_at_least_32_chars_long!!';

/**
 * Factory functions for creating test data.
 */
export const testFactory = {
  async createCustomer(overrides: Partial<any> = {}) {
    const passwordHash = await bcrypt.hash('TestPassword1', 4); // Low cost for speed in tests
    return User.create({
      email: `customer-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`,
      passwordHash,
      role: 'customer',
      emailVerified: true,
      ...overrides,
    });
  },

  async createMerchantUser(overrides: Partial<any> = {}) {
    const passwordHash = await bcrypt.hash('TestPassword1', 4);
    return User.create({
      email: `merchant-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`,
      passwordHash,
      role: 'merchant',
      emailVerified: true,
      ...overrides,
    });
  },

  async createAdminUser(overrides: Partial<any> = {}) {
    const passwordHash = await bcrypt.hash('TestPassword1', 4);
    return User.create({
      email: `admin-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`,
      passwordHash,
      role: 'admin',
      emailVerified: true,
      ...overrides,
    });
  },

  async createMerchantProfile(userId: mongoose.Types.ObjectId, overrides: Partial<any> = {}) {
    return MerchantProfile.create({
      userId,
      businessName: 'Test Bakery',
      description: 'A test bakery for unit tests',
      address: '123 Test Street',
      location: {
        type: 'Point',
        coordinates: [77.5946, 12.9716], // Bangalore coordinates
      },
      phone: '+91-1234567890',
      verificationStatus: 'approved',
      ...overrides,
    });
  },

  async createListing(merchantProfileId: mongoose.Types.ObjectId, overrides: Partial<any> = {}) {
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    return Listing.create({
      merchantId: merchantProfileId,
      title: 'End-of-Day Bread Bundle',
      description: 'Assorted fresh breads',
      imageUrl: 'https://example.com/bread.jpg',
      category: 'bakery',
      originalPrice: 500,
      discountedPrice: 200,
      quantityTotal: 5,
      quantityAvailable: 5,
      claimWindowStart: now,
      claimWindowEnd: twoHoursLater,
      status: 'active',
      ...overrides,
    });
  },

  /**
   * Generate a JWT access token for testing.
   */
  generateTestToken(user: { _id: mongoose.Types.ObjectId; role: string; email: string }) {
    return jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
        email: user.email,
      },
      TEST_JWT_SECRET,
      { expiresIn: '15m' },
    );
  },
};

export { TEST_JWT_SECRET };
