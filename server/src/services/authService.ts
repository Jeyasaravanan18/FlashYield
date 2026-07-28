import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, IUser } from '../models/User';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import {
  BadRequestError,
  UnauthorizedError,
  ConflictError,
} from '../utils/errors';
import { UserRole } from '../types';
import { auditService } from './auditService';

const BCRYPT_COST_FACTOR = 12;

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface AuthResult {
  user: {
    id: string;
    email: string;
    role: UserRole;
    emailVerified: boolean;
  };
  tokens: TokenPair;
}

function generateAccessToken(user: IUser): string {
  return jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRY as any },
  );
}

function generateRefreshToken(user: IUser): string {
  return jwt.sign(
    {
      userId: user._id.toString(),
      tokenId: crypto.randomBytes(16).toString('hex'),
    },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRY as any },
  );
}

async function hashRefreshToken(token: string): Promise<string> {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export const authService = {
  /**
   * Register a new user. Hashes password with bcrypt (cost 12).
   * Returns user info and JWT token pair.
   */
  async register(
    email: string,
    password: string,
    role: UserRole = 'customer',
    ipAddress?: string,
  ): Promise<AuthResult> {
    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ConflictError('An account with this email already exists');
    }

    // Don't allow self-registration as admin
    if (role === 'admin') {
      throw new BadRequestError('Cannot register as admin');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_COST_FACTOR);

    // Create user
    const user = await User.create({
      email,
      passwordHash,
      role,
      emailVerified: false, // TODO: implement email verification flow
    });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token hash
    const tokenHash = await hashRefreshToken(refreshToken);
    user.refreshTokenHash = tokenHash;
    user.lastLoginAt = new Date();
    await user.save();

    // Audit log
    await auditService.log({
      action: 'user_register',
      actorId: user._id,
      actorRole: user.role,
      targetType: 'User',
      targetId: user._id,
      metadata: { email: user.email, role: user.role },
      ipAddress: ipAddress || null,
    });

    logger.info({ userId: user._id, role: user.role }, 'User registered');

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      tokens: { accessToken, refreshToken },
    };
  },

  /**
   * Authenticate a user with email + password.
   * Returns user info and JWT token pair.
   */
  async login(
    email: string,
    password: string,
    ipAddress?: string,
  ): Promise<AuthResult> {
    // Find user with password hash included
    const user = await User.findOne({ email }).select('+passwordHash');

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate new tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store new refresh token hash (rotates old one)
    const tokenHash = await hashRefreshToken(refreshToken);
    user.refreshTokenHash = tokenHash;
    user.lastLoginAt = new Date();
    await user.save();

    // Audit log
    await auditService.log({
      action: 'user_login',
      actorId: user._id,
      actorRole: user.role,
      targetType: 'User',
      targetId: user._id,
      metadata: { email: user.email },
      ipAddress: ipAddress || null,
    });

    logger.info({ userId: user._id }, 'User logged in');

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      tokens: { accessToken, refreshToken },
    };
  },

  /**
   * Refresh tokens. Verifies the existing refresh token, checks the
   * stored hash (rotation), and issues a new token pair.
   * The old refresh token is invalidated.
   */
  async refreshTokens(currentRefreshToken: string): Promise<TokenPair> {
    let decoded: { userId: string };

    try {
      decoded = jwt.verify(currentRefreshToken, env.JWT_REFRESH_SECRET) as {
        userId: string;
      };
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Find user with refresh token hash
    const user = await User.findById(decoded.userId).select('+refreshTokenHash');
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Verify refresh token hash matches stored hash (rotation check)
    const currentHash = await hashRefreshToken(currentRefreshToken);
    if (user.refreshTokenHash !== currentHash) {
      // Token reuse detected — possible theft. Invalidate all sessions.
      user.refreshTokenHash = null;
      await user.save();
      logger.warn(
        { userId: user._id },
        'Refresh token reuse detected — all sessions invalidated',
      );
      throw new UnauthorizedError('Refresh token has been revoked (possible token theft detected)');
    }

    // Issue new token pair
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Rotate: store new refresh token hash
    const newHash = await hashRefreshToken(refreshToken);
    user.refreshTokenHash = newHash;
    await user.save();

    return { accessToken, refreshToken };
  },

  /**
   * Logout — invalidates the stored refresh token hash.
   */
  async logout(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { refreshTokenHash: null });
    logger.info({ userId }, 'User logged out');
  },

  /**
   * Get user profile by ID.
   */
  async getProfile(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }
    return {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };
  },
};
