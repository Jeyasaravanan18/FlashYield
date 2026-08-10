import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User } from "../models/User.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import {
  BadRequestError,
  UnauthorizedError,
  ConflictError
} from "../utils/errors.js";
import { auditService } from "./auditService.js";
const BCRYPT_COST_FACTOR = 12;
function createAuthResult(user) {
  return {
    user: { id: user._id.toString(), email: user.email, role: user.role, emailVerified: user.emailVerified },
    tokens: { accessToken: generateAccessToken(user), refreshToken: generateRefreshToken(user) }
  };
}
function generateAccessToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
      email: user.email
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRY }
  );
}
function generateRefreshToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      tokenId: crypto.randomBytes(16).toString("hex")
    },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRY }
  );
}
async function hashRefreshToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
const authService = {
  /**
   * Register a new user. Hashes password with bcrypt (cost 12).
   * Returns user info and JWT token pair.
   */
  async register(email, password, role = "customer", ipAddress) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ConflictError("An account with this email already exists");
    }
    if (role === "admin") {
      throw new BadRequestError("Cannot register as admin");
    }
    const passwordHash = await bcrypt.hash(password, BCRYPT_COST_FACTOR);
    const user = await User.create({
      email,
      passwordHash,
      role,
      emailVerified: false
      // TODO: implement email verification flow
    });
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const tokenHash = await hashRefreshToken(refreshToken);
    user.refreshTokenHash = tokenHash;
    user.lastLoginAt = /* @__PURE__ */ new Date();
    await user.save();
    await auditService.log({
      action: "user_register",
      actorId: user._id,
      actorRole: user.role,
      targetType: "User",
      targetId: user._id,
      metadata: { email: user.email, role: user.role },
      ipAddress: ipAddress || null
    });
    logger.info({ userId: user._id, role: user.role }, "User registered");
    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified
      },
      tokens: { accessToken, refreshToken }
    };
  },
  /**
   * Authenticate a user with email + password.
   * Returns user info and JWT token pair.
   */
  async login(email, password, ipAddress) {
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError("Invalid email or password");
    }
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const tokenHash = await hashRefreshToken(refreshToken);
    user.refreshTokenHash = tokenHash;
    user.lastLoginAt = /* @__PURE__ */ new Date();
    await user.save();
    await auditService.log({
      action: "user_login",
      actorId: user._id,
      actorRole: user.role,
      targetType: "User",
      targetId: user._id,
      metadata: { email: user.email },
      ipAddress: ipAddress || null
    });
    logger.info({ userId: user._id }, "User logged in");
    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified
      },
      tokens: { accessToken, refreshToken }
    };
  },
  /**
   * Exchanges a Google Identity Services ID token for a local session.
   * Google tokeninfo verifies Google's signature; audience, issuer, expiry,
   * and verified email are checked again before any local account is created.
   */
  async loginWithGoogle(idToken, ipAddress) {
    if (!env.GOOGLE_CLIENT_ID) throw new BadRequestError("Google sign-in is not configured on this server");
    let token;
    try {
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
      if (!response.ok) throw new Error("Google rejected token");
      token = await response.json();
    } catch {
      throw new UnauthorizedError("Google sign-in token could not be verified");
    }
    const isVerifiedEmail = token.email_verified === true || token.email_verified === "true";
    const trustedIssuer = token.iss === "accounts.google.com" || token.iss === "https://accounts.google.com";
    if (token.aud !== env.GOOGLE_CLIENT_ID || !token.sub || !token.email || !isVerifiedEmail || !trustedIssuer || Number(token.exp) * 1e3 <= Date.now()) {
      throw new UnauthorizedError("Google sign-in token is invalid for this application");
    }
    const email = token.email.toLowerCase();
    let user = await User.findOne({ $or: [{ googleSubject: token.sub }, { email }] }).select("+passwordHash");
    if (!user) {
      user = await User.create({
        email,
        passwordHash: await bcrypt.hash(crypto.randomBytes(32).toString("hex"), BCRYPT_COST_FACTOR),
        googleSubject: token.sub,
        role: "customer",
        emailVerified: true
      });
    } else if (!user.googleSubject) {
      user.googleSubject = token.sub;
      user.emailVerified = true;
    }
    const result = createAuthResult(user);
    user.refreshTokenHash = await hashRefreshToken(result.tokens.refreshToken);
    user.lastLoginAt = /* @__PURE__ */ new Date();
    await user.save();
    await auditService.log({ action: "user_login", actorId: user._id, actorRole: user.role, targetType: "User", targetId: user._id, metadata: { email, provider: "google" }, ipAddress: ipAddress || null });
    return result;
  },
  /**
   * Refresh tokens. Verifies the existing refresh token, checks the
   * stored hash (rotation), and issues a new token pair.
   * The old refresh token is invalidated.
   */
  async refreshTokens(currentRefreshToken) {
    let decoded;
    try {
      decoded = jwt.verify(currentRefreshToken, env.JWT_REFRESH_SECRET);
    } catch {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }
    const user = await User.findById(decoded.userId).select("+refreshTokenHash");
    if (!user) {
      throw new UnauthorizedError("User not found");
    }
    const currentHash = await hashRefreshToken(currentRefreshToken);
    if (user.refreshTokenHash !== currentHash) {
      user.refreshTokenHash = null;
      await user.save();
      logger.warn(
        { userId: user._id },
        "Refresh token reuse detected \u2014 all sessions invalidated"
      );
      throw new UnauthorizedError("Refresh token has been revoked (possible token theft detected)");
    }
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const newHash = await hashRefreshToken(refreshToken);
    user.refreshTokenHash = newHash;
    await user.save();
    return { accessToken, refreshToken };
  },
  /**
   * Logout — invalidates the stored refresh token hash.
   */
  async logout(userId) {
    await User.findByIdAndUpdate(userId, { refreshTokenHash: null });
    logger.info({ userId }, "User logged out");
  },
  /**
   * Get user profile by ID.
   */
  async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new UnauthorizedError("User not found");
    }
    return {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    };
  }
};
export {
  authService
};
