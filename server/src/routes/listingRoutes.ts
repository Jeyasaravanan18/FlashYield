import { Router, Request, Response, NextFunction } from 'express';
import { listingService } from '../services/listingService';
import { authenticate } from '../middleware/authenticate';
import { roleGuard } from '../middleware/roleGuard';
import { validate } from '../middleware/validate';
import {
  createListingSchema,
  updateListingSchema,
  nearbyListingsQuerySchema,
  objectIdParamSchema,
} from '../validators';

const router = Router();

// POST /api/v1/listings — create a new listing (merchant only)
router.post(
  '/',
  authenticate,
  roleGuard('merchant'),
  validate({ body: createListingSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const listing = await listingService.createListing(req.user!.userId, req.body);
      res.status(201).json(listing);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/v1/listings/nearby — get active listings near a location
router.get(
  '/nearby',
  validate({ query: nearbyListingsQuerySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { lng, lat, radius, page, limit, category } = req.query as any;
      const result = await listingService.getNearbyListings({
        lng,
        lat,
        radiusKm: radius,
        page,
        limit,
        category,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/v1/listings/my — get merchant's own listings
router.get(
  '/my',
  authenticate,
  roleGuard('merchant'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string | undefined;
      const result = await listingService.getMerchantListings(req.user!.userId, {
        page,
        limit,
        status,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/v1/listings/:id — get a single listing
router.get(
  '/:id',
  validate({ params: objectIdParamSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const listing = await listingService.getListingById(String(req.params.id));
      res.json(listing);
    } catch (err) {
      next(err);
    }
  },
);

// PUT /api/v1/listings/:id — update a listing (merchant, ownership verified)
router.put(
  '/:id',
  authenticate,
  roleGuard('merchant'),
  validate({ params: objectIdParamSchema, body: updateListingSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const listing = await listingService.updateListing(
        String(req.params.id),
        req.user!.userId,
        req.body,
      );
      res.json(listing);
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/v1/listings/:id — cancel a listing (merchant, ownership verified)
router.delete(
  '/:id',
  authenticate,
  roleGuard('merchant'),
  validate({ params: objectIdParamSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const listing = await listingService.cancelListing(String(req.params.id), req.user!.userId);
      res.json({ message: 'Listing cancelled', listing });
    } catch (err) {
      next(err);
    }
  },
);

export { router as listingRouter };
