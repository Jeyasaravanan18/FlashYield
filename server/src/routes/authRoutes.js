import { Router } from "express";
import { authService } from "../services/authService.js";
import { authenticate } from "../middleware/authenticate.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validate.js";
import { registerSchema, loginSchema } from "../validators.js";
import { z } from "zod";
const router = Router();
router.post(
  "/register",
  authLimiter,
  validate({ body: registerSchema }),
  async (req, res, next) => {
    try {
      const { email, password, role } = req.body;
      const result = await authService.register(email, password, role, req.ip);
      res.cookie("refreshToken", result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1e3,
        // 7 days
        path: "/api/v1/auth"
      });
      res.status(201).json({
        user: result.user,
        accessToken: result.tokens.accessToken
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
router.post("/google", authLimiter, validate({ body: z.object({ credential: z.string().min(1) }) }), async (req, res, next) => {
  try {
    const result = await authService.loginWithGoogle(req.body.credential, req.ip);
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
export {
  router as authRouter
};
