import mongoose, { Schema } from "mongoose";
const waitlistSchema = new Schema({
  listingId: { type: Schema.Types.ObjectId, ref: "Listing", required: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  status: { type: String, enum: ["waiting", "notified", "closed"], default: "waiting", index: true },
  notifiedAt: { type: Date, default: null }
}, { timestamps: true });
waitlistSchema.index({ listingId: 1, customerId: 1 }, { unique: true });
waitlistSchema.index({ listingId: 1, status: 1, createdAt: 1 });
const Waitlist = mongoose.model("Waitlist", waitlistSchema);
export {
  Waitlist
};
