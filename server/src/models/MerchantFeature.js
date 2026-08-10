import mongoose, { Schema } from "mongoose";

const merchantTemplateSchema = new Schema(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: "MerchantProfile", required: true, index: true },
    name: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    category: { type: String, default: "other" },
    originalPrice: { type: Number, required: true },
    discountedPrice: { type: Number, required: true },
    quantityTotal: { type: Number, required: true },
    dietaryTags: { type: [String], default: [] },
    allergenInfo: { type: String, default: "", trim: true },
    handlingNotes: { type: String, default: "", trim: true }
  },
  { timestamps: true }
);

const merchantHandoffSchema = new Schema(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: "MerchantProfile", required: true, index: true },
    note: { type: String, required: true, trim: true, maxlength: 1000 },
    authorName: { type: String, default: "", trim: true }
  },
  { timestamps: true }
);

const merchantNotificationSchema = new Schema(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: "MerchantProfile", required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true }
  },
  { timestamps: true }
);

const noShowSchema = new Schema(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: "MerchantProfile", required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    count: { type: Number, default: 1 }
  },
  { timestamps: true }
);

const MerchantTemplate = mongoose.model("MerchantTemplate", merchantTemplateSchema);
const MerchantHandoff = mongoose.model("MerchantHandoff", merchantHandoffSchema);
const MerchantNotification = mongoose.model("MerchantNotification", merchantNotificationSchema);
const MerchantNoShow = mongoose.model("MerchantNoShow", noShowSchema);

export { MerchantTemplate, MerchantHandoff, MerchantNotification, MerchantNoShow };
