import mongoose, { Schema } from "mongoose";
const reviewSchema = new Schema(
  {
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: "MerchantProfile",
      required: true,
      index: true
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    claimId: {
      type: Schema.Types.ObjectId,
      ref: "Claim",
      required: true
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
      validate: {
        validator: Number.isInteger,
        message: "Rating must be a whole number"
      }
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, "Comment cannot exceed 500 characters"],
      default: ""
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
reviewSchema.index({ customerId: 1, claimId: 1 }, { unique: true });
reviewSchema.index({ merchantId: 1, createdAt: -1 });
const Review = mongoose.model("Review", reviewSchema);
export {
  Review
};
