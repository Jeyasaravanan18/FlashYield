import { Router } from "express";
import { z } from "zod";
import { Review } from "../models/Review.js";
import { Claim } from "../models/Claim.js";
import { authenticate } from "../middleware/authenticate.js";
import { roleGuard } from "../middleware/roleGuard.js";
import { validate } from "../middleware/validate.js";
import { BadRequestError, NotFoundError, ConflictError } from "../utils/errors.js";
const router = Router();
const createReviewSchema = z.object({
  claimId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid claim ID"),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional()
});
router.post(
  "/",
  authenticate,
  roleGuard("customer"),
  validate({ body: createReviewSchema }),
  async (req, res, next) => {
    try {
      const { claimId, rating, comment } = req.body;
      const claim = await Claim.findOne({
        _id: claimId,
        customerId: req.user.userId
      }).populate("listingId");
      if (!claim) {
        throw new NotFoundError("Claim not found");
      }
      if (claim.status !== "collected") {
        throw new BadRequestError("Can only review collected claims");
      }
      const merchantId = claim.listingId.merchantId;
      const existing = await Review.findOne({
        customerId: req.user.userId,
        claimId
      });
      if (existing) {
        throw new ConflictError("Already reviewed this claim");
      }
      const review = await Review.create({
        merchantId,
        customerId: req.user.userId,
        claimId,
        rating,
        comment
      });
      res.status(201).json(review);
    } catch (err) {
      next(err);
    }
  }
);
router.get(
  "/merchant/:merchantId",
  async (req, res, next) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const page = parseInt(req.query.page) || 1;
      const skip = (page - 1) * limit;
      const reviews = await Review.find({ merchantId: req.params.merchantId }).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("customerId", "email");
      const total = await Review.countDocuments({ merchantId: req.params.merchantId });
      const stats = await Review.aggregate([
        { $match: { merchantId: req.params.merchantId } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 }
          }
        }
      ]);
      const averageRating = stats.length > 0 ? Number(stats[0].averageRating.toFixed(1)) : 0;
      res.json({
        data: reviews,
        meta: {
          averageRating,
          totalReviews: total
        },
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (err) {
      next(err);
    }
  }
);
export {
  router as reviewRouter
};
