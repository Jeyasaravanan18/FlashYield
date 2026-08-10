import cron from "node-cron";
import { Listing } from "../models/Listing.js";
import { Claim } from "../models/Claim.js";
import { emitListingExpired } from "../socket/emitter.js";
import { logger } from "../utils/logger.js";
let expireListingsTask = null;
let cleanupClaimsTask = null;
function startCronJobs() {
  expireListingsTask = cron.schedule("* * * * *", async () => {
    try {
      const now = /* @__PURE__ */ new Date();
      const scheduledListings = await Listing.find({
        status: "scheduled",
        scheduledPublishAt: { $lte: now }
      });
      if (scheduledListings.length > 0) {
        await Listing.updateMany(
          { _id: { $in: scheduledListings.map((listing) => listing._id) } },
          { $set: { status: "active" }, $unset: { scheduledPublishAt: "" } }
        );
        logger.info({ count: scheduledListings.length }, "Published scheduled listings via cron");
      }
      const expiredListings = await Listing.find({
        status: "active",
        claimWindowEnd: { $lte: now }
      });
      if (expiredListings.length > 0) {
        await Listing.updateMany(
          {
            status: { $in: ["active", "sold_out"] },
            claimWindowEnd: { $lte: now }
          },
          { $set: { status: "expired" } }
        );
        for (const listing of expiredListings) {
          emitListingExpired(listing._id.toString());
        }
        logger.info(
          { count: expiredListings.length },
          "Expired listings via cron"
        );
      }
    } catch (err) {
      logger.error({ err }, "Error in expire-listings cron");
    }
  });
  cleanupClaimsTask = cron.schedule("*/5 * * * *", async () => {
    try {
      const now = /* @__PURE__ */ new Date();
      const claimsToExpire = await Claim.find({
        status: "reserved",
        expiresAt: { $lte: now }
      }).select("_id listingId");
      if (claimsToExpire.length === 0) return;
      const claimIds = claimsToExpire.map((c) => c._id);
      await Claim.updateMany(
        { _id: { $in: claimIds } },
        { $set: { status: "expired" } }
      );
      logger.info(
        { count: claimsToExpire.length },
        "Expired stale claims via cron"
      );
      const listingIncrements = /* @__PURE__ */ new Map();
      for (const claim of claimsToExpire) {
        const key = claim.listingId.toString();
        listingIncrements.set(key, (listingIncrements.get(key) || 0) + 1);
      }
      for (const [listingId, increment] of listingIncrements) {
        await Listing.findOneAndUpdate(
          {
            _id: listingId,
            status: { $in: ["active", "sold_out"] },
            claimWindowEnd: { $gt: now }
          },
          {
            $inc: { quantityAvailable: increment },
            $set: { status: "active" }
          }
        );
      }
    } catch (err) {
      logger.error({ err }, "Error in cleanup-claims cron");
    }
  });
  logger.info("Cron jobs started");
}
function stopCronJobs() {
  expireListingsTask?.stop();
  cleanupClaimsTask?.stop();
  logger.info("Cron jobs stopped");
}
export {
  startCronJobs,
  stopCronJobs
};
