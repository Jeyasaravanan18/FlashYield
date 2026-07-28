import mongoose, { Schema, Document } from 'mongoose';
import { ListingStatus, LISTING_STATUSES } from '../types';

export interface IListing extends Document {
  _id: mongoose.Types.ObjectId;
  merchantId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  dietaryTags?: string[];
  originalPrice: number;
  discountedPrice: number;
  quantityTotal: number;
  quantityAvailable: number;
  claimWindowStart: Date;
  claimWindowEnd: Date;
  status: ListingStatus;
  createdAt: Date;
  updatedAt: Date;

  // Virtuals
  discountPercentage: number;
}

const LISTING_CATEGORIES = [
  'bakery',
  'prepared_meals',
  'produce',
  'dairy',
  'beverages',
  'snacks',
  'mixed_bundle',
  'other',
] as const;

export const DIETARY_TAGS = [
  'vegetarian',
  'vegan',
  'gluten-free',
  'nut-free',
  'dairy-free',
  'halal',
] as const;

const listingSchema = new Schema<IListing>(
  {
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'MerchantProfile',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Listing title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: '',
    },
    imageUrl: {
      type: String,
      required: [true, 'Image is required for listings'],
    },
    category: {
      type: String,
      enum: {
        values: LISTING_CATEGORIES,
        message: `Category must be one of: ${LISTING_CATEGORIES.join(', ')}`,
      },
      required: true,
      default: 'other',
    },
    dietaryTags: {
      type: [String],
      enum: {
        values: DIETARY_TAGS,
        message: 'Invalid dietary tag',
      },
      default: [],
    },
    originalPrice: {
      type: Number,
      required: [true, 'Original price is required'],
      min: [0.01, 'Price must be greater than 0'],
    },
    discountedPrice: {
      type: Number,
      required: [true, 'Discounted price is required'],
      min: [0, 'Discounted price cannot be negative'],
      validate: {
        validator: function (this: IListing, value: number) {
          return value < this.originalPrice;
        },
        message: 'Discounted price must be less than the original price',
      },
    },
    quantityTotal: {
      type: Number,
      required: [true, 'Total quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      validate: {
        validator: Number.isInteger,
        message: 'Quantity must be a whole number',
      },
    },
    quantityAvailable: {
      type: Number,
      required: true,
      min: [0, 'Available quantity cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'Available quantity must be a whole number',
      },
    },
    claimWindowStart: {
      type: Date,
      required: [true, 'Claim window start is required'],
    },
    claimWindowEnd: {
      type: Date,
      required: [true, 'Claim window end is required'],
      validate: {
        validator: function (this: IListing, value: Date) {
          return value > this.claimWindowStart;
        },
        message: 'Claim window end must be after start',
      },
    },
    status: {
      type: String,
      enum: {
        values: LISTING_STATUSES,
        message: 'Status must be one of: active, sold_out, expired, cancelled',
      },
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        const obj = ret as any;
        delete obj.__v;
        return obj;
      },
    },
    toObject: { virtuals: true },
  },
);

// Virtual: discount percentage
listingSchema.virtual('discountPercentage').get(function (this: IListing) {
  if (this.originalPrice <= 0) return 0;
  return Math.round(((this.originalPrice - this.discountedPrice) / this.originalPrice) * 100);
});

// Compound index for efficient "active nearby" queries
listingSchema.index({ status: 1, claimWindowEnd: 1 });

// Index for merchant's listings
listingSchema.index({ merchantId: 1, status: 1 });

export const Listing = mongoose.model<IListing>('Listing', listingSchema);
export { LISTING_CATEGORIES };
