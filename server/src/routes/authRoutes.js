import { Router } from "express";
import { authService } from "../services/authService.js";
import { authenticate } from "../middleware/authenticate.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validate.js";
import { registerSchema, loginSchema, merchantSignupProfileSchema, updateProfileSchema } from "../validators.js";
import { z } from "zod";
const router = Router();
const emailOnlySchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  role: z.enum(["customer", "merchant"]).optional()
});
const verifyEmailSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  code: z.string().trim().min(4).max(12),
  role: z.enum(["customer", "merchant"]).default("customer")
});
const resetPasswordSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  code: z.string().trim().min(4).max(12),
  role: z.enum(["customer", "merchant"]).default("customer"),
  password: z.string().min(8).max(128).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one lowercase letter, one uppercase letter, and one digit")
});
router.post(
  "/register",
  authLimiter,
  validate({ body: registerSchema }),
  async (req, res, next) => {
    try {
      const { email, password, role, firstName, lastName, phone, merchantProfile } = req.body;
      const result = await authService.register(email, password, role, firstName, lastName, phone, req.ip, merchantProfile);
      res.status(201).json({
        user: result.user,
        accessToken: result.tokens?.accessToken || null,
        requiresVerification: true,
        emailSent: !!result.otpDelivery?.sent,
        message: result.message || "Account created. Check your email for a verification code."
      });
    } catch (err) {
      next(err);
    }
  }
);
router.post(
  "/login",
  authLimiter,
  validate({ body: loginSchema }),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password, req.ip);
      res.cookie("refreshToken", result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1e3,
        path: "/api/v1/auth"
      });
      res.json({
        user: result.user,
        accessToken: result.tokens.accessToken
      });
    } catch (err) {
      next(err);
    }
  }
);
router.post(
  "/verify-email",
  authLimiter,
  validate({ body: verifyEmailSchema }),
  async (req, res, next) => {
    try {
      const { email, code } = req.body;
      const result = await authService.verifyEmail(email, code);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);
router.post(
  "/resend-verification",
  authLimiter,
  validate({ body: emailOnlySchema }),
  async (req, res, next) => {
    try {
      const result = await authService.resendVerificationCode(req.body.email);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);
router.post(
  "/forgot-password",
  authLimiter,
  validate({ body: emailOnlySchema }),
  async (req, res, next) => {
    try {
      const result = await authService.requestPasswordReset(req.body.email);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);
router.post(
  "/reset-password",
  authLimiter,
  validate({ body: resetPasswordSchema }),
  async (req, res, next) => {
    try {
      const { email, code, password } = req.body;
      const result = await authService.resetPassword(email, code, password);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);
const googleAuthSchema = z.object({
  credential: z.string().min(1),
  role: z.enum(["customer", "merchant"]).optional(),
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  merchantProfile: merchantSignupProfileSchema.optional(),
  isLogin: z.boolean().optional()
}).refine((data) => data.isLogin || data.role !== "merchant" || !!data.merchantProfile, {
  message: "Merchant details are required for seller accounts",
  path: ["merchantProfile"]
}).refine((data) => data.isLogin || data.role !== "customer" || (!!data.phone), {
  // We'll extract first and last name from Google token, so we mainly need phone here
  message: "Phone number is required for customers",
  path: ["phone"]
});
router.post("/google", authLimiter, validate({ body: googleAuthSchema }), async (req, res, next) => {
  try {
    const { credential, role, firstName, lastName, phone, merchantProfile, isLogin } = req.body;
    const result = await authService.loginWithGoogle(credential, req.ip, role, firstName, lastName, phone, merchantProfile, isLogin);
    res.cookie("refreshToken", result.tokens.refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", maxAge: 7 * 24 * 60 * 60 * 1e3, path: "/api/v1/auth" });
    res.json({ user: result.user, accessToken: result.tokens.accessToken });
  } catch (error) {
    next(error);
  }
});
router.post(
  "/refresh",
  authLimiter,
  async (req, res, next) => {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!refreshToken) {
        res.status(401).json({
          error: { code: "NO_REFRESH_TOKEN", message: "No refresh token provided" }
        });
        return;
      }
      const tokens = await authService.refreshTokens(refreshToken);
      res.cookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1e3,
        path: "/api/v1/auth"
      });
      res.json({ accessToken: tokens.accessToken });
    } catch (err) {
      next(err);
    }
  }
);
router.post(
  "/logout",
  authenticate,
  async (req, res, next) => {
    try {
      await authService.logout(req.user.userId);
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/api/v1/auth"
      });
      res.json({ message: "Logged out successfully" });
    } catch (err) {
      next(err);
    }
  }
);
router.get(
  "/me",
  authenticate,
  async (req, res, next) => {
    try {
      const profile = await authService.getProfile(req.user.userId);
      res.json(profile);
    } catch (err) {
      next(err);
    }
  }
);
router.put(
  "/me",
  authenticate,
  validate({ body: updateProfileSchema }),
  async (req, res, next) => {
    try {
      const { firstName, lastName, phone, merchantProfile } = req.body;
      const profile = await authService.updateProfile(req.user.userId, { firstName, lastName, phone, merchantProfile });
      res.json(profile);
    } catch (err) {
      next(err);
    }
  }
);
export {
  router as authRouter
};
