import mongoose, { Schema, Document } from "mongoose";

export interface IStorefrontCartItemDoc extends Document<any, any, any> {
  _id: string;
  cartId: string;
  organizationId: string;
  productId: string;
  variantId?: string | null;
  snapshot: {
    name: string;
    sku?: string | null;
    image?: string | null;
    sellingPrice: number;
    taxRate?: number;
    isTaxInclusive?: boolean;
    hsnCode?: string | null;
  };
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  reservedUntil?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSnapshotSchema = new Schema({
  name:           { type: String, required: true },
  sku:            { type: String, default: null },
  image:          { type: String, default: null },
  sellingPrice:   { type: Number, required: true },
  taxRate:        { type: Number, default: 0 },
  isTaxInclusive: { type: Boolean, default: false },
  hsnCode:        { type: String, default: null },
}, { _id: false });

const StorefrontCartItemSchema = new Schema<IStorefrontCartItemDoc>({
  _id:            { type: String, required: true },
  cartId:         { type: String, required: true },
  organizationId: { type: String, required: true },
  productId:      { type: String, required: true },
  variantId:      { type: String, default: null },
  snapshot:       { type: CartItemSnapshotSchema, required: true },
  quantity:       { type: Number, required: true, min: 1 },
  unitPrice:      { type: Number, required: true },
  lineTotal:      { type: Number, required: true },
  reservedUntil:  { type: Date, default: null },
}, { _id: false, timestamps: true });

StorefrontCartItemSchema.index({ cartId: 1 });
StorefrontCartItemSchema.index({ organizationId: 1, productId: 1 });
StorefrontCartItemSchema.index({ reservedUntil: 1 }, { expireAfterSeconds: 0 });

export const StorefrontCartItemModel = mongoose.model<IStorefrontCartItemDoc>(
  "FwStorefrontCartItem",
  StorefrontCartItemSchema,
);
