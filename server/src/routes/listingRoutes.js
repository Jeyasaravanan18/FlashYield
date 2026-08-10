import { Router } from "express";
import { listingService } from "../services/listingService.js";
import { authenticate } from "../middleware/authenticate.js";
import { roleGuard } from "../middleware/roleGuard.js";
import { validate } from "../middleware/validate.js";
import {
  createListingSchema,
  updateListingSchema,
  nearbyListingsQuerySchema,
  objectIdParamSchema
} from "../validators.js";
const router = Router();
router.post(
  "/",
  authenticate,
  roleGuard("merchant"),
  validate({ body: createListingSchema }),
  async (req, res, next) => {
    try {
      const listing = await listingService.createListing(req.user.userId, req.body);
      res.status(201).json(listing);
    } catch (err) {
      next(err);
    }
  }
);
router.get(
  "/nearby",
  validate({ query: nearbyListingsQuerySchema }),
  async (req, res, next) => {
    try {
      const { lng, lat, radius, page, limit, category } = req.query;
      const result = await listingService.getNearbyListings({
        lng,
        lat,
        radiusKm: radius,
        page,
        limit,
        category
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);
router.get(
  "/my",
  authenticate,
  roleGuard("merchant"),
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const status = req.query.status;
      const result = await listingService.getMerchantListings(req.user.userId, {
        page,
        limit,
        status
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);
router.get(
  "/:id",
  validate({ params: objectIdParamSchema }),
  async (req, res, next) => {
    try {
      const listing = await listingService.getListingById(String(req.params.id));
      res.json(listing);
    } catch (err) {
      next(err);
    }
  }
);
router.put(
  "/:id",
  authenticate,
  roleGuard("merchant"),
  validate({ params: objectIdParamSchema, body: updateListingSchema }),
  async (req, res, next) => {
    try {
      const listing = await listingService.updateListing(
        String(req.params.id),
        req.user.userId,
        req.body
      );
      res.json(listing);
    } catch (err) {
      next(err);
    }
  }
);
router.delete(
  "/:id",
  authenticate,
  roleGuard("merchant"),
  validate({ params: objectIdParamSchema }),
  async (req, res, next) => {
    try {
      const listing = await listingService.cancelListing(String(req.params.id), req.user.userId);
      res.json({ message: "Listing cancelled", listing });
    } catch (err) {
      next(err);
    }
  }
);
export {
  router as listingRouter
};
