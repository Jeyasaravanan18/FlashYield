import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { claimService } from '../services/claimService';
import { authenticate } from '../middleware/authenticate';
import { roleGuard } from '../middleware/roleGuard';
import { claimLimiter, tokenVerifyLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validate';
import {
  createClaimSchema,
  verifyTokenSchema,
  objectIdParamSchema,
} from '../validators';

const router = Router();

// POST /api/v1/claims — create a claim (customer only)
router.post(
  '/',
  authenticate,
  roleGuard('customer'),
  claimLimiter,
  validate({ body: createClaimSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Use client-supplied idempotency key or generate one
      const idempotencyKey =
        (req.headers['x-idempotency-key'] as string) || uuidv4();

      const result = await claimService.createClaim(
        req.user!.userId,
        req.body.listingId,
        idempotencyKey,
      );

      res.status(201).json({
        claim: result.claim,
        token: result.token,
        message: 'Claim successful! Show this token at the store for pickup.',
      });
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/v1/claims/my — get customer's claims
router.get(
  '/my',
  authenticate,
  roleGuard('customer'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string | undefined;

      const result = await claimService.getCustomerClaims(req.user!.userId, {
        page,
        limit,
        status,
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/v1/claims/:id — cancel a claim (customer only)
router.delete(
  '/:id',
  authenticate,
  roleGuard('customer'),
  validate({ params: objectIdParamSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const claim = await claimService.cancelClaim(String(req.params.id), req.user!.userId);
      res.json({ message: 'Claim cancelled', claim });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/v1/claims/verify — verify a pickup token (merchant only)
router.post(
  '/verify',
  authenticate,
  roleGuard('merchant'),
  tokenVerifyLimiter,
  validate({ body: verifyTokenSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const claim = await claimService.verifyToken(
        req.body.token,
        req.user!.userId,
        req.ip,
      );
      res.json({
        message: 'Token verified — pickup collected!',
        claim,
      });
    } catch (err) {
      next(err);
    }
  },
);

export { router as claimRouter };
