import { Router } from "express";
import mongoose from "mongoose";
import { authenticate } from "../middleware/authenticate.js";
import { roleGuard } from "../middleware/roleGuard.js";
import { Listing } from "../models/Listing.js";
import { Waitlist } from "../models/Waitlist.js";
import { ConflictError, GoneError, NotFoundError } from "../utils/errors.js";
const router = Router();
router.post("/:listingId", authenticate, roleGuard("customer"), async (req, res, next) => {
  try {
    const listingId = String(req.params.listingId);
    if (!mongoose.Types.ObjectId.isValid(listingId)) throw new NotFoundError("Listing not found");
    const listing = await Listing.findById(listingId);
    if (!listing) throw new NotFoundError("Listing not found");
    if (listing.status === "active" && listing.quantityAvailable > 0) throw new ConflictError("This bundle is available now\u2014claim it directly.");
    if (listing.claimWindowEnd <= /* @__PURE__ */ new Date() || listing.status === "cancelled") throw new GoneError("This bundle is no longer eligible for a waitlist.");
    const existing = await Waitlist.findOne({ listingId, customerId: req.user.userId });
    if (existing) throw new ConflictError("You are already on this waitlist.");
    const entry = await Waitlist.create({ listingId, customerId: req.user.userId });
    res.status(201).json({ entry, message: "You are on the waitlist. We\u2019ll alert you if stock returns." });
  } catch (error) {
    next(error);
  }
});
router.get("/my/all", authenticate, roleGuard("customer"), async (req, res, next) => {
  try {
    const entries = await Waitlist.find({ customerId: req.user.userId, status: { $ne: "closed" } }).populate({ path: "listingId", select: "title imageUrl discountedPrice claimWindowEnd merchantId status quantityAvailable", populate: { path: "merchantId", select: "businessName address" } }).sort({ createdAt: -1 }).lean();
    res.json({ data: entries });
  } catch (error) {
    next(error);
  }
});
router.delete("/:listingId", authenticate, roleGuard("customer"), async (req, res, next) => {
  try {
    const entry = await Waitlist.findOneAndDelete({ listingId: String(req.params.listingId), customerId: req.user.userId });
    if (!entry) throw new NotFoundError("Waitlist entry not found");
    res.json({ message: "You left the waitlist." });
  } catch (error) {
    next(error);
  }
});
export {
  router as waitlistRouter
};
