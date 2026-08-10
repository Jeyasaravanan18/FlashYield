import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";
import { authenticate } from "../middleware/authenticate.js";
import { roleGuard } from "../middleware/roleGuard.js";
import { InternalServerError } from "../utils/errors.js";

const router = Router();

// Configure cloudinary if variables are present
if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET
  });
}

// Multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

router.post(
  "/image",
  authenticate,
  roleGuard("merchant"),
  upload.single("image"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      // If Cloudinary is not configured, send a local fallback mock URL or error
      if (!env.CLOUDINARY_CLOUD_NAME) {
        return res.status(200).json({
          url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
          message: "Cloudinary not configured. Fallback image returned."
        });
      }

      // Convert buffer to base64 to upload to cloudinary directly from memory
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      let dataURI = "data:" + req.file.mimetype + ";base64," + b64;

      const result = await cloudinary.uploader.upload(dataURI, {
        folder: "food-saver/merchants",
        resource_type: "image",
      });

      res.status(200).json({
        url: result.secure_url
      });
    } catch (err) {
      next(new InternalServerError("Failed to upload image", err));
    }
  }
);

export { router as uploadRouter };
