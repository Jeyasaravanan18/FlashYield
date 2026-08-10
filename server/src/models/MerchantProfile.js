import mongoose, { Schema } from "mongoose";
import {
  MERCHANT_VERIFICATION_STATUSES
} from "../types.js";
const merchantProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    businessName: {
      type: String,
      required: [true, "Business name is required"],
      trim: true,
      maxlength: [200, "Business name cannot exceed 200 characters"]
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2e3, "Description cannot exceed 2000 characters"],
      default: ""
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point"
      },
      coordinates: {
        type: [Number],
        // [longitude, latitude]
        required: true,
        validate: {
          validator: function(coords) {
            if (coords.length !== 2) return false;
            const [lng, lat] = coords;
            return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
          },
          message: "Coordinates must be valid [longitude, latitude]"
        }
      }
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true
    },
    imageUrl: {
      type: String,
      default: null
    },
    verificationStatus: {
      type: String,
      enum: {
        values: MERCHANT_VERIFICATION_STATUSES,
        message: "Status must be one of: pending, approved, suspended"
      },
      default: "approved",
      index: true
    },
    verificationDocuments: {
      type: [String],
      default: []
    },
    operatingHours: {
      type: [
        {
          day: { type: String, required: true },
          open: { type: String, required: true },
          close: { type: String, required: true }
        }
      ],
      default: []
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const obj = ret;
        delete obj.__v;
        return obj;
      }
    }
  }
);
merchantProfileSchema.index({ location: "2dsphere" });
const MerchantProfile = mongoose.model(
  "MerchantProfile",
  merchantProfileSchema
);
export {
  MerchantProfile
};
