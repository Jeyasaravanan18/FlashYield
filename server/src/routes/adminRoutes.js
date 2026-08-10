import { Router } from "express";
import { MerchantProfile } from "../models/MerchantProfile.js";
import { Listing } from "../models/Listing.js";
import { authenticate } from "../middleware/authenticate.js";
import { roleGuard } from "../middleware/roleGuard.js";
import { validate } from "../middleware/validate.js";
import {
  updateMerchantStatusSchema,
  auditLogQuerySchema,
  objectIdParamSchema
} from "../validators.js";
import { auditService } from "../services/auditService.js";
import { NotFoundError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
const router = Router();
router.use(authenticate, roleGuard("admin"));
router.get(
  "/merchants",
  async (req, res, next) => {
    try {
      const status = req.query.status;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const query = {};
      if (status) query.verificationStatus = status;
      const total = await MerchantProfile.countDocuments(query);
      const merchants = await MerchantProfile.find(query).populate({ path: "userId", select: "email createdAt lastLoginAt" }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean();
      res.json({
        data: merchants,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      });
    } catch (err) {
      next(err);
    }
  }
);
router.put(
  "/merchants/:id/status",
  validate({ params: objectIdParamSchema, body: updateMerchantStatusSchema }),
  async (req, res, next) => {
    try {
      const merchant = await MerchantProfile.findById(req.params.id);
      if (!merchant) {
        throw new NotFoundError("Merchant not found");
      }
      const oldStatus = merchant.verificationStatus;
      merchant.verificationStatus = req.body.status;
      await merchant.save();
      const action = req.body.status === "approved" ? "merchant_approved" : "merchant_suspended";
      await auditService.log({
        action,
        actorId: req.user.userId,
        actorRole: "admin",
        targetType: "MerchantProfile",
        targetId: merchant._id,
        metadata: {
          oldStatus,
          newStatus: req.body.status,
          reason: req.body.reason
        },
        ipAddress: req.ip
      });
      logger.info(
        {
          merchantId: merchant._id,
          oldStatus,
          newStatus: req.body.status,
          adminId: req.user.userId
        },
        `Merchant ${req.body.status}`
      );
      res.json({ message: `Merchant ${req.body.status}`, merchant });
    } catch (err) {
      next(err);
    }
  }
);
router.get(
  "/audit-logs",
  validate({ query: auditLogQuerySchema }),
  async (req, res, next) => {
    try {
      const { action, actorId, page, limit } = req.query;
      const result = await auditService.query({ action, actorId, page, limit });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);
router.get(
  "/listings",
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const status = req.query.status;
      const query = {};
      if (status) query.status = status;
      const total = await Listing.countDocuments(query);
      const listings = await Listing.find(query).populate({
        path: "merchantId",
        select: "businessName address userId"
      }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean();
      res.json({
        data: listings,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      });
    } catch (err) {
      next(err);
    }
  }
);
router.delete(
  "/listings/:id",
  validate({ params: objectIdParamSchema }),
  async (req, res, next) => {
    try {
      const listing = await Listing.findByIdAndUpdate(
        req.params.id,
        { status: "cancelled" },
        { new: true }
      );
      if (!listing) {
        throw new NotFoundError("Listing not found");
      }
      await auditService.log({
        action: "listing_moderated",
        actorId: req.user.userId,
        actorRole: "admin",
        targetType: "Listing",
        targetId: listing._id,
        metadata: { title: listing.title },
        ipAddress: req.ip
      });
      res.json({ message: "Listing moderated", listing });
    } catch (err) {
      next(err);
    }
  }
);
export {
  router as adminRouter
};
