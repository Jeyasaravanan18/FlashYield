import { Router } from "express";
import { MerchantProfile } from "../models/MerchantProfile.js";
import { Listing } from "../models/Listing.js";
import { Claim } from "../models/Claim.js";
import { User } from "../models/User.js";
import { authenticate } from "../middleware/authenticate.js";
import { roleGuard } from "../middleware/roleGuard.js";
import { validate } from "../middleware/validate.js";
import {
  updateMerchantStatusSchema,
  auditLogQuerySchema,
  objectIdParamSchema
} from "../validators.js";
import { auditService } from "../services/auditService.js";
import { NotFoundError, BadRequestError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { claimService } from "../services/claimService.js";
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

router.get("/metrics", async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalMerchants = await MerchantProfile.countDocuments({ verificationStatus: "approved" });
    const pendingMerchants = await MerchantProfile.countDocuments({ verificationStatus: "pending" });
    const totalUsers = await User.countDocuments({ role: "customer" });
    const claimsToday = await Claim.countDocuments({ createdAt: { $gte: today } });

    res.json({
      totalMerchants,
      pendingMerchants,
      totalUsers,
      claimsToday
    });
  } catch (err) {
    next(err);
  }
});

router.get("/users", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 500;
    const query = {};
    if (req.query.role) query.role = req.query.role;

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({
      data: users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    next(err);
  }
});

router.put("/users/:id/status", validate({ params: objectIdParamSchema }), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["active", "suspended"].includes(status)) {
      throw new BadRequestError("Invalid status");
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    if (user.role === "admin") {
      throw new BadRequestError("Cannot suspend admin accounts");
    }

    const oldStatus = user.status;
    user.status = status;
    await user.save();

    if (status === "suspended") {
      const { Claim } = await import("../models/Claim.js");
      const { Listing } = await import("../models/Listing.js");
      
      const otherClaims = await Claim.find({ customerId: user._id, status: "reserved" });
      if (otherClaims.length > 0) {
        const claimIds = otherClaims.map(c => c._id);
        await Claim.updateMany({ _id: { $in: claimIds } }, { $set: { status: "cancelled" } });
        
        const listingIncrements = new Map();
        for (const c of otherClaims) {
          const key = c.listingId.toString();
          listingIncrements.set(key, (listingIncrements.get(key) || 0) + (c.quantity || 1));
        }
        for (const [listingId, increment] of listingIncrements) {
          await Listing.findOneAndUpdate(
            { _id: listingId, status: { $in: ["active", "sold_out"] } },
            { $inc: { quantityAvailable: increment }, $set: { status: "active" } }
          );
        }
      }
    }

    await auditService.log({
      action: status === "suspended" ? "user_suspended" : "user_activated",
      actorId: req.user.userId,
      actorRole: "admin",
      targetType: "User",
      targetId: user._id,
      metadata: { oldStatus, newStatus: status },
      ipAddress: req.ip
    });

    res.json({ message: `User ${status}`, user });
  } catch (err) {
    next(err);
  }
});

router.put("/users/:id/unban", validate({ params: objectIdParamSchema }), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new NotFoundError("User not found");
    
    user.claimBannedUntil = null;
    await user.save();
    
    await auditService.log({
      action: "user_unbanned",
      actorId: req.user.userId,
      actorRole: "admin",
      targetType: "User",
      targetId: user._id,
      metadata: { unbanned: true },
      ipAddress: req.ip
    });
    
    res.json({ message: "User unbanned successfully", user });
  } catch (err) {
    next(err);
  }
});

router.get("/claims", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const query = {};
    if (status) query.status = status;

    const total = await Claim.countDocuments(query);
    const claims = await Claim.find(query)
      .populate("customerId", "email firstName lastName")
      .populate({
        path: "listingId",
        select: "title merchantId",
        populate: { path: "merchantId", select: "businessName" }
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({
      data: claims,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    next(err);
  }
});

router.delete("/claims/:id", validate({ params: objectIdParamSchema }), async (req, res, next) => {
  try {
    const claim = await claimService.adminCancelClaim(req.params.id, req.user.userId);
    res.json({ message: "Claim cancelled and inventory refunded", claim });
  } catch (err) {
    next(err);
  }
});

export {
  router as adminRouter
};
