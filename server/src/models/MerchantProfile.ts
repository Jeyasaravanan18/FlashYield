import mongoose, { Schema, Document } from 'mongoose';
import {
  MerchantVerificationStatus,
  MERCHANT_VERIFICATION_STATUSES,
  GeoPoint,
} from '../types';

export interface IMerchantProfile extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  businessName: string;
  description: string;
  address: string;
  location: GeoPoint;
  phone: string;
  imageUrl: string | null;
  verificationStatus: MerchantVerificationStatus;
  verificationDocuments: string[];
  operatingHours: {
    day: string;
    open: string;
    close: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const merchantProfileSchema = new Schema<IMerchantProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
      maxlength: [200, 'Business name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: '',
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        validate: {
          validator: function (coords: number[]) {
            if (coords.length !== 2) return false;
            const [lng, lat] = coords;
            return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
          },
          message: 'Coordinates must be valid [longitude, latitude]',
        },
      },
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    verificationStatus: {
      type: String,
      enum: {
        values: MERCHANT_VERIFICATION_STATUSES,
        message: 'Status must be one of: pending, approved, suspended',
      },
      default: 'approved',
      index: true,
    },
    verificationDocuments: {
      type: [String],
      default: [],
    },
    operatingHours: {
      type: [
        {
          day: { type: String, required: true },
          open: { type: String, required: true },
          close: { type: String, required: true },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const obj = ret as any;
        delete obj.__v;
        return obj;
      },
    },
  },
);

// GeoJSON 2dsphere index for proximity queries
merchantProfileSchema.index({ location: '2dsphere' });

export const MerchantProfile = mongoose.model<IMerchantProfile>(
  'MerchantProfile',
  merchantProfileSchema,
);
