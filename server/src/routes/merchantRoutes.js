import { Router } from "express";
import { MerchantProfile } from "../models/MerchantProfile.js";
import { Listing } from "../models/Listing.js";
import { Claim } from "../models/Claim.js";
import { authenticate } from "../middleware/authenticate.js";
import { roleGuard } from "../middleware/roleGuard.js";
import { validate } from "../middleware/validate.js";
import { geocodingService } from "../services/geocodingService.js";
import {
  createMerchantProfileSchema,
  updateMerchantProfileSchema
} from "../validators.js";
import { BadRequestError, NotFoundError, ConflictError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
const router = Router();
router.post(
  "/profile",
  authenticate,
  roleGuard("merchant"),
  validate({ body: createMerchantProfileSchema }),
  async (req, res, next) => {
    try {
      const existing = await MerchantProfile.findOne({ userId: req.user.userId });
      if (existing) {
        throw new ConflictError("Merchant profile already exists");
      }
      let geocoded = await geocodingService.geocodeAddress(req.body.address);
      if (!geocoded) {
        geocoded = { lat: 12.9716, lng: 77.5946 };
      }
      const profile = await MerchantProfile.create({
        userId: req.user.userId,
        businessName: req.body.businessName,
        description: req.body.description,
        address: req.body.address,
        location: {
          type: "Point",
          coordinates: [geocoded.lng, geocoded.lat]
        },
        phone: req.body.phone,
        operatingHours: req.body.operatingHours,
        verificationStatus: "pending"
      });
      logger.info(
        { userId: req.user.userId, profileId: profile._id },
        "Merchant profile created"
      );
      res.status(201).json(profile);
    } catch (err) {
      next(err);
    }
  }
);
router.get(
  "/profile",
  authenticate,
  roleGuard("merchant"),
  async (req, res, next) => {
    try {
      const profile = await MerchantProfile.findOne({ userId: req.user.userId });
      if (!profile) {
        throw new NotFoundError("Merchant profile not found");
      }
      res.json(profile);
    } catch (err) {
      next(err);
    }
  }
);
router.put(
  "/profile",
  authenticate,
  roleGuard("merchant"),
  validate({ body: updateMerchantProfileSchema }),
  async (req, res, next) => {
    try {
      const profile = await MerchantProfile.findOne({ userId: req.user.userId });
      if (!profile) {
        throw new NotFoundError("Merchant profile not found");
      }
      if (req.body.address && req.body.address !== profile.address) {
        const geocoded = await geocodingService.geocodeAddress(req.body.address);
        if (!geocoded) {
          throw new BadRequestError("Unable to geocode the new address");
        }
        profile.location = {
          type: "Point",
          coordinates: [geocoded.lng, geocoded.lat]
        };
        profile.address = req.body.address;
      }
      if (req.body.businessName) profile.businessName = req.body.businessName;
      if (req.body.description !== void 0) profile.description = req.body.description;
      if (req.body.phone) profile.phone = req.body.phone;
      if (req.body.operatingHours) profile.operatingHours = req.body.operatingHours;
      await profile.save();
      res.json(profile);
    } catch (err) {
      next(err);
    }
  }
);
router.get(
  "/dashboard",
  authenticate,
  roleGuard("merchant"),
  async (req, res, next) => {
    try {
      const profile = await MerchantProfile.findOne({ userId: req.user.userId });
      if (!profile) {
        throw new NotFoundError("Merchant profile not found");
      }
      const now = /* @__PURE__ */ new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const [
        activeListings,
        totalListings,
        todayClaims,
        totalClaims,
        collectedClaims
      ] = await Promise.all([
        Listing.countDocuments({ merchantId: profile._id, status: "active" }),
        Listing.countDocuments({ merchantId: profile._id }),
        Claim.countDocuments({
          listingId: { $in: await Listing.find({ merchantId: profile._id }).select("_id") },
          claimedAt: { $gte: todayStart }
        }),
        Claim.countDocuments({
          listingId: { $in: await Listing.find({ merchantId: profile._id }).select("_id") }
        }),
        Claim.countDocuments({
          listingId: { $in: await Listing.find({ merchantId: profile._id }).select("_id") },
          status: "collected"
        })
      ]);
      const collectionRate = totalClaims > 0 ? Math.round(collectedClaims / totalClaims * 100) : 0;
      res.json({
        profile,
        stats: {
          activeListings,
          totalListings,
          todayClaims,
          totalClaims,
          collectedClaims,
          collectionRate
        }
      });
    } catch (err) {
      next(err);
    }
  }
);
export {
  router as merchantRouter
};
