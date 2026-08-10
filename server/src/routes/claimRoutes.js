import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { claimService } from "../services/claimService.js";
import { authenticate } from "../middleware/authenticate.js";
import { roleGuard } from "../middleware/roleGuard.js";
import { claimLimiter, tokenVerifyLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validate.js";
import {
  createClaimSchema,
  verifyTokenSchema,
  objectIdParamSchema
} from "../validators.js";
const router = Router();
router.post(
  "/",
  authenticate,
  roleGuard("customer"),
  claimLimiter,
  validate({ body: createClaimSchema }),
  async (req, res, next) => {
    try {
      const idempotencyKey = req.headers["x-idempotency-key"] || uuidv4();
      const result = await claimService.createClaim(
        req.user.userId,
        req.body.listingId,
        req.body.quantity,
        idempotencyKey
      );
      res.status(201).json({
        claim: result.claim,
        token: result.token,
        message: "Claim successful! Show this token at the store for pickup.",
        quantity: req.body.quantity
      });
    } catch (err) {
      next(err);
    }
  }
);
router.get(
  "/my",
  authenticate,
  roleGuard("customer"),
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const status = req.query.status;
      const result = await claimService.getCustomerClaims(req.user.userId, {
        page,
        limit,
        status
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);
router.delete(
  "/:id",
  authenticate,
  roleGuard("customer"),
  validate({ params: objectIdParamSchema }),
  async (req, res, next) => {
    try {
      const claim = await claimService.cancelClaim(String(req.params.id), req.user.userId);
      res.json({ message: "Claim cancelled", claim });
    } catch (err) {
      next(err);
    }
  }
);
router.post(
  "/verify",
  authenticate,
  roleGuard("merchant"),
  tokenVerifyLimiter,
  validate({ body: verifyTokenSchema }),
  async (req, res, next) => {
    try {
      const claim = await claimService.verifyToken(
        req.body.token,
        req.user.userId,
        req.ip
      );
      res.json({
        message: "Token verified \u2014 pickup collected!",
        claim
      });
    } catch (err) {
      next(err);
    }
  }
);
export {
  router as claimRouter
};
