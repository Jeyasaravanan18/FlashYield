import mongoose, { Schema } from "mongoose";
import { LISTING_STATUSES } from "../types.js";
const LISTING_CATEGORIES = [
  "bakery",
  "prepared_meals",
  "produce",
  "dairy",
  "beverages",
  "snacks",
  "mixed_bundle",
  "other"
];
const DIETARY_TAGS = [
  "vegetarian",
  "vegan",
  "gluten-free",
  "nut-free",
  "dairy-free",
  "halal"
];
const listingSchema = new Schema(
  {
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: "MerchantProfile",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, "Listing title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"]
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2e3, "Description cannot exceed 2000 characters"],
      default: ""
    },
    imageUrl: {
      type: String,
      default: ""
    },
    category: {
      type: String,
      enum: {
        values: LISTING_CATEGORIES,
        message: `Category must be one of: ${LISTING_CATEGORIES.join(", ")}`
      },
      required: true,
      default: "other"
    },
    dietaryTags: {
      type: [String],
      enum: {
        values: DIETARY_TAGS,
        message: "Invalid dietary tag"
      },
      default: []
    },
    allergenInfo: { type: String, trim: true, maxlength: [500, "Allergen information cannot exceed 500 characters"], default: "" },
    handlingNotes: { type: String, trim: true, maxlength: [500, "Handling notes cannot exceed 500 characters"], default: "" },
    originalPrice: {
      type: Number,
      required: [true, "Original price is required"],
      min: [0.01, "Price must be greater than 0"]
    },
    discountedPrice: {
      type: Number,
      required: [true, "Discounted price is required"],
      min: [0, "Discounted price cannot be negative"],
      validate: {
        validator: function(value) {
          return value < this.originalPrice;
        },
        message: "Discounted price must be less than the original price"
      }
    },
    quantityTotal: {
      type: Number,
      required: [true, "Total quantity is required"],
      min: [1, "Quantity must be at least 1"],
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be a whole number"
      }
    },
    quantityAvailable: {
      type: Number,
      required: true,
      min: [0, "Available quantity cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Available quantity must be a whole number"
      }
    },
    claimWindowStart: {
      type: Date,
      required: [true, "Claim window start is required"]
    },
    scheduledPublishAt: {
      type: Date,
      default: null
    },
    promotionMode: {
      type: String,
      enum: ["favorites", "radius", "sell_fastest", "standard"],
      default: "standard"
    },
    claimWindowEnd: {
      type: Date,
      required: [true, "Claim window end is required"],
      validate: {
        validator: function(value) {
          return value > this.claimWindowStart;
        },
        message: "Claim window end must be after start"
      }
    },
    status: {
      type: String,
      enum: {
        values: LISTING_STATUSES,
        message: "Status must be one of: draft, scheduled, active, sold_out, expired, cancelled"
      },
      default: "active",
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        const obj = ret;
        delete obj.__v;
        return obj;
      }
    },
    toObject: { virtuals: true }
  }
);
listingSchema.virtual("discountPercentage").get(function() {
  if (this.originalPrice <= 0) return 0;
  return Math.round((this.originalPrice - this.discountedPrice) / this.originalPrice * 100);
});
listingSchema.index({ status: 1, claimWindowEnd: 1 });
listingSchema.index({ merchantId: 1, status: 1 });
const Listing = mongoose.model("Listing", listingSchema);
export {
  DIETARY_TAGS,
  LISTING_CATEGORIES,
  Listing
};
