import { setupTestDB, clearTestDB, teardownTestDB } from "../fixtures/testDb.js";
import { User } from "../../src/models/User.js";
import bcrypt from "bcrypt";
jest.mock("../../src/config/redis", () => ({
  getRedisClient: () => ({
    set: jest.fn().mockResolvedValue("OK"),
    del: jest.fn().mockResolvedValue(1)
  }),
  getRedisPub: jest.fn(),
  getRedisSub: jest.fn(),
  connectRedis: jest.fn(),
  disconnectRedis: jest.fn()
}));
jest.mock("../../src/services/auditService", () => ({
  auditService: {
    log: jest.fn().mockResolvedValue(void 0)
  }
}));
process.env.JWT_ACCESS_SECRET = "test_access_secret_that_is_at_least_32_chars_long!!";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret_that_is_at_least_32_chars_long!";
process.env.JWT_ACCESS_EXPIRY = "15m";
process.env.JWT_REFRESH_EXPIRY = "7d";
process.env.MONGODB_URI = "mongodb://localhost:27017/test";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.CORS_ORIGIN = "http://localhost:5173";
import { authService } from "../../src/services/authService.js";
describe("Auth Service", () => {
  beforeAll(async () => {
    await setupTestDB();
  });
  afterEach(async () => {
    await clearTestDB();
  });
  afterAll(async () => {
    await teardownTestDB();
  });
  describe("register", () => {
    it("should register a new user with hashed password", async () => {
      const result = await authService.register("test@example.com", "StrongPassword1", "customer");
      expect(result.user.email).toBe("test@example.com");
      expect(result.user.role).toBe("customer");
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
      const user = await User.findOne({ email: "test@example.com" }).select("+passwordHash");
      expect(user).toBeDefined();
      const rounds = bcrypt.getRounds(user.passwordHash);
      expect(rounds).toBeGreaterThanOrEqual(12);
    });
    it("should reject duplicate email registration", async () => {
      await authService.register("dup@example.com", "StrongPassword1", "customer");
      await expect(
        authService.register("dup@example.com", "StrongPassword1", "customer")
      ).rejects.toThrow("already exists");
    });
    it("should reject admin self-registration", async () => {
      await expect(
        authService.register("admin@example.com", "StrongPassword1", "admin")
      ).rejects.toThrow("Cannot register as admin");
    });
  });
  describe("login", () => {
    it("should authenticate with correct credentials", async () => {
      await authService.register("login@example.com", "StrongPassword1", "customer");
      const result = await authService.login("login@example.com", "StrongPassword1");
      expect(result.user.email).toBe("login@example.com");
      expect(result.tokens.accessToken).toBeDefined();
    });
    it("should reject invalid password", async () => {
      await authService.register("badpw@example.com", "StrongPassword1", "customer");
      await expect(
        authService.login("badpw@example.com", "WrongPassword1")
      ).rejects.toThrow("Invalid email or password");
    });
    it("should reject non-existent email", async () => {
      await expect(
        authService.login("nobody@example.com", "StrongPassword1")
      ).rejects.toThrow("Invalid email or password");
    });
  });
  describe("refreshTokens", () => {
    it("should issue new token pair and rotate refresh token", async () => {
      const registerResult = await authService.register(
        "refresh@example.com",
        "StrongPassword1",
        "customer"
      );
      const newTokens = await authService.refreshTokens(
        registerResult.tokens.refreshToken
      );
      expect(newTokens.accessToken).toBeDefined();
      expect(newTokens.refreshToken).toBeDefined();
      expect(newTokens.refreshToken).not.toBe(registerResult.tokens.refreshToken);
    });
    it("should detect refresh token reuse and invalidate sessions", async () => {
      const registerResult = await authService.register(
        "reuse@example.com",
        "StrongPassword1",
        "customer"
      );
      const oldToken = registerResult.tokens.refreshToken;
      await authService.refreshTokens(oldToken);
      await expect(authService.refreshTokens(oldToken)).rejects.toThrow("revoked");
    });
  });
  describe("logout", () => {
    it("should clear refresh token hash", async () => {
      const result = await authService.register(
        "logout@example.com",
        "StrongPassword1",
        "customer"
      );
      await authService.logout(result.user.id);
      const user = await User.findById(result.user.id).select("+refreshTokenHash");
      expect(user.refreshTokenHash).toBeNull();
    });
  });
});
