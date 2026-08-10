import { Router } from "express";
import { Claim } from "../models/Claim.js";
import { Listing } from "../models/Listing.js";
import { MerchantProfile } from "../models/MerchantProfile.js";
import { authenticate } from "../middleware/authenticate.js";
import { roleGuard } from "../middleware/roleGuard.js";
const router = Router();
router.get(
  "/customer",
  authenticate,
  roleGuard("customer"),
  async (req, res, next) => {
    try {
      const claims = await Claim.find({ customerId: req.user.userId, status: "collected" }).populate("listingId");
      let totalSaved = 0;
      let totalOrders = claims.length;
      const categoryCounts = {};
      claims.forEach((claim) => {
        const listing = claim.listingId;
        if (listing) {
          totalSaved += listing.originalPrice - listing.discountedPrice;
          categoryCounts[listing.category] = (categoryCounts[listing.category] || 0) + 1;
        }
      });
      res.json({
        totalOrders,
        totalSaved: Math.round(totalSaved),
        categoryBreakdown: Object.entries(categoryCounts).map(([category, count]) => ({ category, count }))
      });
    } catch (err) {
      next(err);
    }
  }
);
router.get(
  "/merchant",
  authenticate,
  roleGuard("merchant"),
  async (req, res, next) => {
    try {
      const profile = await MerchantProfile.findOne({ userId: req.user.userId });
      if (!profile) {
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "Merchant profile not found" } });
      }
      const listings = await Listing.find({ merchantId: profile._id });
      const listingIds = listings.map((l) => l._id);
      const allClaims = await Claim.find({ listingId: { $in: listingIds } }).populate("listingId");
      const collectedClaims = allClaims.filter((claim) => claim.status === "collected");
      let totalRevenue = 0;
      const categoryCounts = {};
      const claimsByDate = {};
      const pickupHours = {};
      collectedClaims.forEach((claim) => {
        const listing = claim.listingId;
        if (listing) {
          totalRevenue += listing.discountedPrice;
          categoryCounts[listing.category] = (categoryCounts[listing.category] || 0) + 1;
        }
        const dateStr = claim.collectedAt.toISOString().split("T")[0];
        claimsByDate[dateStr] = (claimsByDate[dateStr] || 0) + 1;
        const hour = String(claim.collectedAt.getHours()).padStart(2, "0");
        pickupHours[hour] = (pickupHours[hour] || 0) + 1;
      });
      res.json({
        totalRevenue: Math.round(totalRevenue),
        revenueRecovered: Math.round(totalRevenue),
        totalCollected: collectedClaims.length,
        totalClaims: allClaims.length,
        foodSavedKg: Number((collectedClaims.length * 0.45).toFixed(1)),
        claimConversionRate: allClaims.length ? Math.round(collectedClaims.length / allClaims.length * 100) : 0,
        noShowRate: allClaims.length ? Math.round(allClaims.filter((claim) => claim.status === "expired").length / allClaims.length * 100) : 0,
        bestPickupWindows: Object.entries(pickupHours).sort(([, a], [, b]) => b - a).slice(0, 3).map(([hour, count]) => ({ hour: `${hour}:00`, count })),
        categoryBreakdown: Object.entries(categoryCounts).map(([category, count]) => ({ category, count })),
        recentTrend: Object.entries(claimsByDate).slice(-7).map(([date, count]) => ({ date, count }))
        // Last 7 days with activity
      });
    } catch (err) {
      next(err);
    }
  }
);
export {
  router as analyticsRouter
};
