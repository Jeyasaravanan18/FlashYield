import { Router, Request, Response, NextFunction } from 'express';
import { MerchantProfile } from '../models/MerchantProfile';
import { Listing } from '../models/Listing';
import { authenticate } from '../middleware/authenticate';
import { roleGuard } from '../middleware/roleGuard';
import { validate } from '../middleware/validate';
import {
  updateMerchantStatusSchema,
  auditLogQuerySchema,
  objectIdParamSchema,
} from '../validators';
import { auditService } from '../services/auditService';
import { NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, roleGuard('admin'));

// GET /api/v1/admin/merchants — list merchants by verification status
router.get(
  '/merchants',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = req.query.status as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const query: any = {};
      if (status) query.verificationStatus = status;

      const total = await MerchantProfile.countDocuments(query);
      const merchants = await MerchantProfile.find(query)
        .populate({ path: 'userId', select: 'email createdAt lastLoginAt' })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      res.json({
        data: merchants,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } catch (err) {
      next(err);
    }
  },
);

// PUT /api/v1/admin/merchants/:id/status — approve or suspend a merchant
router.put(
  '/merchants/:id/status',
  validate({ params: objectIdParamSchema, body: updateMerchantStatusSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const merchant = await MerchantProfile.findById(req.params.id);
      if (!merchant) {
        throw new NotFoundError('Merchant not found');
      }

      const oldStatus = merchant.verificationStatus;
      merchant.verificationStatus = req.body.status;
      await merchant.save();

      const action =
        req.body.status === 'approved' ? 'merchant_approved' : 'merchant_suspended';

      await auditService.log({
        action,
        actorId: req.user!.userId,
        actorRole: 'admin',
        targetType: 'MerchantProfile',
        targetId: merchant._id,
        metadata: {
          oldStatus,
          newStatus: req.body.status,
          reason: req.body.reason,
        },
        ipAddress: req.ip,
      });

      logger.info(
        {
          merchantId: merchant._id,
          oldStatus,
          newStatus: req.body.status,
          adminId: req.user!.userId,
        },
        `Merchant ${req.body.status}`,
      );

      res.json({ message: `Merchant ${req.body.status}`, merchant });
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/v1/admin/audit-logs — paginated audit logs
router.get(
  '/audit-logs',
  validate({ query: auditLogQuerySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { action, actorId, page, limit } = req.query as any;
      const result = await auditService.query({ action, actorId, page, limit });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/v1/admin/listings — all listings with moderation controls
router.get(
  '/listings',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;

      const query: any = {};
      if (status) query.status = status;

      const total = await Listing.countDocuments(query);
      const listings = await Listing.find(query)
        .populate({
          path: 'merchantId',
          select: 'businessName address userId',
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      res.json({
        data: listings,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/v1/admin/listings/:id — moderate/remove a listing
router.delete(
  '/listings/:id',
  validate({ params: objectIdParamSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const listing = await Listing.findByIdAndUpdate(
        req.params.id,
        { status: 'cancelled' },
        { new: true },
      );

      if (!listing) {
        throw new NotFoundError('Listing not found');
      }

      await auditService.log({
        action: 'listing_moderated',
        actorId: req.user!.userId,
        actorRole: 'admin',
        targetType: 'Listing',
        targetId: listing._id,
        metadata: { title: listing.title },
        ipAddress: req.ip,
      });

      res.json({ message: 'Listing moderated', listing });
    } catch (err) {
      next(err);
    }
  },
);

export { router as adminRouter };
