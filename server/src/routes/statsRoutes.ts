import { Router, Request, Response, NextFunction } from 'express';
import { Claim } from '../models/Claim';
import { Listing } from '../models/Listing';
import { MerchantProfile } from '../models/MerchantProfile';

const router = Router();

/**
 * GET /api/v1/stats/impact — public platform impact metrics.
 * Returns total meals rescued (collected claims), active bundles,
 * and merchant count.
 */
router.get(
  '/impact',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const now = new Date();

      const [mealsRescued, activeBundles, merchantCount, totalSaved] =
        await Promise.all([
          // Count of successfully collected claims
          Claim.countDocuments({ status: 'collected' }),

          // Count of currently-available bundles
          Listing.countDocuments({
            status: 'active',
            quantityAvailable: { $gt: 0 },
            claimWindowEnd: { $gt: now },
          }),

          // Count of approved merchants
          MerchantProfile.countDocuments({ verificationStatus: 'approved' }),

          // Total money saved by customers (sum of price differences)
          Claim.aggregate([
            { $match: { status: 'collected' } },
            {
              $lookup: {
                from: 'listings',
                localField: 'listingId',
                foreignField: '_id',
                as: 'listing',
              },
            },
            { $unwind: '$listing' },
            {
              $group: {
                _id: null,
                totalSaved: {
                  $sum: {
                    $subtract: [
                      '$listing.originalPrice',
                      '$listing.discountedPrice',
                    ],
                  },
                },
              },
            },
          ]),
        ]);

      res.json({
        mealsRescued,
        activeBundles,
        merchantCount,
        totalSaved: totalSaved.length > 0 ? Math.round(totalSaved[0].totalSaved) : 0,
      });
    } catch (err) {
      next(err);
    }
  },
);

export { router as statsRouter };
