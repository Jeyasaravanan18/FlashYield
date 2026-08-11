import { Listing } from "../models/Listing.js";
import { MerchantProfile } from "../models/MerchantProfile.js";
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError
} from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { auditService } from "./auditService.js";
const listingService = {
  /**
   * Create a new listing. Validates the merchant is approved.
   */
  async createListing(merchantUserId, data) {
    const merchant = await MerchantProfile.findOne({ userId: merchantUserId });
    if (!merchant) {
      throw new BadRequestError(
        "Merchant profile not found. Please create a profile first."
      );
    }
    if (merchant.verificationStatus !== "approved") {
      throw new ForbiddenError(
        "Your merchant account must be approved before creating listings"
      );
    }
    if (new Date(data.claimWindowEnd) <= /* @__PURE__ */ new Date()) {
      throw new BadRequestError("Claim window end must be in the future");
    }
    const scheduledPublishAt = data.scheduledPublishAt ? new Date(data.scheduledPublishAt) : null;
    const isScheduled = scheduledPublishAt && scheduledPublishAt > new Date();
    const listing = await Listing.create({
      merchantId: merchant._id,
      title: data.title,
      description: data.description,
      imageUrl: data.imageUrl,
      category: data.category,
      dietaryTags: data.dietaryTags || [],
      allergenInfo: data.allergenInfo || "",
      handlingNotes: data.handlingNotes || "",
      originalPrice: data.originalPrice,
      discountedPrice: data.discountedPrice,
      quantityTotal: data.quantityTotal,
      quantityAvailable: data.quantityTotal,
      // Initially all available
      claimWindowStart: data.claimWindowStart,
      claimWindowEnd: data.claimWindowEnd,
      scheduledPublishAt,
      status: isScheduled ? "scheduled" : "active"
    });
    await auditService.log({
      action: "listing_created",
      actorId: merchantUserId,
      actorRole: "merchant",
      targetType: "Listing",
      targetId: listing._id,
      metadata: { title: listing.title, quantity: listing.quantityTotal }
    });
    logger.info(
      { listingId: listing._id, merchantId: merchant._id },
      "Listing created"
    );
    return listing;
  },
  /**
   * Create multiple listings at once. Validates the merchant is approved.
   */
  async createBatchListings(merchantUserId, items) {
    const merchant = await MerchantProfile.findOne({ userId: merchantUserId });
    if (!merchant) {
      throw new BadRequestError(
        "Merchant profile not found. Please create a profile first."
      );
    }
    if (merchant.verificationStatus !== "approved") {
      throw new ForbiddenError(
        "Your merchant account must be approved before creating listings"
      );
    }

    const listingsToCreate = items.map(data => {
      if (new Date(data.claimWindowEnd) <= new Date()) {
        throw new BadRequestError(`Claim window end for ${data.title} must be in the future`);
      }
      const scheduledPublishAt = data.scheduledPublishAt ? new Date(data.scheduledPublishAt) : null;
      const isScheduled = scheduledPublishAt && scheduledPublishAt > new Date();
      
      return {
        merchantId: merchant._id,
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        category: data.category,
        dietaryTags: data.dietaryTags || [],
        allergenInfo: data.allergenInfo || "",
        handlingNotes: data.handlingNotes || "",
        originalPrice: data.originalPrice,
        discountedPrice: data.discountedPrice,
        quantityTotal: data.quantityTotal,
        quantityAvailable: data.quantityTotal,
        claimWindowStart: data.claimWindowStart,
        claimWindowEnd: data.claimWindowEnd,
        scheduledPublishAt,
        status: isScheduled ? "scheduled" : "active"
      };
    });

    const createdListings = await Listing.insertMany(listingsToCreate);
    
    await auditService.log({
      action: "batch_listing_created",
      actorId: merchantUserId,
      actorRole: "merchant",
      targetType: "Listing",
      metadata: { count: createdListings.length }
    });
    
    logger.info(
      { merchantId: merchant._id, count: createdListings.length },
      "Batch listings created"
    );
    
    return { items: createdListings, count: createdListings.length };
  },
  /**
   * Get active listings near a location using geo queries.
   * Queries by merchant location with $nearSphere via aggregation.
   */
  async getNearbyListings(params) {
    const { lng, lat, radiusKm, page, limit, category, dietaryTags } = params;
    const skip = (page - 1) * limit;
    const radiusMeters = radiusKm * 1e3;
    const now = /* @__PURE__ */ new Date();
    const matchStage = {
      "listing.status": "active",
      "listing.claimWindowEnd": { $gt: now }
    };
    if (category) {
      matchStage["listing.category"] = category;
    }
    const pipeline = [
      {
        $geoNear: {
          near: { type: "Point", coordinates: [lng, lat] },
          distanceField: "distance",
          maxDistance: radiusMeters,
          spherical: true,
          query: { verificationStatus: "approved" }
        }
      },
      {
        $lookup: {
          from: "listings",
          localField: "_id",
          foreignField: "merchantId",
          as: "listings",
          pipeline: [
            {
              $match: {
                status: "active",
                claimWindowEnd: { $gt: now },
                ...category ? { category } : {},
                ...dietaryTags ? { dietaryTags: { $in: dietaryTags.split(",") } } : {}
              }
            }
          ]
        }
      },
      { $unwind: "$listings" },
      {
        $project: {
          _id: "$listings._id",
          title: "$listings.title",
          description: "$listings.description",
          imageUrl: "$listings.imageUrl",
          category: "$listings.category",
          dietaryTags: "$listings.dietaryTags",
          allergenInfo: "$listings.allergenInfo",
          handlingNotes: "$listings.handlingNotes",
          originalPrice: "$listings.originalPrice",
          discountedPrice: "$listings.discountedPrice",
          quantityTotal: "$listings.quantityTotal",
          quantityAvailable: "$listings.quantityAvailable",
          claimWindowStart: "$listings.claimWindowStart",
          claimWindowEnd: "$listings.claimWindowEnd",
          status: "$listings.status",
          createdAt: "$listings.createdAt",
          merchant: {
            _id: "$_id",
            businessName: "$businessName",
            address: "$address",
            location: "$location",
            imageUrl: "$imageUrl"
          },
          distance: { $round: ["$distance", 0] }
          // meters
        }
      },
      { $sort: { distance: 1, "listings.createdAt": -1 } }
    ];
    try {
      const countPipeline = [...pipeline, { $count: "total" }];
      const countResult = await MerchantProfile.aggregate(countPipeline);
      const total = countResult.length > 0 ? countResult[0].total : 0;
      pipeline.push({ $skip: skip }, { $limit: limit });
      const data = await MerchantProfile.aggregate(pipeline);
      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (err) {
      const message = String(err?.message || "");
      const isGeoIndexProblem = message.includes("$geoNear") || message.includes("2dsphere") || message.includes("geo");
      if (!isGeoIndexProblem) throw err;
      logger.warn({ err }, "Nearby geo query failed; falling back to non-distance listing feed");
      const fallbackQuery = {
        status: "active",
        claimWindowEnd: { $gt: now },
        ...(category ? { category } : {}),
        ...(dietaryTags ? { dietaryTags: { $in: dietaryTags.split(",") } } : {})
      };
      const total = await Listing.countDocuments(fallbackQuery);
      const listings = await Listing.find(fallbackQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "merchantId",
          match: { verificationStatus: "approved" },
          select: "businessName address location imageUrl"
        })
        .lean();
      const data = listings
        .filter((listing) => listing.merchantId)
        .map((listing) => {
          const { merchantId, ...rest } = listing;
          return {
            ...rest,
            merchant: {
              _id: merchantId._id,
              businessName: merchantId.businessName,
              address: merchantId.address,
              location: merchantId.location,
              imageUrl: merchantId.imageUrl
            },
            distance: null
          };
        });
      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        degraded: true
      };
    }
  },
  /**
   * Get a single listing by ID, populated with merchant info.
   */
  async getListingById(listingId) {
    const listing = await Listing.findById(listingId).populate({
      path: "merchantId",
      select: "businessName address location imageUrl phone operatingHours verificationStatus"
    }).lean();
    if (!listing) {
      throw new NotFoundError("Listing not found");
    }
    return listing;
  },
  /**
   * Update a listing. Only the owning merchant can update.
   */
  async updateListing(listingId, merchantUserId, data) {
    const merchant = await MerchantProfile.findOne({ userId: merchantUserId });
    if (!merchant) {
      throw new NotFoundError("Merchant profile not found");
    }
    const listing = await Listing.findOne({
      _id: listingId,
      merchantId: merchant._id
    });
    if (!listing) {
      throw new NotFoundError("Listing not found or you do not own it");
    }
    if (listing.status === "expired" || listing.status === "cancelled") {
      throw new BadRequestError("Cannot update an expired or cancelled listing");
    }
    Object.assign(listing, data);
    await listing.save();
    await auditService.log({
      action: "listing_updated",
      actorId: merchantUserId,
      actorRole: "merchant",
      targetType: "Listing",
      targetId: listing._id,
      metadata: { updatedFields: Object.keys(data) }
    });
    return listing;
  },
  /**
   * Cancel a listing (soft delete). Ownership verified.
   */
  async cancelListing(listingId, merchantUserId) {
    const merchant = await MerchantProfile.findOne({ userId: merchantUserId });
    if (!merchant) {
      throw new NotFoundError("Merchant profile not found");
    }
    const listing = await Listing.findOneAndUpdate(
      {
        _id: listingId,
        merchantId: merchant._id,
        status: { $in: ["active", "sold_out"] }
      },
      { status: "cancelled" },
      { new: true }
    );
    if (!listing) {
      throw new NotFoundError("Listing not found, not owned by you, or already cancelled/expired");
    }
    await auditService.log({
      action: "listing_cancelled",
      actorId: merchantUserId,
      actorRole: "merchant",
      targetType: "Listing",
      targetId: listing._id
    });
    logger.info({ listingId }, "Listing cancelled");
    return listing;
  },
  /**
   * Get listings by merchant (for merchant dashboard).
   */
  async getMerchantListings(merchantUserId, params) {
    const merchant = await MerchantProfile.findOne({ userId: merchantUserId });
    if (!merchant) {
      throw new NotFoundError("Merchant profile not found");
    }
    const query = { merchantId: merchant._id };
    if (params.status) {
      query.status = params.status;
    }
    const total = await Listing.countDocuments(query);
    const data = await Listing.find(query).sort({ createdAt: -1 }).skip((params.page - 1) * params.limit).limit(params.limit).lean();
    return {
      data,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit)
      }
    };
  }
};
export {
  listingService
};
