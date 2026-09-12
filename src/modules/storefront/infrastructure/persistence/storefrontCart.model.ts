import mongoose, { Schema, Document } from "mongoose";

export interface IStorefrontCartDoc extends Document<any, any, any> {
  _id: string;
  organizationId: string;
  storefrontId?: string | null;
  customerId?: string | null;
  sessionId?: string | null;
  currency: string;
  totals: { subtotal: number; discount: number; shipping: number; tax: number; total: number };
  appliedCoupons: Array<{ code: string; discountType: "percent" | "fixed"; amount: number }>;
  status: "active" | "merged" | "converted" | "abandoned" | "expired";
  abandonedAt?: Date | null;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const CartTotalsSchema = new Schema({
  subtotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  shipping: { type: Number, default: 0 },
  tax:      { type: Number, default: 0 },
  total:    { type: Number, default: 0 },
}, { _id: false });

const AppliedCouponSchema = new Schema({
  code:         { type: String, required: true },
  discountType: { type: String, enum: ["percent", "fixed"], required: true },
  amount:       { type: Number, required: true },
}, { _id: false });

const StorefrontCartSchema = new Schema<IStorefrontCartDoc>({
  _id:            { type: String, required: true },
  organizationId: { type: String, required: true },
  storefrontId:   { type: String, default: null },
  customerId:     { type: String, default: null },
  sessionId:      { type: String, default: null },
  currency:       { type: String, default: "INR" },
  totals:         { type: CartTotalsSchema, default: () => ({}) },
  appliedCoupons: { type: [AppliedCouponSchema], default: [] },
  status:         { type: String, enum: ["active", "merged", "converted", "abandoned", "expired"], default: "active" },
  abandonedAt:    { type: Date, default: null },
  expiresAt:      { type: Date, default: null },
}, { _id: false, timestamps: true });

StorefrontCartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
StorefrontCartSchema.index({ organizationId: 1, customerId: 1, status: 1 });
StorefrontCartSchema.index({ organizationId: 1, sessionId: 1, status: 1 });

export const StorefrontCartModel = mongoose.model<IStorefrontCartDoc>("FwStorefrontCart", StorefrontCartSchema);
