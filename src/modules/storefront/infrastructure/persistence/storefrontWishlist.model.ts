import mongoose, { Schema, Document } from "mongoose";

export interface IStorefrontWishlistDoc extends Document<any, any, any> {
  _id: string;
  organizationId: string;
  customerId: string;
  productId: string;
  variantId?: string | null;
  addedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StorefrontWishlistSchema = new Schema<IStorefrontWishlistDoc>({
  _id:            { type: String, required: true },
  organizationId: { type: String, required: true },
  customerId:     { type: String, required: true },
  productId:      { type: String, required: true },
  variantId:      { type: String, default: null },
  addedAt:        { type: Date, default: Date.now },
}, { _id: false, timestamps: true });

StorefrontWishlistSchema.index({ organizationId: 1, customerId: 1, productId: 1 }, { unique: true });
StorefrontWishlistSchema.index({ organizationId: 1, customerId: 1 });

export const StorefrontWishlistModel = mongoose.model<IStorefrontWishlistDoc>(
  "FwStorefrontWishlist",
  StorefrontWishlistSchema,
);
