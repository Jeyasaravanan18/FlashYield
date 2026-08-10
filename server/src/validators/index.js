import { z } from "zod";
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format");
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});
const geoPointSchema = z.object({
  lng: z.coerce.number().min(-180).max(180),
  lat: z.coerce.number().min(-90).max(90)
});
const registerSchema = z.object({
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password cannot exceed 128 characters").regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain at least one lowercase letter, one uppercase letter, and one digit"
  ),
  role: z.enum(["customer", "merchant"]).default("customer")
});
const loginSchema = z.object({
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  password: z.string().min(1, "Password is required")
});
const operatingHourSchema = z.object({
  day: z.enum([
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday"
  ]),
  open: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time format must be HH:mm"),
  close: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time format must be HH:mm")
});
const createMerchantProfileSchema = z.object({
  businessName: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2e3).default(""),
  address: z.string().trim().min(1, "Address is required"),
  phone: z.string().trim().min(5, "Phone number is too short").max(20, "Phone number is too long"),
  operatingHours: z.array(operatingHourSchema).optional().default([])
});
const updateMerchantProfileSchema = z.object({
  businessName: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2e3).optional(),
  address: z.string().trim().min(1).optional(),
  phone: z.string().trim().min(5).max(20).optional(),
  operatingHours: z.array(operatingHourSchema).optional()
});
const createListingSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(2e3).default(""),
  imageUrl: z.string().url("Image URL must be a valid URL"),
  category: z.enum([
    "bakery",
    "prepared_meals",
    "produce",
    "dairy",
    "beverages",
    "snacks",
    "mixed_bundle",
    "other"
  ]),
  dietaryTags: z.array(z.enum([
    "vegetarian",
    "vegan",
    "gluten-free",
    "nut-free",
    "dairy-free",
    "halal"
  ])).optional().default([]),
  allergenInfo: z.string().trim().max(500).optional().default(""),
  handlingNotes: z.string().trim().max(500).optional().default(""),
  originalPrice: z.number().positive("Original price must be greater than 0"),
  discountedPrice: z.number().min(0, "Discounted price cannot be negative"),
  quantityTotal: z.number().int().min(1, "Quantity must be at least 1"),
  claimWindowStart: z.coerce.date(),
  claimWindowEnd: z.coerce.date(),
  scheduledPublishAt: z.coerce.date().optional().nullable()
}).refine((data) => data.discountedPrice < data.originalPrice, {
  message: "Discounted price must be less than original price",
  path: ["discountedPrice"]
}).refine((data) => data.claimWindowEnd > data.claimWindowStart, {
  message: "Claim window end must be after start",
  path: ["claimWindowEnd"]
});
const updateListingSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2e3).optional(),
  imageUrl: z.string().url().optional(),
  category: z.enum([
    "bakery",
    "prepared_meals",
    "produce",
    "dairy",
    "beverages",
    "snacks",
    "mixed_bundle",
    "other"
  ]).optional(),
  dietaryTags: z.array(z.enum([
    "vegetarian",
    "vegan",
    "gluten-free",
    "nut-free",
    "dairy-free",
    "halal"
  ])).optional(),
  allergenInfo: z.string().trim().max(500).optional(),
  handlingNotes: z.string().trim().max(500).optional(),
  originalPrice: z.number().positive().optional(),
  discountedPrice: z.number().min(0).optional(),
  claimWindowEnd: z.coerce.date().optional(),
  scheduledPublishAt: z.coerce.date().optional().nullable()
}).refine(
  (data) => {
    if (data.originalPrice && data.discountedPrice) {
      return data.discountedPrice < data.originalPrice;
    }
    return true;
  },
  {
    message: "Discounted price must be less than original price",
    path: ["discountedPrice"]
  }
);
const nearbyListingsQuerySchema = z.object({
  lng: z.coerce.number().min(-180).max(180),
  lat: z.coerce.number().min(-90).max(90),
  radius: z.coerce.number().min(0.1).max(50).default(5),
  // km
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  category: z.enum([
    "bakery",
    "prepared_meals",
    "produce",
    "dairy",
    "beverages",
    "snacks",
    "mixed_bundle",
    "other"
  ]).optional(),
  dietaryTags: z.string().optional()
  // Expected as a comma-separated string in query params
});
const createClaimSchema = z.object({
  listingId: objectIdSchema
});
const verifyTokenSchema = z.object({
  token: z.string().min(1, "Token is required")
});
const updateMerchantStatusSchema = z.object({
  status: z.enum(["approved", "suspended"]),
  reason: z.string().trim().max(500).optional()
});
const auditLogQuerySchema = z.object({
  action: z.string().optional(),
  actorId: objectIdSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});
const objectIdParamSchema = z.object({
  id: objectIdSchema
});
export {
  auditLogQuerySchema,
  createClaimSchema,
  createListingSchema,
  createMerchantProfileSchema,
  geoPointSchema,
  loginSchema,
  nearbyListingsQuerySchema,
  objectIdParamSchema,
  objectIdSchema,
  paginationSchema,
  registerSchema,
  updateListingSchema,
  updateMerchantProfileSchema,
  updateMerchantStatusSchema,
  verifyTokenSchema
};
