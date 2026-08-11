import { Router } from "express";
import { Listing } from "../models/Listing.js";
import { Claim } from "../models/Claim.js";
import { MerchantProfile } from "../models/MerchantProfile.js";
import {
  MerchantTemplate,
  MerchantHandoff,
  MerchantNotification,
  MerchantNoShow
} from "../models/MerchantFeature.js";
import { authenticate } from "../middleware/authenticate.js";
import { roleGuard } from "../middleware/roleGuard.js";
import { BadRequestError, NotFoundError } from "../utils/errors.js";
import { env } from "../config/env.js";

const router = Router();

const templates = [
  { name: "Pastry Box", title: "Assorted Pastry Box", category: "bakery", originalPrice: 450, discountedPrice: 149, quantityTotal: 6, dietaryTags: ["vegetarian"] },
  { name: "Meal Box", title: "Chef Meal Box", category: "prepared_meals", originalPrice: 350, discountedPrice: 129, quantityTotal: 8, dietaryTags: [] },
  { name: "Produce Pack", title: "Fresh Produce Pack", category: "produce", originalPrice: 300, discountedPrice: 99, quantityTotal: 10, dietaryTags: ["vegan", "gluten-free"] },
  { name: "Dairy Bundle", title: "Dairy Bundle", category: "dairy", originalPrice: 260, discountedPrice: 109, quantityTotal: 6, dietaryTags: ["vegetarian"] }
];

async function getMerchantOrThrow(userId) {
  const profile = await MerchantProfile.findOne({ userId });
  if (!profile) throw new NotFoundError("Merchant profile not found");
  return profile;
}

router.get("/templates", authenticate, roleGuard("merchant"), async (req, res, next) => {
  try {
    res.json({ templates });
  } catch (err) {
    next(err);
  }
});

router.post("/templates", authenticate, roleGuard("merchant"), async (req, res, next) => {
  try {
    const profile = await getMerchantOrThrow(req.user.userId);
    const payload = req.body || {};
    if (!payload.title || !payload.name) throw new BadRequestError("Template name and title are required");
    const template = await MerchantTemplate.create({
      merchantId: profile._id,
      name: payload.name,
      title: payload.title,
      description: payload.description || "",
      category: payload.category || "other",
      originalPrice: Number(payload.originalPrice) || 0,
      discountedPrice: Number(payload.discountedPrice) || 0,
      quantityTotal: Number(payload.quantityTotal) || 1,
      dietaryTags: Array.isArray(payload.dietaryTags) ? payload.dietaryTags : [],
      allergenInfo: payload.allergenInfo || "",
      handlingNotes: payload.handlingNotes || ""
    });
    res.status(201).json({ template });
  } catch (err) {
    next(err);
  }
});

router.patch("/templates/:id", authenticate, roleGuard("merchant"), async (req, res, next) => {
  try {
    const profile = await getMerchantOrThrow(req.user.userId);
    const template = await MerchantTemplate.findOneAndUpdate(
      { _id: req.params.id, merchantId: profile._id },
      { $set: req.body },
      { new: true }
    ).lean();
    if (!template) throw new NotFoundError("Template not found");
    res.json({ template });
  } catch (err) {
    next(err);
  }
});

router.delete("/templates/:id", authenticate, roleGuard("merchant"), async (req, res, next) => {
  try {
    const profile = await getMerchantOrThrow(req.user.userId);
    const template = await MerchantTemplate.findOneAndDelete({ _id: req.params.id, merchantId: profile._id }).lean();
    if (!template) throw new NotFoundError("Template not found");
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.get("/pricing-suggestion", authenticate, roleGuard("merchant"), async (req, res, next) => {
  try {
    const currentStock = Math.max(1, Number(req.query.stock) || 1);
    const hoursLeft = Math.max(0.25, Number(req.query.hoursLeft) || 1);
    const originalPrice = Math.max(1, Number(req.query.originalPrice) || 100);
    const sellThrough = Math.min(1, Math.max(0, Number(req.query.sellThrough) || 0.5));
    const urgency = Math.min(1, 1 / hoursLeft);
    const stockPressure = Math.min(1, currentStock / 20);
    const discountPct = Math.min(85, Math.max(15, Math.round(20 + urgency * 35 + stockPressure * 20 + sellThrough * 10)));
    const suggestedPrice = Math.max(1, Math.round(originalPrice * (1 - discountPct / 100)));
    res.json({ originalPrice, suggestedPrice, discountPct, confidence: Math.round((urgency + sellThrough) / 2 * 100) });
  } catch (err) {
    next(err);
  }
});

router.post("/duplicate-last", authenticate, roleGuard("merchant"), async (req, res, next) => {
  try {
    const profile = await getMerchantOrThrow(req.user.userId);
    const last = await Listing.findOne({ merchantId: profile._id, status: { $in: ["active", "sold_out", "expired", "cancelled"] } }).sort({ createdAt: -1 }).lean();
    if (!last) throw new NotFoundError("No previous listing found");
    const copy = await Listing.create({
      merchantId: profile._id,
      title: `${last.title} (Copy)`,
      description: last.description,
      imageUrl: last.imageUrl,
      category: last.category,
      dietaryTags: last.dietaryTags || [],
      allergenInfo: last.allergenInfo || "",
      handlingNotes: last.handlingNotes || "",
      originalPrice: last.originalPrice,
      discountedPrice: last.discountedPrice,
      quantityTotal: last.quantityTotal,
      quantityAvailable: last.quantityTotal,
      claimWindowStart: new Date(),
      claimWindowEnd: new Date(Date.now() + 2 * 60 * 60 * 1000),
      promotionMode: last.promotionMode || "standard",
      status: "active"
    });
    res.status(201).json({ listing: copy });
  } catch (err) {
    next(err);
  }
});

router.post("/batch-create", authenticate, roleGuard("merchant"), async (req, res, next) => {
  try {
    const profile = await getMerchantOrThrow(req.user.userId);
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (items.length === 0) throw new BadRequestError("Items are required");
    const listings = [];
    for (const item of items) {
      if (!item.title || !item.originalPrice || !item.discountedPrice) continue;
      const listing = await Listing.create({
        merchantId: profile._id,
        title: item.title,
        description: item.description || "",
        imageUrl: item.imageUrl || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
        category: item.category || "other",
        dietaryTags: Array.isArray(item.dietaryTags) ? item.dietaryTags : [],
        allergenInfo: item.allergenInfo || "",
        handlingNotes: item.handlingNotes || "",
        originalPrice: Number(item.originalPrice),
        discountedPrice: Number(item.discountedPrice),
        quantityTotal: Number(item.quantityTotal) || 1,
        quantityAvailable: Number(item.quantityTotal) || 1,
        claimWindowStart: item.claimWindowStart ? new Date(item.claimWindowStart) : new Date(),
        claimWindowEnd: item.claimWindowEnd ? new Date(item.claimWindowEnd) : new Date(Date.now() + 2 * 60 * 60 * 1000),
        scheduledPublishAt: item.scheduledPublishAt ? new Date(item.scheduledPublishAt) : null,
        promotionMode: item.promotionMode || "standard",
        status: item.scheduledPublishAt ? "scheduled" : "active"
      });
      listings.push(listing);
    }
    res.status(201).json({ listings });
  } catch (err) {
    next(err);
  }
});

router.post("/batch-upload", authenticate, roleGuard("merchant"), async (req, res, next) => {
  try {
    const profile = await getMerchantOrThrow(req.user.userId);
    const rows = Array.isArray(req.body?.items) ? req.body.items : [];
    const created = [];
    for (const row of rows) {
      if (!row.title) continue;
      created.push(await Listing.create({
        merchantId: profile._id,
        title: row.title,
        description: row.description || "",
        imageUrl: row.imageUrl || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
        category: row.category || "other",
        dietaryTags: Array.isArray(row.dietaryTags) ? row.dietaryTags : [],
        allergenInfo: row.allergenInfo || "",
        handlingNotes: row.handlingNotes || "",
        originalPrice: Number(row.originalPrice) || 1,
        discountedPrice: Number(row.discountedPrice) || 1,
        quantityTotal: Number(row.quantityTotal) || 1,
        quantityAvailable: Number(row.quantityTotal) || 1,
        claimWindowStart: row.claimWindowStart ? new Date(row.claimWindowStart) : new Date(),
        claimWindowEnd: row.claimWindowEnd ? new Date(row.claimWindowEnd) : new Date(Date.now() + 2 * 60 * 60 * 1000),
        scheduledPublishAt: row.scheduledPublishAt ? new Date(row.scheduledPublishAt) : null,
        promotionMode: row.promotionMode || "standard",
        status: row.scheduledPublishAt ? "scheduled" : "active"
      }));
    }
    res.status(201).json({ created });
  } catch (err) {
    next(err);
  }
});

router.get("/queue", authenticate, roleGuard("merchant"), async (req, res, next) => {
  try {
    const profile = await getMerchantOrThrow(req.user.userId);
    const listings = await Listing.find({ merchantId: profile._id }).select("_id title quantityTotal quantityAvailable claimWindowEnd status").lean();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const claims = await Claim.find({ 
      listingId: { $in: listings.map((l) => l._id) }, 
      $or: [
        { status: "reserved" },
        { status: { $in: ["collected", "missed", "expired"] }, claimedAt: { $gte: startOfDay } }
      ]
    }).populate("customerId", "email").sort({ claimedAt: 1 }).lean();
    const queue = claims.map((claim, index) => ({
      ...claim,
      pickupOrder: index + 1,
      listingTitle: listings.find((listing) => String(listing._id) === String(claim.listingId))?.title || "",
      claimToken: claim.verificationToken || claim.pickupToken || claim.token || "",
      customerName: claim.customerId?.name || claim.customerId?.email || "",
      customerPhone: claim.customerId?.phone || "",
      verifiedAt: claim.collectedAt || null
    }));
    res.json({ claims, listings, queue });
  } catch (err) {
    next(err);
  }
});

router.post("/queue/:claimId/verify", authenticate, roleGuard("merchant"), async (req, res, next) => {
  try {
    const profile = await getMerchantOrThrow(req.user.userId);
    const claim = await Claim.findById(req.params.claimId).populate("listingId").lean();
    if (!claim || String(claim.listingId?.merchantId) !== String(profile._id)) throw new NotFoundError("Claim not found");
    await Claim.updateOne({ _id: claim._id }, { $set: { status: "collected", collectedAt: new Date() } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post("/queue/:claimId/no-show", authenticate, roleGuard("merchant"), async (req, res, next) => {
  try {
    const profile = await getMerchantOrThrow(req.user.userId);
    const claim = await Claim.findById(req.params.claimId).populate("listingId").lean();
    if (!claim || String(claim.listingId?.merchantId) !== String(profile._id)) throw new NotFoundError("Claim not found");
    await MerchantNoShow.findOneAndUpdate({ merchantId: profile._id, customerId: claim.customerId }, { $inc: { count: 1 } }, { upsert: true, new: true });
    await Claim.updateOne({ _id: claim._id }, { $set: { status: "missed" } });
    
    // Ban user for 3 days and cancel active claims
    const { User } = await import("../models/User.js");
    const penaltyDurationHours = 72;
    const bannedUntil = new Date(Date.now() + penaltyDurationHours * 60 * 60 * 1000);
    await User.updateOne({ _id: claim.customerId }, { $set: { claimBannedUntil: bannedUntil }, $inc: { noShowCount: 1 } });
    
    const otherClaims = await Claim.find({ customerId: claim.customerId, status: "reserved" });
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
    
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.get("/notifications", authenticate, roleGuard("merchant"), async (req, res, next) => {
  try {
    const profile = await getMerchantOrThrow(req.user.userId);
    const notifications = await MerchantNotification.find({ merchantId: profile._id }).sort({ createdAt: -1 }).lean();
    res.json({ notifications });
  } catch (err) {
    next(err);
  }
});

router.post("/notifications", authenticate, roleGuard("merchant"), async (req, res, next) => {
  try {
    const profile = await getMerchantOrThrow(req.user.userId);
    const { type = "info", title, message } = req.body || {};
    if (!title || !message) throw new BadRequestError("Title and message are required");
    const notification = await MerchantNotification.create({ merchantId: profile._id, type, title, message });
    res.status(201).json({ notification });
  } catch (err) {
    next(err);
  }
});

router.patch("/notifications/:id", authenticate, roleGuard("merchant"), async (req, res, next) => {
  try {
    const profile = await getMerchantOrThrow(req.user.userId);
    const notification = await MerchantNotification.findOneAndUpdate(
      { _id: req.params.id, merchantId: profile._id },
      { $set: req.body },
      { new: true }
    ).lean();
    if (!notification) throw new NotFoundError("Notification not found");
    res.json({ notification });
  } catch (err) {
    next(err);
  }
});

router.delete("/notifications/:id", authenticate, roleGuard("merchant"), async (req, res, next) => {
  try {
    const profile = await getMerchantOrThrow(req.user.userId);
    const notification = await MerchantNotification.findOneAndDelete({ _id: req.params.id, merchantId: profile._id }).lean();
    if (!notification) throw new NotFoundError("Notification not found");
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.get("/handoff-log", authenticate, roleGuard("merchant"), async (req, res, next) => {
  try {
    const profile = await getMerchantOrThrow(req.user.userId);
    const logs = await MerchantHandoff.find({ merchantId: profile._id }).sort({ createdAt: -1 }).lean();
    res.json({ logs });
  } catch (err) {
    next(err);
  }
});

router.patch("/handoff-log/:id", authenticate, roleGuard("merchant"), async (req, res, next) => {
  try {
    const profile = await getMerchantOrThrow(req.user.userId);
    const log = await MerchantHandoff.findOneAndUpdate(
      { _id: req.params.id, merchantId: profile._id },
      { $set: { note: req.body?.note, authorName: req.body?.authorName } },
      { new: true }
    ).lean();
    if (!log) throw new NotFoundError("Log not found");
    res.json({ log });
  } catch (err) {
    next(err);
  }
});

router.delete("/handoff-log/:id", authenticate, roleGuard("merchant"), async (req, res, next) => {
  try {
    const profile = await getMerchantOrThrow(req.user.userId);
    const log = await MerchantHandoff.findOneAndDelete({ _id: req.params.id, merchantId: profile._id }).lean();
    if (!log) throw new NotFoundError("Log not found");
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post("/handoff-log", authenticate, roleGuard("merchant"), async (req, res, next) => {
  try {
    const profile = await getMerchantOrThrow(req.user.userId);
    if (!req.body?.note) throw new BadRequestError("Note is required");
    const log = await MerchantHandoff.create({ merchantId: profile._id, note: req.body.note, authorName: req.body.authorName || "" });
    res.status(201).json({ log });
  } catch (err) {
    next(err);
  }
});

router.get("/exports", authenticate, roleGuard("merchant"), async (req, res, next) => {
  try {
    const profile = await getMerchantOrThrow(req.user.userId);
    const listings = await Listing.find({ merchantId: profile._id }).select("_id originalPrice discountedPrice quantityTotal").lean();
    const listingIds = listings.map((l) => l._id);
    const claims = await Claim.find({ listingId: { $in: listingIds }, status: "collected" }).populate("listingId").lean();
    const revenueRecovered = claims.reduce((sum, claim) => sum + (claim.listingId?.discountedPrice || 0), 0);
    const claimsByHour = new Array(24).fill(0);
    claims.forEach((claim) => {
      const hour = new Date(claim.createdAt || Date.now()).getHours();
      claimsByHour[hour] += 1;
    });
    const csv = [
      "listingId,title,discountedPrice,status",
      ...claims.map((claim) => `${claim.listingId?._id},${String(claim.listingId?.title || "").replace(/,/g, " ")},${claim.listingId?.discountedPrice || 0},${claim.status}`)
    ].join("\n");
    const pdf = buildSimplePdf([
      "Food Saver Merchant Export",
      `Merchant ID: ${profile._id}`,
      `Revenue Recovered: ₹${revenueRecovered}`,
      `Total Collected Claims: ${claims.length}`,
      `Best Selling Hours: ${claimsByHour.map((count, hour) => count > 0 ? `${hour}:00=${count}` : "").filter(Boolean).join(", ") || "None"}`
    ]);
    res.json({
      revenueRecovered,
      csv,
      pdfBase64: pdf.toString("base64"),
      claimsByHour,
      bestSellingHours: claimsByHour.map((count, hour) => ({ hour, count })).sort((a, b) => b.count - a.count).slice(0, 5)
    });
  } catch (err) {
    next(err);
  }
});

router.post("/no-show/:customerId", authenticate, roleGuard("merchant"), async (req, res, next) => {
  try {
    const profile = await getMerchantOrThrow(req.user.userId);
    const record = await MerchantNoShow.findOneAndUpdate(
      { merchantId: profile._id, customerId: req.params.customerId },
      { $inc: { count: 1 } },
      { upsert: true, new: true }
    );
    res.json({ record });
  } catch (err) {
    next(err);
  }
});

router.get("/no-shows", authenticate, roleGuard("merchant"), async (req, res, next) => {
  try {
    const profile = await getMerchantOrThrow(req.user.userId);
    const records = await MerchantNoShow.find({ merchantId: profile._id }).sort({ count: -1 }).lean();
    res.json({ records });
  } catch (err) {
    next(err);
  }
});

router.patch("/no-shows/:customerId", authenticate, roleGuard("merchant"), async (req, res, next) => {
  try {
    const profile = await getMerchantOrThrow(req.user.userId);
    const record = await MerchantNoShow.findOneAndUpdate(
      { merchantId: profile._id, customerId: req.params.customerId },
      { $set: { count: Number(req.body?.count) || 1 } },
      { new: true, upsert: true }
    ).lean();
    res.json({ record });
  } catch (err) {
    next(err);
  }
});

router.get("/profile-tools", authenticate, roleGuard("merchant"), async (req, res, next) => {
  try {
    const profile = await getMerchantOrThrow(req.user.userId);

    // Reconstruct storeHours string from structured operatingHours
    let storeHours = "";
    if (Array.isArray(profile.operatingHours) && profile.operatingHours.length > 0) {
      const first = profile.operatingHours[0];
      if (first.day === "all") {
        // Free-text format stored as single entry
        storeHours = first.open || "";
      } else {
        // Structured format: join as readable lines
        storeHours = profile.operatingHours.map(h => `${h.day}: ${h.open} - ${h.close}`).join("\n");
      }
    }

    res.json({
      verifiedBadge: profile.verificationStatus === "approved",
      address: profile.address,
      storeHours,
      holidayClosures: [],
      pickupInstructions: profile.pickupInstructions || "Show your claim token at the counter.",
      languages: profile.languages?.join(", ") || "English",
      location: profile.location
    });
  } catch (err) {
    next(err);
  }
});

router.patch("/profile-tools", authenticate, roleGuard("merchant"), async (req, res, next) => {
  try {
    const profile = await getMerchantOrThrow(req.user.userId);
    const updates = req.body || {};

    const setFields = {};

    if (updates.address) setFields.address = updates.address;
    if (updates.pickupInstructions !== undefined) setFields.pickupInstructions = updates.pickupInstructions;
    if (updates.languages !== undefined) setFields.languages = updates.languages;
    if (updates.verifiedBadge !== undefined) setFields.verifiedBadge = updates.verifiedBadge;

    // storeHours can be either a string ("9am to 11pm") or structured array [{day,open,close}]
    if (updates.storeHours !== undefined) {
      if (typeof updates.storeHours === "string") {
        // Store free-text hours as a single entry so the structured schema doesn't reject it
        setFields.operatingHours = [{ day: "all", open: updates.storeHours, close: "" }];
      } else if (Array.isArray(updates.storeHours)) {
        setFields.operatingHours = updates.storeHours;
      }
    }

    if (updates.location && updates.location.lat != null && updates.location.lng != null) {
      setFields.location = {
        type: "Point",
        coordinates: [Number(updates.location.lng), Number(updates.location.lat)]
      };
    }

    if (Object.keys(setFields).length > 0) {
      await MerchantProfile.updateOne(
        { _id: profile._id },
        { $set: setFields }
      );
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.get("/schedule", authenticate, roleGuard("merchant"), async (req, res, next) => {
  try {
    const profile = await getMerchantOrThrow(req.user.userId);
    const listings = await Listing.find({ merchantId: profile._id, status: "scheduled" }).sort({ scheduledPublishAt: 1 }).lean();
    res.json({ listings });
  } catch (err) {
    next(err);
  }
});

router.patch("/schedule/:id", authenticate, roleGuard("merchant"), async (req, res, next) => {
  try {
    const profile = await getMerchantOrThrow(req.user.userId);
    const listing = await Listing.findOneAndUpdate(
      { _id: req.params.id, merchantId: profile._id, status: "scheduled" },
      { $set: { scheduledPublishAt: req.body?.scheduledPublishAt ? new Date(req.body.scheduledPublishAt) : null } },
      { new: true }
    ).lean();
    if (!listing) throw new NotFoundError("Scheduled listing not found");
    res.json({ listing });
  } catch (err) {
    next(err);
  }
});

router.delete("/schedule/:id", authenticate, roleGuard("merchant"), async (req, res, next) => {
  try {
    const profile = await getMerchantOrThrow(req.user.userId);
    const listing = await Listing.findOneAndUpdate(
      { _id: req.params.id, merchantId: profile._id, status: "scheduled" },
      { $set: { status: "cancelled" }, $unset: { scheduledPublishAt: "" } },
      { new: true }
    ).lean();
    if (!listing) throw new NotFoundError("Scheduled listing not found");
    res.json({ listing });
  } catch (err) {
    next(err);
  }
});

router.get("/charts", authenticate, roleGuard("merchant"), async (req, res, next) => {
  try {
    const profile = await getMerchantOrThrow(req.user.userId);
    const claims = await Claim.find({ merchantId: profile._id }).lean();
    const revenueRecovered = claims.reduce((sum, claim) => sum + (claim.discountedPrice || 0), 0);
    const byHour = new Array(24).fill(0);
    claims.forEach((claim) => {
      byHour[new Date(claim.createdAt || Date.now()).getHours()] += 1;
    });
    const bestSellingWindows = byHour.map((count, hour) => ({ hour, count })).sort((a, b) => b.count - a.count).slice(0, 5);
    res.json({ revenueRecovered, totalClaims: claims.length, byHour, bestSellingWindows });
  } catch (err) {
    next(err);
  }
});

router.get("/forecast", authenticate, roleGuard("merchant"), async (req, res, next) => {
  try {
    const profile = await getMerchantOrThrow(req.user.userId);
    const recentListings = await Listing.find({ merchantId: profile._id }).sort({ createdAt: -1 }).limit(30).lean();
    const listingIds = recentListings.map((listing) => listing._id);
    const recentClaims = await Claim.find({ listingId: { $in: listingIds } }).lean();
    if (recentListings.length === 0) {
      return res.json({
        expectedLeftover: null,
        confidence: 0,
        suggestedBundles: [],
        bestHour: null,
        signalSummary: {
          soldOutRate: 0,
          avgTakeRate: 0,
          avgDiscountPct: 0
        },
        hasHistory: false
      });
    }
    const soldOutRate = recentListings.filter((listing) => listing.status === "sold_out").length / recentListings.length;
    const avgQuantity = recentListings.reduce((sum, listing) => sum + (listing.quantityTotal || 0), 0) / recentListings.length;
    const avgDiscount = recentListings.reduce((sum, listing) => sum + ((listing.originalPrice || 0) > 0 ? ((listing.originalPrice - listing.discountedPrice) / listing.originalPrice) : 0), 0) / recentListings.length;
    const avgTakeRate = recentListings.reduce((sum, listing) => sum + ((listing.quantityTotal || 0) - (listing.quantityAvailable || 0)) / Math.max(1, listing.quantityTotal || 1), 0) / recentListings.length;
    const hourCounts = new Array(24).fill(0);
    recentClaims.forEach((claim) => {
      hourCounts[new Date(claim.createdAt || Date.now()).getHours()] += 1;
    });
    const peakCount = Math.max(...hourCounts);
    const bestHour = peakCount > 0 ? hourCounts.indexOf(peakCount) : null;
    const pace = recentListings.reduce((sum, listing) => sum + ((listing.quantityTotal || 0) - (listing.quantityAvailable || 0)), 0) / Math.max(1, recentListings.length);
    const expectedLeftover = Math.max(0, Math.round(avgQuantity * (1 - avgTakeRate) + pace * 0.35 + soldOutRate * 2));
    res.json({
      expectedLeftover,
      confidence: Math.max(20, Math.min(96, Math.round((1 - soldOutRate) * 100 + avgTakeRate * 20))),
      suggestedBundles: [
        { name: "Pastry Box", expectedLeftover: Math.max(0, Math.round(expectedLeftover * 0.6)), recommendedDiscountPct: Math.round(20 + avgDiscount * 30) },
        { name: "Meal Box", expectedLeftover: Math.max(0, Math.round(expectedLeftover * 0.4)), recommendedDiscountPct: Math.round(18 + avgTakeRate * 25) }
      ],
      bestHour,
      hasHistory: true,
      signalSummary: {
        soldOutRate: Number((soldOutRate * 100).toFixed(0)),
        avgTakeRate: Number((avgTakeRate * 100).toFixed(0)),
        avgDiscountPct: Number((avgDiscount * 100).toFixed(0))
      }
    });
  } catch (err) {
    next(err);
  }
});

router.patch("/listings/:id/promotion", authenticate, roleGuard("merchant"), async (req, res, next) => {
  try {
    const profile = await getMerchantOrThrow(req.user.userId);
    const mode = ["favorites", "radius", "sell_fastest", "standard"].includes(req.body?.promotionMode) ? req.body.promotionMode : "standard";
    const channel = mode === "favorites" ? "saved customers" : mode === "radius" ? "nearby radius" : mode === "sell_fastest" ? "urgent feed boost" : "standard";
    const listing = await Listing.findOneAndUpdate(
      { _id: req.params.id, merchantId: profile._id },
      { $set: { promotionMode: mode } },
      { new: true }
    ).lean();
    if (!listing) throw new NotFoundError("Listing not found");
    res.json({
      listing,
      targeting: {
        mode,
        channel,
        audience: mode === "favorites" ? "past customers and saved users" : mode === "radius" ? "users near current store radius" : mode === "sell_fastest" ? "highest-intent nearby users" : "general feed"
      }
    });
  } catch (err) {
    next(err);
  }
});

router.post("/chat", authenticate, async (req, res, next) => {
  try {
    const rawMessage = String(req.body?.message || "").trim();
    const message = rawMessage.toLowerCase();
    const role = req.user?.role || "customer";
    if (!message) throw new BadRequestError("Message is required");
      const fallbackReply = buildLocalChatReply(message, role);
      const openRouterReply = await getOpenRouterReply(rawMessage, role).catch(() => null);
      res.json({
        reply: cleanChatReply(openRouterReply || fallbackReply),
        role,
        provider: openRouterReply ? "openrouter" : "local"
      });
  } catch (err) {
    next(err);
  }
});

  function buildLocalChatReply(message, role) {
  if (role === "merchant") {
    if (message.includes("schedule")) return "Use the scheduled posting page to queue a listing and auto-publish it at closing time.";
    if (message.includes("no-show")) return "Open no-show management from the merchant tools to track repeat no-shows and adjust verification.";
    if (message.includes("analytics") || message.includes("chart")) return "Your merchant dashboard includes revenue recovery, claim conversion, and best-selling time windows.";
    if (message.includes("price") || message.includes("discount")) return "Use smart pricing on the Post Surplus page to choose a rescue price based on stock and pickup time left.";
  }
  if (message.includes("pickup") || message.includes("token")) return "Claim a bundle, then show the pickup token or QR code at the store counter.";
  if (message.includes("deal") || message.includes("nearby")) return "Open the live feed or map to see nearby bundles that are active right now.";
  if (message.includes("support") || message.includes("help")) return "I can help with finding deals, explaining pickup, and navigating your tickets.";
    return "I can help with nearby deals, pickup tokens, scheduled postings, pricing, no-shows, and merchant operations.";
  }

  function cleanChatReply(reply) {
    return String(reply || "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*/g, "")
      .replace(/\s+(\d+\.\s+)/g, "\n$1")
      .replace(/\s+-\s+/g, "\n- ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

async function getOpenRouterReply(message, role) {
  if (!env.OPENROUTER_API_KEY) return null;
  const baseUrl = env.OPENROUTER_BASE_URL.replace(/\/+$/, "");
  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:5173",
      "X-Title": "FlashYield Food Saver"
    },
    body: JSON.stringify({
      model: env.OPENROUTER_MODEL,
      messages: [
        {
          role: "system",
          content: [
            "You are the FlashYield Food Saver support assistant.",
            "Answer for a hyper-local surplus food marketplace.",
              "Keep replies concise, practical, and app-specific.",
              "Do not use markdown. Do not use bold markers, bullets, or asterisks.",
              "Use short plain text paragraphs or numbered steps separated by new lines.",
              "Merchant features include posting surplus bundles, scheduled posting, smart pricing, inventory templates, pickup verification, analytics, no-show management, queue, handoff notes, exports, promotions, and profile tools.",
              "Customer features include browsing nearby deals, claiming bundles, pickup tokens, waitlists, favorites, ratings, dietary labels, and support.",
              `Current user role: ${role}.`
          ].join(" ")
        },
        { role: "user", content: message }
      ],
      temperature: 0.4,
      max_tokens: 700
    })
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data?.choices?.[0]?.message?.content?.trim() || null;
}

router.post("/batch-preview", authenticate, roleGuard("merchant"), async (req, res, next) => {
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    res.json({ count: items.length, items });
  } catch (err) {
    next(err);
  }
});

router.post("/camera-suggest", authenticate, roleGuard("merchant"), async (_req, res) => {
  res.json({ title: "Suggested Bundle", category: "mixed_bundle", confidence: 68 });
});

function buildSimplePdf(lines) {
  const escapePdfText = (text) => String(text).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const stream = [
    "BT",
    "/F1 14 Tf",
    "72 760 Td",
    ...lines.flatMap((line, index) => index === 0 ? [`(${escapePdfText(line)}) Tj`] : ["0 -22 Td", `(${escapePdfText(line)}) Tj`]),
    "ET"
  ].join("\n");
  const body = [
    "%PDF-1.4",
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${Buffer.byteLength(stream, "utf8")} >> stream\n${stream}\nendstream endobj`
  ].join("\n");
  const xrefPos = Buffer.byteLength(body, "utf8") + 1;
  return Buffer.from(`${body}\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000117 00000 n \n0000000240 00000 n \n0000000300 00000 n \ntrailer << /Size 6 /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`, "utf8");
}

export { router as merchantFeatureRouter };
