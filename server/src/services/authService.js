import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { User } from "../models/User.js";
import { MerchantProfile } from "../models/MerchantProfile.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { BadRequestError, UnauthorizedError, ConflictError, ForbiddenError } from "../utils/errors.js";
import { auditService } from "./auditService.js";
import { geocodingService } from "./geocodingService.js";

const BCRYPT_COST_FACTOR = 12;
const OTP_TTL_MINUTES = 15;

async function buildUserPayload(user) {
  const payload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    emailVerified: user.emailVerified
  };
  if (user.role === "merchant") {
    const mp = await MerchantProfile.findOne({ userId: user._id }).lean();
    if (mp) {
      payload.merchantProfile = {
        businessName: mp.businessName,
        address: mp.address,
        phone: mp.phone,
        location: mp.location
      };
    }
  }
  return payload;
}

async function createAuthResult(user) {
  return {
    user: await buildUserPayload(user),
    tokens: {
      accessToken: generateAccessToken(user),
      refreshToken: generateRefreshToken(user)
    }
  };
}

function generateAccessToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), role: user.role, email: user.email },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRY }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), tokenId: crypto.randomBytes(16).toString("hex") },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRY }
  );
}

async function hashValue(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function buildOtpMessage({ purpose, code, minutes }) {
  const heading = purpose === "reset" ? "Reset your FlashYield password" : "Verify your FlashYield account";
  const body =
    purpose === "reset"
      ? `Use this one-time code to reset your password: ${code}`
      : `Use this one-time code to verify your email address: ${code}`;
  return [
    `Subject: ${heading}`,
    "",
    body,
    "",
    `This code expires in ${minutes} minutes.`,
    "If you did not request this, you can ignore this email."
  ].join("\n");
}

function isSmtpConfigured() {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS || !env.SMTP_FROM) {
    return false;
  }
  return true;
}

function getMailTransport() {
  if (!isSmtpConfigured()) return null;
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT || 587,
    secure: env.SMTP_SECURE ?? false,
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
    family: 4, // Force IPv4 to prevent ENETUNREACH on Render
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  });
}

async function sendOtpEmail(to, purpose, code) {
  const transporter = getMailTransport();
  const message = buildOtpMessage({ purpose, code, minutes: OTP_TTL_MINUTES });
  if (!transporter) {
    logger.warn({ to, purpose }, "SMTP not configured; OTP cannot be emailed");
    if (env.NODE_ENV !== "production") {
      logger.warn({ to, purpose, code }, "OTP logged for local development");
    }
    return { sent: false, reason: "not_configured" };
  }
  await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject: purpose === "reset" ? "Reset your FlashYield password" : "Verify your FlashYield account",
    text: message
  });
  return { sent: true };
}

function queueOtpEmail(to, purpose, code) {
  setImmediate(() => {
    sendOtpEmail(to, purpose, code)
      .then(() => logger.info({ to, purpose }, "OTP email queued successfully"))
      .catch((err) => logger.error({ err, to, purpose }, "OTP email delivery failed"));
  });
}

async function issueOtp(user, purpose, options = {}) {
  const waitForDelivery = options.waitForDelivery ?? env.NODE_ENV === "production";
  const code = generateOtp();
  const codeHash = await hashValue(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
  if (purpose === "verify") {
    user.emailVerificationCodeHash = codeHash;
    user.emailVerificationCodeExpiresAt = expiresAt;
  } else {
    user.passwordResetCodeHash = codeHash;
    user.passwordResetCodeExpiresAt = expiresAt;
  }
  await user.save();
  const deliveryPurpose = purpose === "verify" ? "verify" : "reset";
  if (waitForDelivery) {
    try {
      const delivery = await sendOtpEmail(user.email, deliveryPurpose, code);
      return { expiresAt, delivery };
    } catch (err) {
      logger.error({ err, to: user.email, purpose: deliveryPurpose }, "OTP email delivery failed");
      return { expiresAt, delivery: { sent: false, reason: "send_failed" } };
    }
  }
  queueOtpEmail(user.email, deliveryPurpose, code);
  return { expiresAt, delivery: { sent: true, queued: true } };
}

function otpDeliveryMessage(delivery, fallbackMessage) {
  if (delivery?.sent) return fallbackMessage;
  if (delivery?.reason === "not_configured") {
    return "Email delivery is not configured on the server. Add SMTP settings and redeploy, then resend the code.";
  }
  return "The account was saved, but the verification email could not be delivered. Check SMTP settings and resend the code.";
}

function assertOtpValid(user, purpose, code) {
  const now = Date.now();
  const hash = crypto.createHash("sha256").update(code).digest("hex");
  if (purpose === "verify") {
    if (!user.emailVerificationCodeHash || !user.emailVerificationCodeExpiresAt || user.emailVerificationCodeExpiresAt.getTime() < now) {
      throw new BadRequestError("Verification code has expired. Request a new code.");
    }
    if (user.emailVerificationCodeHash !== hash) {
      throw new BadRequestError("Invalid verification code");
    }
  } else {
    if (!user.passwordResetCodeHash || !user.passwordResetCodeExpiresAt || user.passwordResetCodeExpiresAt.getTime() < now) {
      throw new BadRequestError("Reset code has expired. Request a new code.");
    }
    if (user.passwordResetCodeHash !== hash) {
      throw new BadRequestError("Invalid reset code");
    }
  }
}

async function createMerchantProfileForUser(user, profileData) {
  if (user.role !== "merchant" || !profileData || !profileData.businessName || !profileData.address || !profileData.phone) {
    return null;
  }
  const existing = await MerchantProfile.findOne({ userId: user._id });
  if (existing) return existing;
  let geocoded = await Promise.race([
    geocodingService.geocodeAddress(profileData.address),
    new Promise((resolve) => setTimeout(() => resolve(null), 1200))
  ]);
  if (!geocoded) {
    geocoded = { lat: 12.9716, lng: 77.5946 };
  }
  return MerchantProfile.create({
    userId: user._id,
    businessName: profileData.businessName,
    description: profileData.description || "",
    address: profileData.address,
    location: {
      type: "Point",
      coordinates: [geocoded.lng, geocoded.lat]
    },
    phone: profileData.phone,
    operatingHours: [],
    verificationStatus: "pending"
  });
}

const authService = {
  async register(email, password, role = "customer", firstName, lastName, phone, ipAddress, merchantProfile = null) {
    const normalizedEmail = normalizeEmail(email);
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new ConflictError(`An account with this email already exists`);
    }
    if (role === "admin") {
      throw new BadRequestError("Cannot register as admin");
    }
    const passwordHash = await bcrypt.hash(password, BCRYPT_COST_FACTOR);
    const user = await User.create({
      email: normalizedEmail,
      passwordHash,
      role,
      firstName,
      lastName,
      phone,
      emailVerified: false
    });

    await createMerchantProfileForUser(user, merchantProfile);
    const { delivery } = await issueOtp(user, "verify");

    await auditService.log({
      action: "user_register",
      actorId: user._id,
      actorRole: user.role,
      targetType: "User",
      targetId: user._id,
      metadata: { email: user.email, role: user.role },
      ipAddress: ipAddress || null
    });
    logger.info({ userId: user._id, role: user.role }, "User registered; verification code issued");

    const userPayload = await buildUserPayload(user);
    userPayload.verificationRequired = true;
    return {
      user: userPayload,
      otpDelivery: delivery,
      message: otpDeliveryMessage(delivery, "Account created. Check your email for a verification code.")
    };
  },

  async login(email, password, ipAddress) {
    const normalizedEmail = normalizeEmail(email);
    const candidates = await User.find({ email: normalizedEmail }).select("+passwordHash");
    if (candidates.length === 0) {
      throw new UnauthorizedError("Invalid email or password");
    }
    let user = null;
    for (const candidate of candidates) {
      const isMatch = await bcrypt.compare(password, candidate.passwordHash);
      if (isMatch) { user = candidate; break; }
    }
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }
    if (user.status === "suspended") {
      throw new ForbiddenError("Your account has been suspended. Please contact support.");
    }
    if (!user.emailVerified) {
      const { delivery } = await issueOtp(user, "verify");
      throw new BadRequestError(otpDeliveryMessage(delivery, "Please verify your email before signing in. A new code has been sent."));
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    user.refreshTokenHash = await hashValue(refreshToken);
    user.lastLoginAt = new Date();
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
      user: await buildUserPayload(user),
      tokens: { accessToken, refreshToken }
    };
  },

  async loginWithGoogle(idToken, ipAddress, requestedRole, firstName, lastName, phone, merchantProfile = null, isLogin = false) {
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
    if (token.aud !== env.GOOGLE_CLIENT_ID || !token.sub || !token.email || !isVerifiedEmail || !trustedIssuer || Number(token.exp) * 1000 <= Date.now()) {
      throw new UnauthorizedError("Google sign-in token is invalid for this application");
    }
    const email = normalizeEmail(token.email);
    const roleToUse = requestedRole || "customer";
    let user = await User.findOne({ googleSubject: token.sub }).select("+passwordHash");
    if (!user) {
      user = await User.findOne({ email }).select("+passwordHash");
      if (!user) {
        if (isLogin) {
          throw new UnauthorizedError("Account not found. Please register to create a new account.");
        }
        if (requestedRole === "merchant" && !merchantProfile) {
          throw new BadRequestError("Merchant details are required to create a new merchant account.");
        }
        user = await User.create({
          email,
          passwordHash: await bcrypt.hash(crypto.randomBytes(32).toString("hex"), BCRYPT_COST_FACTOR),
          googleSubject: token.sub,
          role: roleToUse,
          firstName: firstName || token.given_name || null,
          lastName: lastName || token.family_name || null,
          phone: phone || null,
          emailVerified: true
        });
        await createMerchantProfileForUser(user, merchantProfile);
      } else {
        // User exists with email for the selected role
        if (!user.googleSubject) {
          user.googleSubject = token.sub;
          user.emailVerified = true;
        }
      }
    } else {
      // User exists with googleSubject for the selected role
    }
    
    if (user.status === "suspended") {
      throw new ForbiddenError("Your account has been suspended. Please contact support.");
    }
    
    await createMerchantProfileForUser(user, merchantProfile);
    const result = await createAuthResult(user);
    user.refreshTokenHash = await hashValue(result.tokens.refreshToken);
    user.lastLoginAt = new Date();
    await user.save();
    await auditService.log({
      action: "user_login",
      actorId: user._id,
      actorRole: user.role,
      targetType: "User",
      targetId: user._id,
      metadata: { email, provider: "google" },
      ipAddress: ipAddress || null
    });
    return result;
  },

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
    if (user.status === "suspended") {
      throw new ForbiddenError("Your account has been suspended.");
    }
    const currentHash = await hashValue(currentRefreshToken);
    if (user.refreshTokenHash !== currentHash) {
      user.refreshTokenHash = null;
      await user.save();
      logger.warn({ userId: user._id }, "Refresh token reuse detected — all sessions invalidated");
      throw new UnauthorizedError("Refresh token has been revoked (possible token theft detected)");
    }
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    user.refreshTokenHash = await hashValue(refreshToken);
    await user.save();
    return { accessToken, refreshToken };
  },

  async logout(userId) {
    await User.findByIdAndUpdate(userId, { refreshTokenHash: null });
    logger.info({ userId }, "User logged out");
  },

  async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new UnauthorizedError("User not found");
    }
    const payload = await buildUserPayload(user);
    payload.createdAt = user.createdAt;
    payload.lastLoginAt = user.lastLoginAt;
    return payload;
  },

  async updateProfile(userId, { firstName, lastName, phone, merchantProfile }) {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError("User not found");

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    await user.save();

    if (user.role === "merchant" && merchantProfile) {
      await MerchantProfile.updateOne(
        { userId: user._id },
        { $set: merchantProfile }
      );
    }

    const payload = await buildUserPayload(user);
    payload.createdAt = user.createdAt;
    payload.lastLoginAt = user.lastLoginAt;
    return payload;
  },

  async requestEmailVerification(email) {
    const user = await User.findOne({ email: normalizeEmail(email) });
    if (!user) {
      return { message: "If that email exists, a verification code has been sent." };
    }
    if (user.emailVerified) {
      return { message: "Email is already verified." };
    }
    const { expiresAt, delivery } = await issueOtp(user, "verify");
    return { message: otpDeliveryMessage(delivery, "Verification code sent."), expiresAt, emailSent: !!delivery?.sent };
  },

  async verifyEmail(email, code) {
    const user = await User.findOne({ email: normalizeEmail(email) }).select("+emailVerificationCodeHash");
    if (!user) {
      throw new BadRequestError("Invalid verification request");
    }
    assertOtpValid(user, "verify", String(code));
    user.emailVerified = true;
    user.emailVerificationCodeHash = null;
    user.emailVerificationCodeExpiresAt = null;
    await user.save();
    return { message: "Email verified successfully" };
  },

  async requestPasswordReset(email) {
    const user = await User.findOne({ email: normalizeEmail(email) });
    if (!user) {
      return { message: "If that email exists, a reset code has been sent." };
    }
    const { expiresAt, delivery } = await issueOtp(user, "reset");
    return { message: otpDeliveryMessage(delivery, "Password reset code sent."), expiresAt, emailSent: !!delivery?.sent };
  },

  async resetPassword(email, code, newPassword) {
    const user = await User.findOne({ email: normalizeEmail(email) }).select("+passwordHash +passwordResetCodeHash");
    if (!user) {
      throw new BadRequestError("Invalid reset request");
    }
    assertOtpValid(user, "reset", String(code));
    user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST_FACTOR);
    user.passwordResetCodeHash = null;
    user.passwordResetCodeExpiresAt = null;
    await user.save();
    return { message: "Password updated successfully" };
  },

  async resendVerificationCode(email) {
    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return { message: "If that email exists, a verification code has been sent." };
    }
    if (user.emailVerified) {
      return { message: "Email is already verified." };
    }
    const { delivery } = await issueOtp(user, "verify");
    return { message: otpDeliveryMessage(delivery, "Verification code resent."), emailSent: !!delivery?.sent };
  }
};

export { authService };
